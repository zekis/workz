/**
 * ToDoActivity
 * - Presentational component that renders a list of activity items and a simple comment composer
 * - Uses the useTodoActivity hook API (mock for now; backend later)
 * - Keep file small and focused on rendering and accessibility
 */
import React from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { ActivityItem, useTodoActivity } from "../../hooks/useTodoActivity";

export interface ToDoActivityProps {
  todoId: string | null;
}

function renderActivityItem(item: ActivityItem) {
  switch (item.type) {
    case "status_change": {
      const from = (item.meta as any)?.from ?? "unknown";
      const to = (item.meta as any)?.to ?? "unknown";
      return (
        <ListItem alignItems="flex-start" key={item.id}>
          <ListItemAvatar>
            <Avatar variant="rounded">S</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="body2">
                Status changed from <b>{from}</b> to <b>{to}</b>
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {new Date(item.createdAt).toLocaleString()}
              </Typography>
            }
          />
        </ListItem>
      );
    }
    case "assignment": {
      const assignee = (item.meta as any)?.assignee ?? "unknown";
      return (
        <ListItem alignItems="flex-start" key={item.id}>
          <ListItemAvatar>
            <Avatar variant="rounded">A</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="body2">Assigned to <b>{assignee}</b></Typography>}
            secondary={
              <Typography variant="caption" color="text.secondary">
                {new Date(item.createdAt).toLocaleString()}
              </Typography>
            }
          />
        </ListItem>
      );
    }
    case "comment":
    default: {
      const initials = (item.author?.name || "?").slice(0, 1).toUpperCase();
      return (
        <ListItem alignItems="flex-start" key={item.id}>
          <ListItemAvatar>
            <Avatar>{initials}</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="body2">{item.author?.name || "User"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(item.createdAt).toLocaleString()}
                </Typography>
              </Stack>
            }
            secondary={<Typography variant="body2">{item.content}</Typography>}
          />
        </ListItem>
      );
    }
  }
}

export function ToDoActivity(props: ToDoActivityProps) {
  const { todoId } = props;
  const [comment, setComment] = React.useState("");
  const { activity, addComment } = useTodoActivity(todoId);

  const onAdd = () => {
    const c = comment.trim();
    if (!c) return;
    addComment(c);
    setComment("");
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Activity
      </Typography>

      {/* Composer */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a comment…"
          aria-label="Add a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              onAdd();
            }
          }}
        />
        <Button variant="contained" onClick={onAdd} aria-label="Post comment">
          Post
        </Button>
      </Stack>

      <Divider sx={{ mb: 1 }} />

      {/* List */}
      <List dense aria-label="Activity list">
        {activity.map((item) => renderActivityItem(item))}
        {activity.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No activity yet.
          </Typography>
        )}
      </List>
    </Box>
  );
}