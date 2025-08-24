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
import { useTodos } from "../../hooks/useTodos";

export interface SelectionApi {
  state: { selected: Set<string>; lastSelectedId: string | null; mode: "none" | "selecting" };
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
}
export interface ToDoListMobileProps {
  onOpen?: (id: string) => void;
  selection?: SelectionApi; // reserved for future selection UI
  orderedIds?: string[];
}

export function ToDoListMobile(props: ToDoListMobileProps) {
  const { onOpen } = props;
  const { todos, isLoading, error, refetch } = useTodos();

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
                </Box>
                <IconButton size="small" aria-label="Open actions">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip size="small" variant="outlined" label={item.status || ""} />
                <Chip size="small" variant="outlined" label={item.priority || ""} />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                <Avatar sx={{ width: 24, height: 24 }}>
                  {(item.assignee || "?").slice(0, 1).toUpperCase()}
                </Avatar>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {(item.assignee || "Unassigned")} • {(item.updatedAt || "")}
                </Typography>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}