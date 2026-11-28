---
name: slino
description: Organize notes, tasks, projects, and knowledge in the user's Slino workspace through the Slino MCP tools. Use when the user asks to save, find, plan, track, or tidy something in Slino, or to turn a conversation, document, or list into Slino Pages, Types, and Views.
---

# Working in Slino

Slino is a workspace that people browse and edit while you keep it organized.
Everything is a Page. A Type gives recurring Pages a shape, and a View is a tab
on a views Page that shows a saved query of Pages as a table, board, list,
gallery, calendar, or generated layout, or shows one text Page's writing. The
tools and their descriptions hold the exact rules; this skill covers how to
use them well.

## Before you write

1. Call `list_workspaces` once and reuse the result. If the user names a
   workspace, use it. If it is unavailable, explain that and ask where to
   work before making changes. With no named workspace, use the only available
   one, or search for the subject with `query_pages` and use the workspace
   with related Pages. If that still leaves a choice, prefer the workspace
   where the user is the only member (`memberCount` is 1). Ask if you still
   cannot pick one. Name the workspace you used in your reply.
2. Look before creating. Call `query_pages` with `search` for the subject.
   Its result includes the full Types of the Pages it returns, with option
   IDs. If you need a Type and the results do not include a suitable one, call
   `list_types` before creating a Type. Update an existing Page instead of
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
- Each Page's `changedAt` says when each property took its current value. To
  find when something happened, such as Tasks finished this month, filter
  with a `changed` condition and the user's `timeZone`, which also sets
  `today` when you omit it, instead of reading history or using `updatedAt`.
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

## Text Pages and Views Pages

A Page holds writing or Views, never both.

- Use `kind: "text"` when the writing matters most, such as notes, plans,
  runbooks, and Task checklists. Its sub-pages, if any, list below the writing.
- Use `kind: "views"` when the sub-pages matter more than any writing, such as
  a project's tasks or a collection people browse, sort, or track, or for
  Pages gathered from across the workspace. Don't create one for a single
  Page.
- A views Page has no body. Put its overview on a text sub-page and show it
  with a `page` View, usually as the first tab. A text Page can't show a View:
  link to the views Page from its body, or convert it as below when the user
  wants Views on that Page.

Pick each View's layout from what people do with the Pages:

- `table` to compare properties; `list` to scan titles.
- `board` to move Pages through a Select property such as Status.
- `calendar` for Pages with a date property, and an end date for spans.
- `gallery` for Pages best recognized by an image or file.
- `page` for a text Page's writing beside the other tabs.
- `generated` only for what these can't show, such as a checklist with
  progress, a drill, or a readiness board.

For a launch tracker, create the Views Page, then its **Launches** table with
`create_views` before adding sub-pages. Filter the table by the parent Page
and the Task Type: a View filtered by the parent stops Slino from adding its
own **Sub-pages** list, and the Type filter keeps the Overview out of the
table. Show the Task Type's Status property so the table reads status directly
from each Task. Then add the launches as text sub-pages with the Task Type,
holding their checklists, and a text sub-page called **Overview** for shared
decisions. Add an **Overview** tab with `create_views` using
`presentation: {layout: "page", pageId: OVERVIEW_ID, properties: []}`, then
make it the first tab by patching both tabs' positions in one `patch_views`
call.

To convert a text Page into a Views Page through MCP, do what Slino's own
conversion does:

1. Copy its Markdown into a new text sub-page titled "TITLE notes" and read it
   back to check that nothing was lost.
2. Use `patch_pages` with the original Page's current `expectedVersion`,
   `kind: "views"`, and `body: ""`. If you get a version conflict, check the
   original Page for new writing and copy it into the notes before retrying.
3. Call `list_views`. Slino adds a **Sub-pages** View to a converted Page with
   sub-pages. If the notes are its only sub-page, delete that View with
   `delete_views`.
4. Add a **Notes** tab with a `page` layout showing the notes. If other tabs
   remain, make Notes the first tab by patching every tab's position in one
   `patch_views` call.

Then add the Views the Page needs. Change a kept **Sub-pages** View instead of
adding another View of the same sub-pages.

## Generated Views

