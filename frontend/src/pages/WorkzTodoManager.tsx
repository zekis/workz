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
import { useMobileView } from "../hooks/useMobileView";
import { useSelectionModel } from "../hooks/useSelectionModel";
import { useTodos, Todo } from "../hooks/useTodos";

export function WorkzTodoManager() {
  const { useCards } = useMobileView();

  // Data hook (real data or error per configuration)
  const todosQuery = useTodos();

  // Local state for selected todo and drawer open
  const [selectedTodoId, setSelectedTodoId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Derive the selected todo from list by id
  const selectedTodo: Todo | null = React.useMemo(() => {
    if (!selectedTodoId || !todosQuery.todos) return null;
    return todosQuery.todos.find(t => t.id === selectedTodoId) || null;
  }, [selectedTodoId, todosQuery.todos]);

  // Unified selection model shared between renderers
  const selection = useSelectionModel();

  const handleOpen = (id: string) => {
    setSelectedTodoId(id);
    setDrawerOpen(true);
  };
  const handleClose = () => {
    setDrawerOpen(false);
  };

  // Ordered ids (derived from data) for future range selection if needed
  const orderedIds = React.useMemo(
    () => (todosQuery.todos || []).map(t => t.id),
    [todosQuery.todos]
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <ToDoToolbar />
      {useCards ? (
        <ToDoListMobile
          onOpen={handleOpen}
          selection={selection}
          orderedIds={orderedIds}
        />
      ) : (
        <ToDoTable
          onOpen={handleOpen}
          selection={selection}
          orderedIds={orderedIds}
        />
      )}
      {/* Drawer rendered once at page root to preserve state */}
      <ToDoDetailDrawer
        open={drawerOpen}
        onClose={handleClose}
        todoId={selectedTodoId}
        todo={selectedTodo}
      />
      {/* Context menu and dialogs will be added in later slices */}
    </Box>
  );
}