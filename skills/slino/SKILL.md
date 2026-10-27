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

1. Pick the workspace. Call `list_workspaces`; if there is more than one and
   the user has not named it, ask.
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
- Before using a new Select choice, add it to the Type with `patch_types`, then
  assign its option ID.
- Use a relation property when the link should show as a backlink, such as a
  task's project. Use a body link `[title](/pages/PAGE_ID)` for a mention in
  text.
- A Page holds either writing or Views. Create collection Pages, boards, and
  dashboards as `kind: "views"`.
- On `VERSION_CONFLICT`, someone else changed the Page. Read it again, reapply
  your change to the new version, and tell the user if the edits overlapped.

## Removing things

`trash_pages` is reversible and takes sub-pages with it; restore with
`patch_pages`. Only a person can delete permanently. Confirm with the user
before trashing Pages they did not explicitly name.

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
- **Tidy up**: find untyped or misplaced Pages, propose the moves and Types,
  and apply them once the user agrees.
