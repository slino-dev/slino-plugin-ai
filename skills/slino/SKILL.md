---
name: slino
description: Organize notes, tasks, projects, and knowledge in the user's Slino workspace through the Slino MCP tools. Use when the user asks to save, find, plan, track, or tidy something in Slino, or to turn a conversation, document, or list into Slino Pages, Types, and Views.
---

# Working in Slino

Slino is a workspace that people browse and edit while you keep it organized.
Everything is a Page. A Type gives recurring Pages a shape, and a View shows a
saved query of Pages as a table, board, list, gallery, or calendar. The tools
and their descriptions hold the exact rules; this skill covers how to use them
well.

## Before you write

1. Pick the workspace yourself. Call `list_workspaces` once and keep using
   the workspace you chose for the rest of the conversation. With one
   workspace, use it. With several, use the one the user names; otherwise
   search the subject in each with `query_pages` and work where related Pages
   already are; otherwise use the one where the user is the only member
   (`memberCount` is 1), so private notes don't land where others see them.
   Ask only if that still leaves several or none. Name the workspace you used
   in your reply so the user can redirect you.
2. Look before creating. Call `query_pages` with `search` for the subject.
   Its result includes the full Types of the Pages it returns, option IDs
   included, so call `list_types` only when nothing related exists and you
   need a Type to create Pages with. Update an existing Page instead of
   creating a near duplicate.
3. Find the right parent. Tasks belong under their project, lessons under
   their course. Only places people navigate to belong at the top level.

## Fast, precise calls

Each call is a network round trip, so use as few as the task needs.

- Reuse what you already learned in this conversation: workspace, Type,
  option, and Page IDs. Don't list or query them again.
- Let the server filter. Use `typeId`, `propertyEquals`, `propertyContains`,
  `parentId`, `sort`, and a small `limit` instead of fetching broadly and
  filtering the results yourself.
- Read bodies only when the task needs the text. Summaries and lists can use
  `bodyPreview`; `read_pages` takes up to five Pages per call.
- Make independent reads at the same time when your client allows it.
- Trust write results. They return each Page's new `version` and `url`; use
  them for the next patch and your reply instead of querying again.

## Writing

- Batch related changes into one `create_pages` or `patch_pages` call so they
  succeed or fail together.
- Edit part of a long body with `bodyEdits` instead of resending all of it.
  Never drop text the user did not ask you to remove.
- Use a Type when the user will have several Pages of the same kind, such as
  tasks, contacts, or books. Extend an existing Type instead of creating a
  similar one.
- Select values are option IDs from the Type definition, never labels: send
  `{type: "text", value: OPTION_ID}`, or a text list of IDs for multi-select.
  Add a missing choice to the Type with `patch_types` first.
- Use a relation property when the link should show as a backlink, such as a
  task's project. Use a body link `[title](/pages/PAGE_ID)` for a mention in
  text.
- A Page holds either writing or Views. Create collection Pages, boards, and
  dashboards as `kind: "views"`.

## Files

Upload with `upload_files`, then reference the file from a Page body as
`![alt](/files/FILE_ID)` for images or `[name](/files/FILE_ID)` otherwise, or
from a file property. Pick the path that keeps the bytes out of your context:

- **The user attached it in ChatGPT**: pass it in `attachedFiles`.
- **You can run shell commands** and reach the file: ask for a link with
  `{uploadLink: true}` and send the file with `curl -F file=@PATH UPLOAD_URL`.
  The command prints the file and its ready-to-insert Markdown.
- **Only the user has the file**: ask for a link and give the user its
  `uploadPageUrl`, which works without signing in. Wait until they say it's
  sent.
- **A small file you wrote yourself**, under about 100 KB: send it as base64
  `data`. **A public web file**: send its `url`.

A link takes one file within 30 minutes and reserves its file ID. Before you
put that ID in a Page, confirm the file arrived with `read_files`.

If `curl` fails with "network unreachable", HTTP 000, or a 403 from a proxy,
your sandbox blocks the domain in `uploadUrl`: give the user the
`uploadPageUrl`. Only in Claude can the user instead allow the domain under
Settings → Capabilities (network egress, additional allowed domains); ChatGPT's
sandbox has no such setting.

To show the user a file, use its `signedUrl` in your reply, never in a Page.

## When a call fails

- `VERSION_CONFLICT`: someone else changed the Page. Read it again, reapply
  your change to the new version, and tell the user if the edits overlapped.
- `INVALID_PROPERTIES`: check the Type's property keys, kinds, and option IDs,
  calling `list_types` if you don't have its current definition.
- `TYPE_VERSION_CONFLICT`: list the Type again and resend its complete
  `propertyDefinitions`.
- `TYPE_NAME_TAKEN`: that Type already exists; use it.
- `PAGE_KIND_CONFLICT`: text goes on a text Page and Views on a views Page.
- `PAGINATION_RESTART_REQUIRED`: query again without the cursor.
- `UPLOAD_LINK_USED` from an upload link: the file already arrived; use its
  ID. `UPLOAD_LINK_INVALID`: the link expired; ask for a new one.

Fix the cause and retry once; if it still fails, tell the user what failed.

## Undoing and removing

- Every change is kept in Page history. To see or undo what changed, call
  `list_page_revisions`, read the candidates with `read_page_revision`, and
  put one back with `restore_page_revision`. Restoring adds a new revision and
  keeps everything after it.
- `trash_pages` is reversible and takes sub-pages with it; restore with
  `patch_pages`. Only a person can delete permanently.
- Confirm with the user before trashing Pages, or restoring a revision, they
  did not explicitly name.

## Finishing

Link every Page you mention, create, or change using its `url`. When seeing
the result helps, call `show_pages` once at the end with the final Pages.

## Common requests

- **Capture**: "save this" → one Page under the most fitting parent, with a
  clear title, an emoji, and the content in clean Markdown.
- **Task tracker**: reuse or create a Task Type with Status, Priority, and Due
  date; create a views Page with a board grouped by Status and a table sorted
  by Due date; add the tasks under it.
- **Plan from a conversation**: one parent Page with the goal and decisions,
  and a sub-page per workstream or a task per action item.
- **Review**: query Pages updated or due in the period, then summarize what
  changed, what is overdue, and what is next, linking each Page.
- **What changed**: "what did the AI change in my plan?" → list the Page's
  revisions, summarize who changed what and when, and offer to restore one.
- **Tidy up**: find untyped or misplaced Pages, propose the moves and Types,
  and apply them once the user agrees.
