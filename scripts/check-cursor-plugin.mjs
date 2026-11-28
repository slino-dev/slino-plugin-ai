// Checks .cursor-plugin/plugin.json against Cursor's manifest schema, copied
// from https://github.com/cursor/plugins/blob/main/schemas/plugin.schema.json,
// and that its logo is committed, as Cursor's submission checklist asks:
// https://cursor.com/docs/reference/plugins#submission-checklist
// Usage: node scripts/check-cursor-plugin.mjs
import { existsSync, readFileSync } from "node:fs"
import Ajv from "ajv"

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"))
const manifest = read("../.cursor-plugin/plugin.json")
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false })
const validate = ajv.compile(read("schemas/cursor-plugin.schema.json"))

const errors = []
if (!validate(manifest)) errors.push(`fails Cursor's schema: ${ajv.errorsText(validate.errors, { dataVar: "plugin.json" })}`)
if (!existsSync(new URL(`../${manifest.logo}`, import.meta.url))) errors.push(`logo ${manifest.logo} is not in the repo`)

for (const error of errors) console.error(`.cursor-plugin/plugin.json ${error}`)
process.exit(errors.length ? 1 : 0)
