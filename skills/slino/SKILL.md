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
   already are; otherwise use the one whose `kind` is `personal`. Ask only if
   none of these settles it. Name the workspace you used in your reply so
   the user can redirect you.
2. Look before creating. Call `list_types`, then `query_pages` with `search`
   for the subject. Update an existing Page instead of creating a near
   duplicate.
3. Find the right parent. Tasks belong under their project, lessons under
   their course. Only places people navigate to belong at the top level.

## Writing

- Batch related changes into one `create_pages` or `patch_pages` call so they
  succeed or fail together.
- Edit part of a long body with `bodyEdits` instead of resending all of it.
  Never drop text the user did not ask you to remove.
- Use a Type when the user will have several Pages of the same kind, such as
  tasks, contacts, or books. Extend an existing Type instead of creating a
  similar one.
- Select values are option IDs from `list_types`, never labels: send
  `{type: "text", value: OPTION_ID}`, or a text list of IDs for multi-select.
  Add a missing choice to the Type with `patch_types` first.
- Use a relation property when the link should show as a backlink, such as a
  task's project. Use a body link `[title](/pages/PAGE_ID)` for a mention in
  text.
- A Page holds either writing or Views. Create collection Pages, boards, and
  dashboards as `kind: "views"`.

## When a call fails

- `VERSION_CONFLICT`: someone else changed the Page. Read it again, reapply
  your change to the new version, and tell the user if the edits overlapped.
- `INVALID_PROPERTIES`: call `list_types` and match the Type's property keys,
  kinds, and option IDs.
- `TYPE_VERSION_CONFLICT`: list the Type again and resend its complete
  `propertyDefinitions`.
- `TYPE_NAME_TAKEN`: that Type already exists; use it.
- `PAGE_KIND_CONFLICT`: text goes on a text Page and Views on a views Page.
- `PAGINATION_RESTART_REQUIRED`: query again without the cursor.

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
