# Slino plugin for AI apps

Connect [Slino](https://slino.app) to ChatGPT, Codex, Claude, Cursor, and Grok
Bot. Your AI can then read, create, and organize the Pages, Types, and Views in
your Slino workspace, while you browse and edit the same Pages in the app.

The plugin contains:

- The Slino MCP server, hosted at `https://slino.app/mcp`. You sign in with
  your Slino account and approve read or read-write access.
- The `slino` skill, which teaches your AI how to keep a workspace organized.

## Install

Find **Slino** in your app's plugin or connector directory and select Add or
Connect. Until it's listed there, add `https://slino.app/mcp` as a custom MCP
server: [slino.app/connect](https://slino.app/connect) has the steps for
ChatGPT, Claude, Grok, Codex, and other apps.

You need a free Slino account. You can revoke a connection at any time from
**Connections** in Slino's workspace menu.

## What it can do

- Search and read Pages and the files they reference.
- Create and update Pages, Types, and saved Views.
- See who changed a Page and restore an earlier version from its history.
- Move Pages to the trash. This is reversible; only you can delete permanently,
  in the Slino app.

The AI acts with your permissions and only in workspaces you belong to.

## Privacy

Slino's [privacy policy](https://slino.app/privacy) covers what Slino collects,
how it is used and stored, which providers process it, how long it is kept, and
how to reach us. The AI app you connect handles what it receives under its own
terms.

## Support

See [slino.app/support](https://slino.app/support) or email
[support@slino.app](mailto:support@slino.app).

## Layout

| Path | Used by |
| --- | --- |
| `plugin.json`, `mcp.json` | Agent Plugins format: OpenAI (ChatGPT and Codex) |
| `.cursor-plugin/plugin.json` | Cursor and Grok Bot |
| `.claude-plugin/plugin.json`, `.mcp.json` | Claude |
| `skills/slino/SKILL.md` | All of them |
| `assets/` | Logos and icons |
| `scripts/`, `.github/workflows/` | CI checks; `scripts/build-openai-zip.sh` builds the OpenAI submission ZIP from the last commit |
