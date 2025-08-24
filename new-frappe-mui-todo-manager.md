# Task Plan: New Standalone Frappe ToDo Manager using MUI React (Workz)

Owner: New Agent
Status: Planned
Priority: High
App Name: workz (a new, dedicated Frappe app that will be created before implementation)

Goal
Build a brand-new, standalone ToDo Manager application (Workz) consisting of:
- A dedicated Frappe backend app named workz (separate installable app) providing a clean API surface (whitelisted endpoints/REST) for ToDo operations and history.
- A React frontend using Material UI (MUI) implementing a modern ToDo UI (list/table, grouping, context menu, drawer, bulk actions).
- Frontend to be initialized and integrated using the frappe-react-sdk for API calls and authentication.
- A well-defined services layer, hooks, and types for reuse by other apps (e.g., Planner).
- First-class mobile support with responsive layouts and touch-friendly interactions.

What makes Workz unique
- Self-service permission model designed for distributed ownership and collaboration:
  - Ownership: Every ToDo has an owner (creator). Owners retain ownership even if they assign the ToDo to others.
  - Self-creation: All authenticated users can create their own ToDos; no special role required for creation.
  - Assignment: All users can assign their own ToDos to themselves or to other users.
  - Sharing: Owners can explicitly share their ToDos with other users. Shared users can reassign those ToDos to others (delegation), update statuses, and comment.
  - Assignee rights: Users assigned ToDos can:
    - Update status (e.g., Open → In Progress → Done)
    - Add comments/notes
    - View full ToDo details
  - Owner visibility: Owners always see updates and activity on their ToDos (even when assigned elsewhere or shared widely).
  - Auditability: History of status changes, assignments, and comments is visible to owners (and to shared users where permitted).
- This model supports real-world delegation while preserving traceability and owner control.

Design system and theming
- Visual style:
  - Clean, modern, simple. Use neutral greys for most UI chrome; color is reserved for emphasis and states that need attention.
  - Grey outline style for inputs, cards, and containers (subtle borders, low elevation).
  - MDI (Material Design Icons) preferred for all icons; choose rounded/outlined variants to match the minimal aesthetic.
- Color usage:
  - Use color sparingly for signals only: errors, warnings, critical statuses, overdue badges, destructive buttons.
  - Priority/status chips: subtle tints; full-color only for urgent/blocked/overdue to draw attention.
- Light and dark mode:
  - Full support via MUI theme mode toggle; ensure adequate contrast in both.
  - Maintain identical layout and information hierarchy in both modes; only palette changes.
- Accessibility:
  - Minimum 4.5:1 contrast on text; 3:1 on large text and UI components where permissible.
  - Focus states clearly visible in both modes.
- Typography and spacing:
  - MUI defaults with slight adjustments for headings and captions where needed.
  - Consistent 8px spacing grid; avoid dense UI on mobile—prefer vertical stacking.
- Components:
  - Buttons: variant="text" or "outlined" for most actions; variant="contained" reserved for primary and destructive confirmations.
  - Chips/Badges: outlined or light variants for neutral states; filled for attention-demanding states.
  - Cards: low elevation, 1px grey outline; on hover, subtle shadow or outline emphasis.

Mobile-first requirements
- Responsive layouts:
  - On small screens, switch from table to a card/list layout with essential fields: subject, status, priority, assignee, and last updated.
  - Support collapsible/accordion rows to reveal more metadata (project, created, tags) without overwhelming the screen.
  - Use MUI breakpoints (xs/sm/md) to progressively disclose columns and actions.
- Touch-friendly interactions:
  - Larger tap targets for row actions, selection, and context menu trigger.
  - Long-press to open context menu on mobile (fallback if right-click not available). Provide a visible overflow (“…”) icon as an accessible alternative.
- Drawer and dialogs:
  - Use full-screen Drawer on mobile for detail view and editing.
  - Ensure forms are keyboard-safe (avoid viewport jumps), and actions are reachable with sticky action bars at the bottom on small screens.
- Performance:
  - List virtualization where feasible (MUI DataGrid or react-virtuoso/react-window for large lists).
  - Optimize images/avatars and avoid heavy tooltips on mobile; prefer inline chips or text.
