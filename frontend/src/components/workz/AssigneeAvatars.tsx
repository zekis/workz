/**
 * AssigneeAvatars
 * - Shows assignee avatars as quick filter buttons
 * - Only visible on desktop displays
 * - Uses random colors for avatars
 */
import React from "react";
import {
  Avatar,
  AvatarGroup,
  Box,
  Chip,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import type { Todo } from "../../hooks/useTodos";

export interface AssigneeAvatarsProps {
  todos: Todo[];
  selectedAssignee?: string;
  onAssigneeSelect?: (assignee: string | null) => void;
}

// Generate consistent colors for assignees
const getAssigneeColor = (assignee: string): string => {
  const colors = [
    "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
    "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
    "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800",
    "#ff5722", "#795548", "#607d8b"
  ];
  
  let hash = 0;
  for (let i = 0; i < assignee.length; i++) {
    hash = assignee.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from email or name
const getInitials = (assignee: string): string => {
  if (!assignee) return "?";
  
  // If it's an email, use the part before @
  if (assignee.includes("@")) {
    const username = assignee.split("@")[0];
    return username.substring(0, 2).toUpperCase();
  }
  
  // Otherwise, use first two characters
  return assignee.substring(0, 2).toUpperCase();
};

export function AssigneeAvatars({ todos, selectedAssignee, onAssigneeSelect }: AssigneeAvatarsProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Don't show on mobile
  if (!isDesktop) {
    return null;
  }

  // Get unique assignees with counts
  const assigneeStats = React.useMemo(() => {
    const stats = new Map<string, number>();
    
    todos.forEach(todo => {
      if (todo.assignee) {
        stats.set(todo.assignee, (stats.get(todo.assignee) || 0) + 1);
      }
    });

    return Array.from(stats.entries())
      .map(([assignee, count]) => ({ assignee, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [todos]);

  if (assigneeStats.length === 0) {
    return null;
  }

  const handleAssigneeClick = (assignee: string) => {
    if (selectedAssignee === assignee) {
      onAssigneeSelect?.(null); // Clear filter
    } else {
      onAssigneeSelect?.(assignee);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Filter by Assignee
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {assigneeStats.map(({ assignee, count }) => {
          const isSelected = selectedAssignee === assignee;
          const color = getAssigneeColor(assignee);
          const initials = getInitials(assignee);
          
          return (
            <Tooltip key={assignee} title={`${assignee} (${count} todos)`}>
              <Chip
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: color,
                      color: "white",
                      width: 24,
                      height: 24,
                      fontSize: "0.75rem"
                    }}
                  >
                    {initials}
                  </Avatar>
                }
                label={count}
                variant={isSelected ? "filled" : "outlined"}
                color={isSelected ? "primary" : "default"}
                onClick={() => handleAssigneeClick(assignee)}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: isSelected ? "primary.dark" : "action.hover"
                  }
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}
