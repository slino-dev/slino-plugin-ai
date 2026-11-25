// Checks an unzipped OpenAI submission package against the Agent Plugins
// schemas and the rules OpenAI applies at final directory submission:
// https://developers.openai.com/plugins/deploy/submission-errors
// Usage: node scripts/check-openai-package.mjs <package-dir>
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import Ajv from "ajv/dist/2020.js"
import addFormats from "ajv-formats"
import { parse as parseYaml } from "yaml"

const root = process.argv[2]
if (!root) {
  console.error("Usage: node scripts/check-openai-package.mjs <package-dir>")
  process.exit(2)
}

const errors = []
const fail = (message) => errors.push(message)
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"))
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value)

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
const plugin = readJson("plugin.json")
const mcp = readJson("mcp.json")
for (const [file, data] of [
  ["plugin.json", plugin],
  ["mcp.json", mcp],
]) {
  const schema = JSON.parse(readFileSync(new URL(`schemas/${file.replace(".json", ".schema.json")}`, import.meta.url)))
  const validate = ajv.compile(schema)
  if (!validate(data)) fail(`${file} fails the Agent Plugins schema: ${ajv.errorsText(validate.errors, { dataVar: file })}`)
}

// Supported text excludes control characters and Unicode line or paragraph
// separators; only multiline fields may contain line breaks.
function checkText(label, value, max, { multiline = false } = {}) {
  if (typeof value !== "string" || value.trim() === "") return fail(`${label} is required and must be non-empty text`)
  const unsupported = multiline ? /[\u0000-\u0008\u000b-\u001f\u007f\u2028\u2029]/ : /[\u0000-\u001f\u007f\u2028\u2029]/
  if (unsupported.test(value)) fail(`${label} contains ${multiline ? "unsupported characters" : "a line break or unsupported characters"}`)
  const length = [...value].length
  if (length > max) fail(`${label} is ${length} characters; the limit is ${max}`)
}

function checkUrl(label, value, max) {
  checkText(label, value, max)
  let url
  try {
    url = new URL(value)
  } catch {
    return fail(`${label} is not a valid URL`)
  }
  if (url.protocol !== "https:" || !url.hostname) fail(`${label} must be an HTTPS URL with a host`)
  if (url.username || url.password) fail(`${label} must not contain credentials`)
}

function checkColor(label, value, background) {
  if (value === undefined) return
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) return fail(`${label} must be a six-digit hex color`)
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [lighter, darker] = [luminance(value), luminance(background)].sort((a, b) => b - a)
  const contrast = (lighter + 0.05) / (darker + 0.05)
  if (contrast < 2) fail(`${label} has ${contrast.toFixed(2)}:1 contrast against ${background}; at least 2:1 is required`)
}

function packagedFile(label, path) {
  if (typeof path !== "string" || !path.startsWith("./")) fail(`${label} must be a path starting with ./`)
  else if (path.split("/").includes("..")) fail(`${label} must stay inside the plugin`)
  else if (!existsSync(join(root, path)) || !statSync(join(root, path)).isFile()) fail(`${label} references ${path}, which is not a file in the package`)
  else return join(root, path)
}

function checkImage(label, path, { required }) {
  if (path === undefined) return required && fail(`${label} is required`)
  const file = packagedFile(label, path)
  if (!file) return
  const bytes = readFileSync(file)
  if (bytes.length > 5 * 1024 * 1024) fail(`${label} (${path}) is larger than 5 MiB`)
  if (!path.toLowerCase().endsWith(".png")) return fail(`${label} (${path}): this check only reads PNG dimensions; extend it for other formats`)
  if (!bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return fail(`${label} (${path}) is not a PNG file`)
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  if (width !== height) fail(`${label} (${path}) is ${width}×${height}; it must be square`)
  if (Math.min(width, height) < 48 || Math.max(width, height) > 4096) fail(`${label} (${path}) is ${width}×${height}; it must be between 48 and 4096 pixels`)
}

function findKeys(value, keys, path = "plugin.json") {
  if (Array.isArray(value)) value.forEach((item, i) => findKeys(item, keys, `${path}[${i}]`))
  else if (isObject(value))
    for (const [key, child] of Object.entries(value)) {
      if (keys.includes(key)) fail(`${path}.${key} must not be in the package; OpenAI rejects it`)
      findKeys(child, keys, `${path}.${key}`)
    }
}

// Package identity
checkText("name", plugin.name, 64)
if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(plugin.name ?? "")) fail("name must start with a letter or digit and use only letters, digits, _ and -")
checkText("version", plugin.version, 64)
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(plugin.version ?? "")) fail("version must be a semantic version, such as 1.0.0")
checkText("description", plugin.description, 1024, { multiline: true })
checkText("author.name", plugin.author?.name, 120)
if (plugin.author?.email !== undefined) checkText("author.email", plugin.author.email, 320)
if (plugin.author?.url !== undefined) checkUrl("author.url", plugin.author.url, 2048)
if (plugin.homepage !== undefined) checkUrl("homepage", plugin.homepage, 2048)
findKeys(plugin, ["test_credentials", "reviewer_instructions"])