- Accessibility:
  - Proper focus management on opening drawers/dialogs.
  - Gesture interactions (long-press) always have button equivalents.

Responsive renderer and drawer behavior
- xs (<600): render card list, full-screen drawer, bottom-sheet menus
- sm (600–900): card list, optional 2-column grid, full-screen drawer
- md (900–1200): table (MUI DataGrid), side drawer width 420–480px
- lg (≥1200): table with additional columns, side drawer, optional persistent filters panel

Column visibility matrix (table md+)
- Considered columns: selection, subject, status, priority, assignee, project, updated, created, reference_type, due (future)
- md (≥900 and <1200):
  - SHOW: selection, subject, status, priority, assignee, project, updated
  - HIDE: created, reference_type, due
  - Notes: subject minWidth ~240 with flex grow; updated minWidth ~120; chips single-line
- lg (≥1200):
  - SHOW: selection, subject, status, priority, assignee, project, updated, created
  - HIDE: reference_type, due (until added)
  - Notes: created shown as relative time with tooltip; optional column toggler may expose reference_type

Optional column toggler (md+)
- Allow users to toggle visibility of project, created, reference_type
- Persist preference in localStorage or URL query params

Outcomes
- Backend (Frappe app: workz):
  - New app scaffold (Python + JS), installable to site(s).
  - New DocType(s) only if needed; for core ToDo, leverage tabToDo.
  - Whitelisted APIs (or REST) for list/create/update/delete, assign, change status, sharing, and optional activity history.
  - Permission checks and multi-tenant readiness that implement the self-service permission model described above.
  - API documentation (OpenAPI or Markdown).
  - A public route/view under workz/www/workz.py for app entry or bootstrapping.
- Frontend (React + MUI + frappe-react-sdk):
  - Standalone ToDo Manager page and components.
  - Sorting, filtering, grouping, selection, bulk actions.
  - Right-click context menu; left-click opens detail drawer with inline editing.
  - Fully responsive mobile experience with touch-friendly interactions and MDI icons.
  - Unit/component tests, accessibility checks.
- Shared:
  - Types, mappers, and a thin SDK-like service layer that uses frappe-react-sdk under the hood.

Tech Stack
- Backend: Frappe Framework (Python), whitelisted methods under the new app workz
- Frontend: React (TypeScript), Material UI v5+, frappe-react-sdk, React Testing Library + Jest/Vitest
- API Client: frappe-react-sdk (useFrappeGetDocList, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeDeleteDoc, useFrappePostCall, useFrappeAuth, etc.)
- Icons: Material Design Icons (mdi)
- Documentation: README + docs/ with API and UI docs

0. Frontend Initialization with frappe-react-sdk

0.1 Provider Setup
- Wrap the root of the React app with FrappeProvider.
- If the Frappe server is on a different origin, pass url.
- If using token-based auth, use tokenParams per library docs.

Example (App.tsx):
import { FrappeProvider } from "frappe-react-sdk";

function App() {
  return (
    <FrappeProvider
      url="https://my-frappe-server.example.com"
      // tokenParams example for token-based auth:
      // tokenParams={{
      //   useToken: true,
      //   token: getTokenFromLocalStorage(),
      //   type: "Bearer",
      // }}
    >
      {/* Your other app components */}
    </FrappeProvider>
  );
}

0.2 Authentication with useFrappeAuth
- Use useFrappeAuth to manage currentUser, login, logout, updateCurrentUser, and getUserCookie.
- Handle isLoading and error states; redirect to login if the user is not logged in (403 Forbidden).
- Prefer cookie-based auth with Frappe session if the app is co-hosted; use token-based if separate identity provider is used.

Example:
import { useFrappeAuth } from "frappe-react-sdk";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading, error, getUserCookie } = useFrappeAuth();

  if (isLoading) return <div>Loading user…</div>;
  if (error) {
    // if 403, redirect to login route
    return <div>Not authenticated</div>;
  }
  if (!currentUser) {
    return <div>Please login</div>;
  }
  return <>{children}</>;
};

1. Backend Plan (Frappe App: workz)