A generated View is a layout you write as HTML, following the contract in
the description of `presentation.code`. Use it when people act on Pages in a
way built-in layouts can't show, such as ticking off a checklist with
progress, running a drill, or reading a readiness board.

- A layout saves only Page properties, so keep everything worth keeping
  there. Add the properties to the Type first, such as a Done checkbox or a
  Last reviewed date.
- Set `properties` as well. Slino shows those columns as a table when the
  layout fails to load, and other chats, including `show_pages`, show the
  View as that table. Link the Page so the user opens the layout in Slino.
- Build a large layout in steps. Create the View with a working core, such as
  the main list and its one primary action, then add each further section
  with `codeEdits` in `patch_views`. Small steps are easier to get right, and
  a failed step costs only that step.
- Read the code before editing it. `list_views` returns a long layout in
  parts: while a View's `nextCodeOffset` is not null, call `list_views` again
  with its `viewId` and `codeOffset` set to `nextCodeOffset`, and join the
  parts in order. Never save one part as the whole code.
- Fix or extend a layout with `codeEdits`, each `oldText` copied exactly from
  the saved code with enough around it to match once. Send all of `code`
  again only to replace most of the layout.
- To change only settings such as `properties`, send `presentation` without
  `code`; the View keeps its saved code.
- Each code write is a layout revision; the one whose `toVersion` is the
  version you read before a change holds the layout from before it. When a
  change breaks the layout or the user wants an earlier one, find it with
  `list_view_revisions`, read it
  with `read_view_revision`, which returns long code in parts like
  `list_views`, and put it back with `restore_view_revision` instead of
  rewriting it.

## Files

Upload with `upload_files`, then reference the file from a Page body as
`![alt](/files/FILE_ID)` for images or `[name](/files/FILE_ID)` otherwise, or
from a file property. Pages show only uploaded images; an image from another
site shows as a link, so upload it from its URL first. Pick the path that
keeps the bytes out of your context:

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
`uploadPageUrl`.

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
- `INVALID_BODY_EDIT` or `INVALID_CODE_EDIT`: read the current body or code
  again and copy each `oldText` exactly, with more around it if it matched
  several places.
- `PAGINATION_RESTART_REQUIRED`: query again without the cursor.
- `UPLOAD_LINK_USED` from an upload link: the file already arrived; use its
  ID. `UPLOAD_LINK_INVALID`: the link expired; ask for a new one.

Fix the cause and retry once; if it still fails, tell the user what failed.

## Undoing and removing

- Every change is kept in Page history. To see or undo what changed, call
  `list_page_revisions`, read the candidates with `read_page_revision`, and
  put one back with `restore_page_revision`. Restoring adds a new revision and
  keeps everything after it. The `current` revision is the Page as it is now,
  so restoring it fails with `REVISION_IS_CURRENT`. One client's edits in
  quick succession share a revision, so an edit you just made may have no
  earlier revision of its own to restore.
- `trash_pages` is reversible and takes sub-pages with it; restore with
  `patch_pages`. Only a person can delete permanently, in Slino. When asked to
  delete permanently, say so, and don't trash Pages instead unless the user
  asks.
- Confirm with the user before trashing Pages, or restoring a revision, they
  did not explicitly name.

## Finishing

Link every Page you mention, create, or change using its `url`. Call
`show_pages` only when the user asks to see, show, or preview Pages here in
the chat, once at the end with the final Pages. Otherwise the link is enough.

## Common requests

- **Capture**: "save this" → one Page under the most fitting parent, with a
  clear title, an emoji, and the content in clean Markdown.
- **Task tracker**: reuse or create a Task Type with Status, Priority, and Due
  date; create a views Page with a board grouped by Status and a table sorted
  by Due date, both filtered by the Task Type and the Page as parent; add the
  tasks under it.
- **Plan from a conversation**: a text Page with the goal and decisions, and a
  sub-page per workstream. When its action items matter more than the
  writing, build it like the launch tracker, with the goal and decisions on
  its Overview.
- **Review**: query Pages updated or due in the period, then summarize what
  changed, what is overdue, and what is next, linking each Page.
- **What changed**: "what did the AI change in my plan?" → list the Page's
  revisions, summarize who changed what and when, and offer to restore one.
- **Tidy up**: find untyped or misplaced Pages, propose the moves and Types,
  and apply them once the user agrees.
