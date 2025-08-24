/**
 * ToDoTable
 * - Desktop/md+ renderer
 * - Uses useTodos hook for data; shows basic loading/empty/error states
 * - Emits onOpen(id) on row click
 * - Includes task completion buttons for quick status changes
 */
import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Collapse,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import { useTodos } from "../../hooks/useTodos";
import { useContextMenu } from "../../hooks/useContextMenu";
import { ToDoContextMenu } from "./ToDoContextMenu";
import { useFrappeUpdateDoc } from "frappe-react-sdk";

// Helper functions for colors
function getStatusColor(status: string | null | undefined): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (status?.toLowerCase()) {
    case "open": return "info";
    case "in progress": return "primary";
    case "blocked": return "warning";
    case "closed": return "success";
    case "cancelled": return "error";
    default: return "default";
  }
}

function getPriorityColor(priority: string | null | undefined): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (priority?.toLowerCase()) {
    case "high": return "error";
    case "medium": return "warning";
    case "low": return "info";
    default: return "default";
  }
}

export interface ToDoTableProps {
  onOpen?: (id: string) => void;
  groupedTodos?: import("../../hooks/useTodoTableState").TodoGroup[];
}

export function ToDoTable(props: ToDoTableProps) {
  const { onOpen, groupedTodos } = props;
  const { isLoading, error, refetch } = useTodos();
  const contextMenu = useContextMenu();
  const { updateDoc } = useFrappeUpdateDoc();

  // Track collapsed groups
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());

  // Flatten grouped todos for selection logic
  const todos = React.useMemo(() => {
    if (!groupedTodos) return [];
    return groupedTodos.flatMap(group => group.todos);
  }, [groupedTodos]);

  const handleToggleComplete = async (todo: import("../../hooks/useTodos").Todo) => {
    try {
      const newStatus = todo.status === "Closed" ? "Open" : "Closed";
      await updateDoc("ToDo", todo.id, { status: newStatus });
      refetch();
    } catch (error) {
      console.error("Failed to update todo status:", error);
    }
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  if (error) {
    return (
      <Box sx={{ p: 2, border: "1px solid", borderColor: "error.main", bgcolor: "error.light", color: "error.contrastText", borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Error</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>Failed to load ToDos</Typography>
        <button
          onClick={() => refetch?.()}
          style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", textDecoration: "underline", padding: 0 }}
          aria-label="Retry loading ToDos"
        >
          Retry
        </button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Loading todos…</Typography>
      </Paper>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">No todos yet.</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ width: "100%", overflowX: "auto" }} aria-label="ToDo table">
      <Table size="medium" aria-label="ToDo data table" sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                fontWeight: 700,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"
              }
            }}
          >
            <TableCell sx={{ width: { xs: "40%", md: "50%" } }}>Subject</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell sx={{ width: 60 }}>Complete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groupedTodos?.map((group) => (
            <React.Fragment key={group.key}>
              {/* Group Header - only show if there are multiple groups */}
              {groupedTodos.length > 1 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    sx={{
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                      color: (theme) => theme.palette.mode === 'dark' ? 'grey.100' : 'grey.800',
                      fontWeight: 600,
                      py: 1,
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                      }
                    }}
                    onClick={() => toggleGroupCollapse(group.key)}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {collapsedGroups.has(group.key) ? (
                        <ExpandMoreIcon fontSize="small" />
                      ) : (
                        <ExpandLessIcon fontSize="small" />
                      )}
                      <span>{group.label} ({group.todos.length})</span>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {/* Group Items */}
              {!collapsedGroups.has(group.key) && group.todos.map((r) => {
                return (
                  <TableRow
                    key={r.id}
                    hover
                    role="row"
                    onClick={() => onOpen?.(r.id)}
                    onContextMenu={(e) => contextMenu.handleContextMenu(e, r)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Box>
                        <Typography
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                          title={r.subject}
                        >
                          {r.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ""}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r.status || "No Status"}
                        color={getStatusColor(r.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r.priority || "No Priority"}
                        color={getPriorityColor(r.priority)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>{r.assignee || "Unassigned"}</Typography>
                    </TableCell>
                    <TableCell sx={{ width: 60 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Tooltip title={r.status === "Closed" ? "Mark as incomplete" : "Mark as complete"}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleComplete(r)}
                          color={r.status === "Closed" ? "success" : "default"}
                        >
                          {r.status === "Closed" ? (
                            <CheckCircleIcon />
                          ) : (
                            <RadioButtonUncheckedIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      <ToDoContextMenu
        anchorEl={contextMenu.anchorEl}
        open={contextMenu.open}
        onClose={contextMenu.handleClose}
        todo={contextMenu.selectedTodo}
        onOpen={onOpen}
        onRefresh={refetch}
      />
    </Paper>
  );
}