1.0 Pre-req
- Create the dedicated Frappe app named workz before starting implementation:
  - bench new-app workz
  - bench --site your-site install-app workz

1.1 App Scaffold
- App name: workz
- Modules:
  - workz/api (whitelisted methods module)
  - workz/www (public routes incl. workz.py for SPA or boot payloads)
  - Internal service layer for validation and permissions as Python modules

1.2 API Endpoints (Whitelisted Methods)
Namespace: workz.api.todos

- list_user_todos(filters?: object) -> FrappeToDo[]
  - Inputs (optional): status, priority, allocated_to (assignee), project (reference_name), pagination params
  - Fields: name, description AS subject, reference_name AS project, reference_type, allocated_to, priority, status, creation, modified
- get_todo(name: string) -> FrappeToDo
- create_todo(payload: { subject: string; priority?: string; status?: string; allocated_to?: string; project?: string; reference_type?: string })
  - Creates a ToDo (tabToDo) with description=subject
- update_todo(name: string, payload: Partial<{ subject; priority; status; allocated_to; project; reference_type }>) -> FrappeToDo
- delete_todo(name: string) -> void
- change_status(name: string, status: string) -> FrappeToDo
- assign_todo(name: string, allocated_to: string) -> FrappeToDo
- share_todo(name: string, shared_with: string, permissions: { can_assign?: boolean; can_comment?: boolean; can_view?: boolean }) -> FrappeToDo
  - Implements the sharing aspect of the self-service permissions model (owners grant capabilities to other users)

Optional
- list_history(name: string) -> Activity[]
  - Returns change history/comments (via Communication/Version docs if applicable)
- add_comment(name: string, content: string) -> Activity
  - Adds a comment to the ToDo (stored as Communication or Comment), returns the created activity item

1.3 Permission Model (Self-Service)
- Owner: The user who created the ToDo (doc.owner). Owners:
  - Can always view, edit, assign, change status, delete, and share their ToDos.
  - Retain ownership regardless of assignment.
- Assignee (allocated_to):
  - Can view assigned ToDos.
  - Can update status and comment.
  - Cannot change ownership; cannot delete unless also the owner or given explicit permission.
- Shared Users:
  - Sharing grants capabilities:
    - can_view: view ToDo and activity
    - can_comment: add comments
    - can_assign: assign ToDo to another user (delegation)
  - Sharing does not transfer ownership.
- Enforcement:
  - API methods validate the caller’s permissions based on ownership, assignee, and sharing rules.
  - All updates are logged to history (Version/Communication) for auditability.
  - Owners always see updates on their ToDos.

1.4 Tests (Backend)
- Unit tests for all API functions and permission paths
- Permission tests for owner/assignee/shared/unauthorized users
- Data validation tests

1.5 API Docs
- Markdown docs in workz/docs/api.md
- Optional: OpenAPI description

1.6 Public Route: workz/www/workz.py
- Add a public-facing route file: workz/www/workz.py
- Purpose:
  - Serve an entry endpoint for the SPA or provide boot/config payloads.
  - Useful for deep-linking or a “workz” landing that bootstraps auth state and basic user context.
- Deliverables:
  - Template rendering or JSON response as needed.
  - Ensure correct Guest vs Logged-in behavior (redirect or minimal boot response).

2. Frontend Plan (React + MUI + frappe-react-sdk)

2.1 Data Types
- FrappeToDo (raw from backend):
  - name: string
  - subject: string (description AS subject)
  - project: string | null (reference_name)
  - reference_type: string | null
  - allocated_to: string | null
  - priority: "Low" | "Medium" | "High" | "Urgent" | string | null
  - status: "Open" | "In Progress" | "Blocked" | "Closed" | "Cancelled" | string | null
  - creation: string | null
  - modified: string | null
- Todo (UI type):
  - id: string (from name)
  - subject: string
  - project?: string | null
  - assignee?: { name: string; email?: string | null; avatarUrl?: string | null } | null
  - priority?: "low" | "medium" | "high" | "urgent" | string | null
  - status?: "open" | "in_progress" | "blocked" | "done" | "cancelled" | string | null
  - dueAt?: string | null (optional future)
  - createdAt?: string | null
  - updatedAt?: string | null

