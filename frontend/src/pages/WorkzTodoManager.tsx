/**
 * WorkzTodoManager page
 * - Decides renderer based on breakpoint: table (md+) vs mobile cards (xs/sm)
 * - Hosts top-level toolbar and detail drawer; wires open/close state
 * - Binds unified selection model; table and cards receive same API
 */
import React from "react";
import { Box } from "@mui/material";
import { ToDoToolbar } from "../components/workz/ToDoToolbar";
import { ToDoTable } from "../components/workz/ToDoTable";
import { ToDoListMobile } from "../components/workz/ToDoListMobile";
import { ToDoDetailDrawer } from "../components/workz/ToDoDetailDrawer";
import { ProjectMenu } from "../components/workz/ProjectMenu";
import { AssigneeAvatars } from "../components/workz/AssigneeAvatars";
import { useMobileView } from "../hooks/useMobileView";
import { useTodos, Todo } from "../hooks/useTodos";
import { useTodoTableState } from "../hooks/useTodoTableState";
import { useThemeContext } from "../contexts/ThemeContext";
import { useFrappeCreateDoc } from "frappe-react-sdk";

export function WorkzTodoManager() {
  const { useCards } = useMobileView();
  const { isDarkMode, toggleTheme } = useThemeContext();

  // Data hook (real data or error per configuration)
  const todosQuery = useTodos();

  // Quick create hook
  const { createDoc: createTodo } = useFrappeCreateDoc();

  // Local state for selected todo and drawer open
  const [selectedTodoId, setSelectedTodoId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Reference menu state
  const [projectMenuOpen, setProjectMenuOpen] = React.useState(false);
  const [selectedReference, setSelectedReference] = React.useState<string | null>(null);

  // Table state (filtering, sorting, grouping) - must come after selectedReference declaration
  const tableState = useTodoTableState(todosQuery.todos || [], selectedReference);

  // Derive the selected todo from list by id
  const selectedTodo: Todo | null = React.useMemo(() => {
    if (!selectedTodoId || !todosQuery.todos) return null;
    return todosQuery.todos.find(t => t.id === selectedTodoId) || null;
  }, [selectedTodoId, todosQuery.todos]);

  const handleOpen = (id: string) => {
    setSelectedTodoId(id);
    setDrawerOpen(true);
  };
  const handleClose = () => {
    setDrawerOpen(false);
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleClearFilter = () => {
    setSelectedReference(null);
  };

  // Format active filter display
  const getActiveFilterDisplay = (reference: string | null): string | null => {
    if (!reference) return null;

    if (reference === "No Reference") return "No Reference";
    if (reference.includes(":")) {
      const [type, name] = reference.split(":");
      return `${type}: ${name}`;
    }
    return reference;
  };

  // Quick create handler
  const handleQuickCreate = async (subject: string) => {
    try {
      await createTodo("ToDo", {
        description: subject,
        status: "Open",
        priority: "Medium"
      });
      // Refresh the todo list
      todosQuery.refetch();
    } catch (error) {
      console.error("Failed to create todo:", error);
      // TODO: Show error toast/snackbar
    }
  };

  // Listen for drawer save events to refetch list after updates
  React.useEffect(() => {
    const handler = () => {
      todosQuery.refetch?.();
    };
    window.addEventListener("workz-todos-refetch", handler as EventListener);
    return () => window.removeEventListener("workz-todos-refetch", handler as EventListener);
  }, [todosQuery]);

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      height={{ xs: "auto", md: "100vh" }}
      minHeight={{ xs: "100vh", md: "auto" }}
    >
      {/* Reference Menu */}
      <ProjectMenu
        todos={todosQuery.todos || []}
        selectedProject={selectedReference}
        onProjectSelect={setSelectedReference}
        open={projectMenuOpen}
        onToggle={() => setProjectMenuOpen(!projectMenuOpen)}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main Content */}
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        flex={1}
        sx={{
          ml: projectMenuOpen ? { md: "280px" } : 0,
          transition: "margin-left 0.3s ease",
          p: 2,
          overflow: { xs: "visible", md: "hidden" }, // Allow natural scroll on mobile
          minWidth: 0, // Prevent flex item from overflowing
          height: { xs: "auto", md: "100%" } // Auto height on mobile
        }}
      >
        <ToDoToolbar
        searchQuery={tableState.searchQuery}
        onSearchChange={tableState.setSearchQuery}
        statusFilter={tableState.statusFilter}
        onStatusFilterChange={tableState.setStatusFilter}
        priorityFilter={tableState.priorityFilter}
        onPriorityFilterChange={tableState.setPriorityFilter}
        assigneeFilter={tableState.assigneeFilter}
        onAssigneeFilterChange={tableState.setAssigneeFilter}
        groupBy={tableState.groupBy}
        onGroupByChange={tableState.setGroupBy}
        sortBy={tableState.sortBy}
        onSortByChange={tableState.setSortBy}
        sortOrder={tableState.sortOrder}
        onSortOrderChange={tableState.setSortOrder}
        hideClosedCancelled={tableState.hideClosedCancelled}
        onHideClosedCancelledChange={tableState.setHideClosedCancelled}
        quickFilter={tableState.quickFilter}
        onQuickFilterChange={tableState.setQuickFilter}
        currentReference={selectedReference}
        todos={todosQuery.todos || []}
        onRefresh={todosQuery.refetch}
        onMenuToggle={() => setProjectMenuOpen(!projectMenuOpen)}
        menuOpen={projectMenuOpen}
        activeFilter={getActiveFilterDisplay(selectedReference)}
        onClearFilter={handleClearFilter}
        onQuickCreate={handleQuickCreate}
      />

      {/* Assignee Quick Filter (Desktop only) */}
      <AssigneeAvatars
        todos={tableState.filteredTodosForAvatars}
        selectedAssignee={tableState.assigneeFilter}
        onAssigneeSelect={(assignee) => tableState.setAssigneeFilter(assignee || "")}
      />

      {useCards ? (
        <ToDoListMobile
          onOpen={handleOpen}
          groupedTodos={tableState.groupedTodos}
        />
      ) : (
        <ToDoTable
          onOpen={handleOpen}
          groupedTodos={tableState.groupedTodos}
        />
      )}
      {/* Drawer rendered once at page root to preserve state */}
      <ToDoDetailDrawer
        open={drawerOpen}
        onClose={handleClose}
        todoId={selectedTodoId}
        todo={selectedTodo}
        onRefresh={todosQuery.refetch}
      />
        {/* Context menu and dialogs will be added in later slices */}
      </Box>
    </Box>
  );
}