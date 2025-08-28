/**
 * ToDoListMobile
 * - Mobile xs/sm renderer using outlined cards per spec
 * - Emits onOpen(id) when a card is tapped to open the detail drawer
 * - Uses useTodos for real data; shows loading/empty/error states
 */
import React from "react";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  FolderOpen as ProjectIcon,
  Assignment as ActivityIcon,
  Email as CommunicationIcon,
  Task as TaskIcon,
  BugReport as IssueIcon,
  Description as DocumentIcon,
  Inbox as UnassignedIcon
} from "@mui/icons-material";
import { useTodos } from "../../hooks/useTodos";
import { useContextMenu } from "../../hooks/useContextMenu";
import { ToDoContextMenu } from "./ToDoContextMenu";
import { useSubtaskCounts } from "../../hooks/useSubtaskCounts";
import { SubtaskProgress } from "./SubtaskProgress";

// Helper functions for colors (same as table)
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

function getReferenceIcon(referenceType: string | null | undefined) {
  switch (referenceType?.toLowerCase()) {
    case "project": return <ProjectIcon fontSize="small" color="primary" />;
    case "activity": return <ActivityIcon fontSize="small" color="secondary" />;
    case "communication": return <CommunicationIcon fontSize="small" color="success" />;
    case "task": return <TaskIcon fontSize="small" color="warning" />;
    case "issue": return <IssueIcon fontSize="small" color="error" />;
    case "":
    case null:
    case undefined: return <UnassignedIcon fontSize="small" color="disabled" />;
    default: return <DocumentIcon fontSize="small" color="action" />;
  }
}

export interface ToDoListMobileProps {
  onOpen?: (id: string) => void;
  groupedTodos?: import("../../hooks/useTodoTableState").TodoGroup[];
}

export function ToDoListMobile(props: ToDoListMobileProps) {
  const { onOpen, groupedTodos } = props;
  const { isLoading, error, refetch } = useTodos();
  const contextMenu = useContextMenu();

  // Get all todo IDs for subtask count fetching
  const todoIds = React.useMemo(() => {
    if (!groupedTodos) return [];
    return groupedTodos.flatMap(group => group.todos.map(todo => todo.id));
  }, [groupedTodos]);

  // Fetch subtask counts for all todos
  const { getSubtaskCount } = useSubtaskCounts(todoIds);

  // Flatten grouped todos
  const todos = React.useMemo(() => {
    if (!groupedTodos) return [];
    return groupedTodos.flatMap(group => group.todos);
  }, [groupedTodos]);

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
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Loading todos…</Typography>
      </Box>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">No todos yet.</Typography>
      </Box>
    );
  }

  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} aria-label="ToDo mobile card list" role="list">
      {todos.map(item => (
        <Card key={item.id} variant="outlined" role="listitem">
          <CardActionArea onClick={() => onOpen?.(item.id)}>
            <CardContent>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                {/* Reference Type Icon */}
                <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                  {getReferenceIcon(item.referenceType)}
                </Box>

                <Box flex={1} minWidth={0}>
                  {/* Clamp subject to 2 lines for consistency with table */}
                  <Typography
                    variant="subtitle1"
                    title={item.subject}
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {item.subject}
                  </Typography>

                  {/* Subtask Progress */}
                  <SubtaskProgress
                    subtaskCount={getSubtaskCount(item.id)}
                    variant="compact"
                  />

                  <Typography variant="caption" color="text.secondary">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ""}
                    {item.updatedAt && item.owner && " • "}
                    {item.owner && `Created by ${item.owner}`}
                    {item.dueDate && (
                      <>
                        {(item.updatedAt || item.owner) && " • "}
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </>
                    )}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  aria-label="Open actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    contextMenu.handleContextMenu(e, item);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip
                  size="small"
                  variant="outlined"
                  label={item.status || "No Status"}
                  color={getStatusColor(item.status)}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={item.priority || "No Priority"}
                  color={getPriorityColor(item.priority)}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                <Avatar sx={{ width: 24, height: 24 }}>
                  {(item.assignee || "?").slice(0, 1).toUpperCase()}
                </Avatar>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {(item.assignee || "Unassigned")}
                </Typography>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}

      <ToDoContextMenu
        anchorEl={contextMenu.anchorEl}
        open={contextMenu.open}
        onClose={contextMenu.handleClose}
        todo={contextMenu.selectedTodo}
        onOpen={onOpen}
        onRefresh={refetch}
      />
    </Box>
  );
}