2.2 Mapping Utilities
- utils/mapFrappeToTodo.ts
  - mapFrappeToTodo(row: FrappeToDo): Todo
  - Normalize priority/status to lowercase canonical values
- utils/mapTodoToFrappePayload.ts
  - Converts UI Todo patch to Frappe fields (description, allocated_to, reference_name, etc.)

2.3 Frontend SDK/Services using frappe-react-sdk
- Prefer using hooks from frappe-react-sdk directly inside features/components:
  - useFrappeGetDocList("ToDo", { fields, filters, limit, orderBy })
  - useFrappeCreateDoc("ToDo")
  - useFrappeUpdateDoc("ToDo", name)
  - useFrappeDeleteDoc("ToDo", name)
  - For custom whitelisted methods (if needed): useFrappePostCall("/api/method/workz.api.todos.list_user_todos", payload)
- Optionally wrap these in a thin service adapter to isolate API details from UI.

Example patterns:
- Listing: const { data, error, isLoading, mutate } = useFrappeGetDocList<FrappeToDo>("ToDo", { fields: ["name","description","reference_name","reference_type","allocated_to","priority","status","creation","modified"] });
- Create: const { createDoc } = useFrappeCreateDoc<FrappeToDo>("ToDo");
- Update: const { updateDoc } = useFrappeUpdateDoc<FrappeToDo>("ToDo", name);
- Delete: const { deleteDoc } = useFrappeDeleteDoc("ToDo", name);

2.4 Hooks
- hooks/useTodos.ts
  - Fetches ToDos via useFrappeGetDocList ("ToDo" DocType), applies client-side search/filter/grouping
  - Exposes { todos, loading, error, refetch }
- hooks/useTodoMutations.ts
  - Wraps create, update, delete, assign, changeStatus using frappe-react-sdk hooks or useFrappePostCall for whitelisted method endpoints
- hooks/useTodoActivity.ts (new)
  - list_history and add_comment integration
  - API: { activity, isLoading, error, refetch, addComment(content) }
- hooks/useTodoTableState.ts
  - Manages selection, sorting, grouping, filters, search and helpers
- hooks/useContextMenu.ts
  - Manages anchor and selected row for context menu
- hooks/useMobileView.ts (new)
  - Returns breakpoint booleans (isXs/isSm) using MUI useMediaQuery
  - Provides helpers for deciding when to switch to card layout and when to use full-screen drawer

2.5 Components (MUI)
- pages/WorkzTodoManager.tsx
  - Composes AuthGate (optional), toolbar, table/card list (responsive), drawer, context menu, dialogs
- components/workz/ToDoTable.tsx
  - MUI DataGrid or Table with:
    - Columns: selection, subject, priority, status, assignee, project, updated (+ created on lg)
    - Sortable headers with aria-sort
    - Grouping by: none | status | assignee | priority | project
    - Left-click opens drawer; right-click opens context menu
    - Integrates unified selection model (see Selection Model API)
- components/workz/ToDoListMobile.tsx (new)
  - Card-based list for mobile with essential info and compact actions
  - Long-press opens context menu; tap opens drawer
  - Selection mode: long-press or Overflow action enters mode; leading checkbox appears; AppBar shows bulk actions
  - Virtualized with react-virtuoso (preferred) or react-window for performance
  - Uses MDI icons; grey outline style; subtle color accents for critical states only
