# Slino for Claude

[Slino](https://slino.app) is a workspace for notes, tasks, projects, and
knowledge that you and Claude keep together. Ask Claude to save a conversation
as a Page, turn a plan into tasks, set up a tracker with a board and a table,
or find and update what you wrote before. You browse and edit the same Pages in
the Slino app, with full version history and a reversible trash.

The plugin contains:

- The Slino MCP server, hosted at `https://slino.app/mcp`. You sign in with
  your Slino account and approve read or read-write access.
- The `slino` skill, which teaches Claude how to keep a workspace organized.

The plugin runs no code on your machine. Claude sends tool requests only to
`https://slino.app/mcp`, with your sign-in.

## What it can do

- Search and read Pages and the files they reference.
- Create and update Pages, Types, and saved Views.
- See who changed a Page and restore an earlier version from its history.
- Move Pages to the trash. This is reversible; only you can delete permanently,
  in the Slino app.

Claude acts with your permissions and only in workspaces you belong to.

## Setup

You need a free Slino account. Add the plugin, then sign in to Slino when
Claude asks. [slino.app/connect](https://slino.app/connect) has the steps. You
can revoke the connection at any time from **Connections** in Slino's
workspace menu.

## Privacy

Slino's [privacy policy](https://slino.app/privacy) covers what Slino collects,
how it is used and stored, which providers process it, how long it is kept, and
how to reach us. Claude handles what it receives under Anthropic's terms.

## Support

See [slino.app/support](https://slino.app/support) or email
[support@slino.app](mailto:support@slino.app).