const openai = plugin.extensions?.["com.openai"]
if (!isObject(openai)) {
  fail('extensions["com.openai"] is required')
} else {
  for (const key of ["apps", "hooks"]) if (key in openai) fail(`com.openai.${key} must be removed; public submissions reject app references and lifecycle hooks`)
  if (existsSync(join(root, ".app.json"))) fail(".app.json must not be in the package")

  // Listing
  const ui = openai.interface ?? {}
  checkText("interface.displayName", ui.displayName, 30)
  checkText("interface.shortDescription", ui.shortDescription, 30)
  checkText("interface.longDescription", ui.longDescription, 4000, { multiline: true })
  checkText("interface.developerName", ui.developerName, 80)
  const categories = ["Productivity", "Creativity", "Developer Tools", "Business & Operations", "Data & Analytics", "Communication", "Education & Research", "Security", "Finance", "Healthcare", "Travel", "Entertainment", "Other"]
  if (!categories.includes(ui.category)) fail(`interface.category must be one of: ${categories.join(", ")}`)
  const capabilities = ui.capabilities ?? []
  if (capabilities.length > 20) fail("interface.capabilities must have at most 20 entries")
  capabilities.forEach((capability, i) => checkText(`interface.capabilities[${i}]`, capability, 120))
  for (const key of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) checkUrl(`interface.${key}`, ui[key], 1024)
  const prompts = [ui.defaultPrompt ?? []].flat()
  if (prompts.length > 3) fail("interface.defaultPrompt must have at most 3 prompts")
  prompts.forEach((prompt, i) => {
    checkText(`interface.defaultPrompt[${i}]`, prompt, 128)
    if (prompt.includes("@")) fail(`interface.defaultPrompt[${i}] must not contain an @mention`)
  })
  const normalized = prompts.map((prompt) => prompt.normalize("NFKC").trim().replace(/\s+/g, " "))
  if (new Set(normalized).size !== normalized.length) fail("interface.defaultPrompt entries must be unique")
  checkColor("interface.brandColor", ui.brandColor, "#FFFFFF")
  checkColor("interface.brandColorDark", ui.brandColorDark, "#212121")
  checkImage("interface.logo", ui.logo, { required: true })
  checkImage("interface.composerIcon", ui.composerIcon, { required: true })
  checkImage("interface.logoDark", ui.logoDark, { required: false })
  checkImage("interface.composerIconDark", ui.composerIconDark, { required: false })

  if (openai.onboardingSkill !== undefined && packagedFile("onboardingSkill", openai.onboardingSkill)) {
    if (!/^\.\/skills\/[^/]+\/SKILL\.md$/.test(openai.onboardingSkill)) fail("onboardingSkill must point to skills/<skill>/SKILL.md")
  }

  // Review materials for the initial MCP review
  const cases = openai.review?.test_cases ?? {}
  const counts = { positive: 5, negative: 3 }
  for (const [kind, count] of Object.entries(counts)) {
    const list = cases[kind] ?? []
    if (list.length !== count) fail(`review.test_cases.${kind} has ${list.length} cases; exactly ${count} are required`)
    list.forEach((testCase, i) => {
      const label = `review.test_cases.${kind}[${i}]`
      checkText(`${label}.description`, testCase.description, 4000, { multiline: true })
      checkText(`${label}.prompt`, testCase.prompt, 4000, { multiline: true })
      if (kind === "positive") {
        checkText(`${label}.tools_triggered`, testCase.tools_triggered, 4000, { multiline: true })
        checkText(`${label}.expected_behavior`, testCase.expected_behavior, 4000, { multiline: true })
      }
    })
  }
  checkUrl("review.demo_recording_url", openai.review?.demo_recording_url, 2048)
  checkText("publication.release_notes", openai.publication?.release_notes, 4000, { multiline: true })
  const countries = openai.publication?.countries
  if (countries !== undefined && !(Array.isArray(countries) && countries.every((code) => /^[A-Z]{2}$/.test(code))))
    fail("publication.countries must be a list of uppercase two-letter country codes")
}

// Plugin-level test cases require exactly one MCP server.
const servers = Object.entries(mcp.mcpServers ?? {})
if (servers.length !== 1) fail(`mcp.json declares ${servers.length} MCP servers; review.test_cases needs exactly one`)
for (const [name, server] of servers) checkUrl(`mcp.json mcpServers.${name}.url`, server.url, 2048)

// Skills
const skillsDir = join(root, "skills")
const skillDirs = existsSync(skillsDir) ? readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()) : []
if (skillDirs.length === 0) fail("the package must contain at least one skill in skills/<skill>/SKILL.md")
const skillNames = new Set()
for (const dir of skillDirs) {
  const label = `skills/${dir.name}/SKILL.md`
  if (dir.name.startsWith(".")) fail(`skills/${dir.name} must not be hidden`)
  const file = join(skillsDir, dir.name, "SKILL.md")
  if (!existsSync(file)) {
    fail(`${label} is missing`)
    continue
  }
  const match = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/)
  if (!match) {
    fail(`${label} must start with YAML front matter between --- lines`)
    continue
  }
  let frontmatter
  try {
    frontmatter = parseYaml(match[1])
  } catch (error) {
    fail(`${label} front matter is not valid YAML: ${error.message}`)
    continue
  }
  if (!isObject(frontmatter)) {
    fail(`${label} front matter must be a YAML mapping`)
    continue
  }
  checkText(`${label} name`, frontmatter.name, 64)
  checkText(`${label} description`, frontmatter.description, 1024, { multiline: true })
  if (match[2].trim() === "") fail(`${label} has no instructions after the front matter`)
  if (skillNames.has(frontmatter.name)) fail(`${label} reuses the skill name ${frontmatter.name}`)
  skillNames.add(frontmatter.name)
  if (`${plugin.name}:${frontmatter.name}`.length > 64) fail(`${label}: ${plugin.name}:${frontmatter.name} is longer than 64 characters`)
}

if (errors.length > 0) {
  for (const error of errors) console.error(`✗ ${error}`)
  console.error(`\n${errors.length} problem(s) would block the OpenAI submission.`)
  process.exit(1)
}
console.log(`✔ OpenAI package checks passed: ${plugin.name} ${plugin.version}, ${skillNames.size} skill(s), 5 positive and 3 negative review cases.`)