- components/workz/cells/*.tsx
  - SubjectCell, PriorityCell, StatusCell, AssigneeCell, ProjectCell, DateCell, SelectionCell
- components/workz/ToDoToolbar.tsx
  - Search, filter selects, group-by select, bulk actions
  - Minimal colored accents; primary actions outlined by default
- components/workz/ToDoDetailDrawer.tsx
  - Editable fields with Save/Cancel, shows created/updated, history if available
  - Full-screen on mobile; side drawer on desktop
  - Sticky bottom action bar on mobile; MDI icons for actions
- components/workz/ToDoActivity.tsx (new)
  - Renders activity/comment history for a ToDo (status changes, assignments, comments)
  - Includes a composer to add a new comment with @mention autocomplete (optional phase 2)
  - Virtualized list for long histories; shows relative timestamps and author avatars
  - Uses hooks/useTodoActivity.ts for data and mutations
- components/workz/ToDoContextMenu.tsx
  - Quick actions: Open, Edit, Assign, Change Status, Delete
- components/workz/dialogs/*.tsx
  - ConfirmDeleteDialog, AssignDialog

Selection Model API (unified across table and cards)
- Purpose: single source of truth for selected ids and selection mode
- Data model:
  - SelectedIds = Set<string>
  - SelectionState = { selected: SelectedIds; lastSelectedId: string | null; mode: "none" | "selecting" }
- Hook surface in [src/hooks/useSelectionModel.ts:1]:
  - Queries:
    - isSelected(id: string): boolean
    - getSelected(): string[]
    - getCount(): number
    - isSelectionMode(): boolean
  - Mutations:
    - selectOne(id: string): void
    - toggle(id: string): void
    - add(id: string): void
    - remove(id: string): void
    - clear(): void
    - setMany(ids: string[]): void
    - enterSelectionMode(): void
    - exitSelectionMode(): void
    - setLastSelected(id: string | null): void
    - selectRange(fromId: string, toId: string, orderedIds: string[]): void
  - Event helpers:
    - onItemClick(id: string, opts?: { metaKey?: boolean; shiftKey?: boolean; orderedIds?: string[] }): void
    - onItemLongPress(id: string): void
- Integration:
  - DataGrid: checkboxes map to toggle; row click uses meta/shift to toggle or select range; otherwise selectOne and open drawer
  - Cards: tap toggles when in selection mode; long-press enters selection mode and selects the item

2.6 UX and a11y
- Keyboard navigation
- aria-sort on headers (table); role=list/listitem on card list
- Labels and aria attributes for interactive elements; overflow menus have aria-labels
- Focus management on drawer/dialog open/close; first focus on subject input
- Loading, empty, and error states for both table and cards
- Touch targets ≥ 44px; sufficient color contrast in light/dark
- Respect SWR revalidation patterns from frappe-react-sdk for snappy UX
- Mobile considerations captured in Mobile-first requirements above
- Comment composer is accessible (labels, describedby), posts show aria-live updates

2.7 Tests (Frontend)
- Unit tests:
  - mappers
  - hooks (state transitions, data fetching, mutations) with mocked frappe-react-sdk hooks
- Component tests:
  - table renders rows, supports selection/sorting
  - mobile card list renders correctly and supports touch interactions (tap/long-press)
  - context menu interactions
  - detail drawer edit/save flow (mobile and desktop)
- Integration smoke test with mocked SDK

3. API Contracts and Routes (Backend: workz)

3.1 Suggested Route Paths (Whitelisted methods)
- GET/POST /api/method/workz.api.todos.list_user_todos
- GET /api/method/workz.api.todos.get_todo
- POST /api/method/workz.api.todos.create_todo
- POST /api/method/workz.api.todos.update_todo
- POST /api/method/workz.api.todos.delete_todo
- POST /api/method/workz.api.todos.change_status
- POST /api/method/workz.api.todos.assign_todo
- POST /api/method/workz.api.todos.share_todo
- GET/POST /api/method/workz.api.todos.list_history
- POST /api/method/workz.api.todos.add_comment

Note: You may also use /api/resource/ToDo for REST if desired. Whitelisted methods offer richer validation and batch ops.

Activity/Comment API details
- list_history(name: string) -> { message: Activity[] }
  - Activity item shape includes: id, type [comment|status_change|assignment], content (for comments), author { name, email, avatar }, createdAt, meta (old/new status or assignee for system events)
- add_comment(name: string, content: string) -> { message: Activity }
  - Adds plain-text comment (phase 1); mentions and rich text optional in phase 2
  - Permission: owner, assignee, or shared user with can_comment

3.2 Request/Response Examples
- list_user_todos -> { message: FrappeToDo[] }
- get_todo -> { message: FrappeToDo }
- create/update/change_status/assign/share -> { message: FrappeToDo }
- delete_todo -> { message: "ok" } or HTTP 200 with no content
- list_history -> { message: Activity[] }
- add_comment -> { message: Activity }

4. Milestones

Milestone 0: App Creation
- Create the workz Frappe app and install on target site
- Set up repo structure and CI basics if applicable
Status: Completed (app exists in repo)

Milestone 1: Backend App Scaffolding
- Add api.todos module with method stubs
- Implement list_user_todos and get_todo with permissions and ownership checks
- Add www/workz.py entry route (basic boot page or JSON)
- Docs: backend README and docs/api.md
Status: Planned (not started)

Milestone 2: Complete CRUD, Assign, Change Status, Share
- Implement create_todo, update_todo, delete_todo, change_status, assign_todo, share_todo
- Enforce permission model (owner/assignee/shared)
- Add tests and permission validations
- Polish API docs
Status: Planned (not started)

Milestone 3: Frontend Bootstrap with frappe-react-sdk
- Add FrappeProvider wrapper and AuthGate component
- Implement useTodos hook using useFrappeGetDocList ("ToDo")
- Implement mapping utils and shared types
- Write unit tests for mapping and hooks (mock SDK)
Status: In Progress (FrappeProvider added; data hooks planned)

Milestone 4: Core UI (Table + Toolbar) + Mobile List
- Build ToDoTable with MUI (sorting, selection, grouping scaffolding)
- Implement ToDoToolbar (search, filters, group-by)
- Add ToDoListMobile for mobile breakpoint (xs/sm) and switch via useMobileView
- Wire state from useTodoTableState and data from useTodos
Status: In Progress
- Implemented:
  - Scaffolds for ToDoTable, ToDoListMobile, ToDoToolbar
  - Responsive switch via [frontend/src/hooks/useMobileView.ts:1]
  - Drawer shell; Activity component with mock data
  - Unified selection model hook present; table bound to checkbox UI
- Pending:
  - Real data hookup (useTodos) and filters

Milestone 5: Context Menu + Drawer + Mutations
- Implement context menu and detail drawer editing
- Hook up create/update/delete/assign/change status/share using frappe-react-sdk hooks or useFrappePostCall
- Add activity history view and comment composer in the detail drawer
- Hook up list_history and add_comment endpoints; optimistic add then revalidate history
- Add toasts/snackbars for feedback and SWR mutate on success
- Ensure drawer is full-screen on mobile and side drawer on desktop
Status: Partially Completed
- Implemented:
  - Drawer opens from row/card click (desktop and mobile)
  - Activity list UI and comment composer (mock)
- Pending:
  - Mutations to backend; context menu actions

Milestone 6: Grouping + Project Group
- Client-side grouping by status/assignee/priority/project
- Collapsible group headers (optional)
- Accessibility and UX polish (mobile and desktop)

Milestone 7: Test Suite and Documentation
- Add comprehensive component/integration tests including mobile view
- Final accessibility checks and performance passes
- Document architecture, endpoints, auth setup with frappe-react-sdk, theming (light/dark), MDI icons, and how to extend

5. Deliverables

Build and deploy pipeline
- Vite base: relative for development; postbuild script rewrites asset URLs for deployed HTML
- Copy mapping:
  - Bundles (flat) -> workz/public/frontend/*
  - SPA entry -> workz/www/workz/index.html
- Verified serving under /workz
Files: [frontend/vite.config.ts:1], [frontend/scripts/copy-dist-to-frappe.cjs:1]

Backend (workz)
- workz/api/todos.py (whitelisted methods including share_todo)
- workz/www/workz.py (public entry/boot route)
- workz/tests/test_todos.py
- docs/api.md
- README.md (install, setup, permissions and the self-service permission model)

Frontend
- src/App.tsx (FrappeProvider + AuthGate) — Implemented [frontend/src/App.tsx:1]
- src/pages/WorkzTodoManager.tsx — Implemented [frontend/src/pages/WorkzTodoManager.tsx:1]
- src/components/workz/ToDoTable.tsx (+ cells/) — Implemented scaffold [frontend/src/components/workz/ToDoTable.tsx:1]
- src/components/workz/ToDoListMobile.tsx (mobile cards) — Implemented scaffold [frontend/src/components/workz/ToDoListMobile.tsx:1]
- src/components/workz/ToDoToolbar.tsx — Implemented scaffold [frontend/src/components/workz/ToDoToolbar.tsx:1]
- src/components/workz/ToDoContextMenu.tsx — Pending
- src/components/workz/ToDoDetailDrawer.tsx — Implemented with Activity [frontend/src/components/workz/ToDoDetailDrawer.tsx:1]
- src/components/workz/ToDoActivity.tsx — Implemented (mock) [frontend/src/components/workz/ToDoActivity.tsx:1]
- src/components/workz/dialogs/(ConfirmDeleteDialog.tsx, AssignDialog.tsx) — Pending
- src/hooks/(useTodos.ts, useTodoTableState.ts, useContextMenu.ts, useTodoMutations.ts, useMobileView.ts, useSelectionModel.ts, useTodoActivity.ts)
  - Implemented: useMobileView [frontend/src/hooks/useMobileView.ts:1], useSelectionModel [frontend/src/hooks/useSelectionModel.ts:1], useTodoActivity (mock) [frontend/src/hooks/useTodoActivity.ts:1]
  - Pending: useTodos, useTodoMutations, useContextMenu, useTodoTableState
- src/utils/(mapFrappeToTodo.ts, mapTodoToFrappePayload.ts) — Pending
- __tests__/todo/* — Pending
- README.md or docs/WorkzTodoManager.md — Pending

6. Acceptance Criteria

Progress overview against criteria
- SPA entry at /workz serves and loads assets correctly: Achieved (www/workz/index.html + public/frontend)
- Responsive behavior and navigation: Achieved (cards xs/sm; table md+; drawer opens)
- Activity visibility and composer: Achieved (mock-only)
- Multi-select: De-prioritized per user feedback; single-item flows working
- Build pipeline integration with Frappe: Achieved

Pending criteria for next slices
- Data fetching via frappe-react-sdk (useTodos)
- Edit/save in drawer with backend mutations
- Context menu actions
- Tests and a11y polish

7. Implementation guidance for AI agents (coding conventions and workflow)

7.0 Current implementation snapshot (for agents)
- Frontend scaffold in ./frontend (Vite + React + TS) with MUI v6 and frappe-react-sdk installed
- Responsive renderer in [frontend/src/pages/WorkzTodoManager.tsx:1]
- Drawer wired and Activity mock integrated [frontend/src/components/workz/ToDoDetailDrawer.tsx:1], [frontend/src/components/workz/ToDoActivity.tsx:1], [frontend/src/hooks/useTodoActivity.ts:1]
- Selection model hook present [frontend/src/hooks/useSelectionModel.ts:1]; table uses basic checkbox binding (multi-select is de-prioritized)
- Build pipeline: npm run build -> copies flat bundles to workz/public/frontend and updates workz/www/workz/index.html for serving under /workz
- Next high-priority task: useTodos data hookup and single-item edit flows

7.1 Coding conventions
- TypeScript strictness: enable strict mode; prefer explicit types in public APIs.
- File size limits:
  - React components: ≤ 200 lines where practical; if exceeding 300 lines, extract subcomponents or hooks.
  - Hooks: ≤ 200 lines; split complex logic into smaller helpers.
  - Tests: keep individual test files ≤ 300 lines; separate suites by component/hook.
- Filenames and structure:
  - Components: src/components/workz/Name.tsx
  - Hooks: src/hooks/useName.ts
  - Utils: src/utils/name.ts
  - Dialogs: src/components/workz/dialogs/NameDialog.tsx
- Comments and docs:
  - Top-of-file comment block describing purpose, inputs/outputs, and usage example.
  - JSDoc on exported functions/components and complex types.
  - Inline comments for non-obvious logic and accessibility rationale.

7.2 UI and accessibility standards
- Accessibility:
  - Provide aria-labels for icon buttons and menus.
  - Maintain focus management for Drawer/Dialog; initial focus goes to primary input or heading.
  - Use role=list and role=listitem for mobile lists; aria-sort on DataGrid headers.
  - Ensure touch targets ≥ 44px, label associations for inputs, and aria-live for async updates (e.g., posting comments).
- Theming and visuals:
  - Use MUI theme tokens; avoid hard-coded colors except semantic chips.
  - Prefer outlined variants; contained only for primary/confirm actions.

7.3 Network and state management
- Data fetching via frappe-react-sdk hooks. Revalidate with mutate on success.
- Optimistic updates:
  - For add_comment and status changes, optimistically update UI and then revalidate.
- Error handling:
  - Show MUI Alert or Snackbar with retry; surface error boundaries where appropriate.
- Selection state:
  - Use the unified selection model hook [src/hooks/useSelectionModel.ts:1]; do not manage ad-hoc selection in components.

7.4 Iterative delivery and checkpoints
- Small PRs/commits:
  - Target ≤ 300 lines changed per PR to keep reviews manageable.
- Breakpoints for user testing:
  - After each milestone slice, pause implementation and request user validation:
    1) Bootstrap: App shell loads and lists basic todos.
    2) Core UI: Table and mobile cards render with mock data; no mutations yet.
    3) Mutations: Create/update/delete working; drawer edit flow validated.
    4) Activity: History visible; add comment working with optimistic UI.
    5) A11y/Perf: Keyboard nav, virtualization, and contrast checks complete.
- Demo seeds:
  - Provide a mock data mode or storybook-like sandbox for visual verification when backend is not available.

7.5 Testing requirements
- Unit tests:
  - Hooks: state transitions, optimistic flows, error paths (mock SDK).
  - Utils: mapping functions with edge cases (nulls/unknown statuses).
- Component tests:
  - Table selection and sorting; card list long-press selection on mobile.
  - Drawer edit/save/cancel; comment composer posting and revalidation.
- Accessibility checks:
  - Axe checks on key pages/components; verify focus order and aria attributes.
- Performance:
  - Validate virtualization behavior for lists > 200 items.

7.6 Task breakdown templates (for agents)
- Example atomic task template:
  - Title: Implement [src/hooks/useSelectionModel.ts:1]
  - Steps:
    1) Create hook with API surface defined in doc.
    2) Add unit tests for basic select/toggle/range flows.
    3) Export from hooks index if present.
    4) Update page to wire hook into ToDoTable and card list (behind feature flag if needed).
  - Done when: tests pass; basic integration compiles; no lint errors.
- Example UI slice template:
  - Title: Scaffold [src/components/workz/ToDoActivity.tsx:1]
  - Steps:
    1) Presentational list (no data) with props: items, onAddComment.
    2) Integrate [src/hooks/useTodoActivity.ts:1] for data and addComment.
    3) Add accessibility: aria-live for post, labels for composer.
    4) Add snapshot tests and interaction tests for addComment.
  - Done when: component renders with mock data; composer posts; tests pass.

7.7 Branching and safety
- Work branch naming: feature/todo-<short-scope>, e.g., feature/todo-activity.
- Keep changes isolated; avoid cross-cutting refactors within feature branches.
- If a change affects multiple modules, update one module per commit with clear messages.

7.8 Review checklist (use before requesting validation)
- Lint/build clean; TypeScript no-implicit-any disabled only with justification.
- a11y checks: headings, labels, focus traps, keyboard nav, contrast.
- Responsive behavior verified at xs, sm, md, lg; drawer behavior matches spec.
- Column visibility matches breakpoint matrix.
- Optimistic updates work and reconcile on server response; errors handled with user feedback.
- File size limits respected; large logic moved into hooks/utils.

7.9 Guardrails for third-party code
- Prefer lightweight dependencies. Before adding a new package, confirm necessity.
- Virtualization: choose react-virtuoso for mobile lists unless a constraint requires react-window.

7.10 Documentation updates
- When implementing a feature, update README/docs bullets:
  - Add or modify entries in docs/WorkzTodoManager.md covering the feature.
  - Update Acceptance Criteria sections if scope changed.

Notes and Assumptions
- The application name is workz and a dedicated Frappe app named workz will be created before starting development.
- Authentication will use frappe-react-sdk’s auth model:
  - Cookie-based (co-hosted) or token-based (separate origin) via tokenParams.
- If CORS needed, configure in Frappe site config.
- Due date support can be added later if backend includes a field/update to tabToDo or a related DocType.
- Planner app can reuse hooks and components from this implementation.