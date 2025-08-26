/**
 * SubtasksList
 * - Displays and manages subtasks within a todo drawer
 * - Allows creating, completing, and deleting subtasks
 * - Shows completion progress
 */
import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  TextField,
  Button,
  LinearProgress,
  Chip,
  Collapse,
  Divider,
  Menu,
  MenuItem
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon
} from "@mui/icons-material";
import { useSubtasks } from "../../hooks/useSubtasks";
import type { Subtask } from "../../hooks/useSubtasks";

export interface SubtasksListProps {
  parentTodoId: string;
}

export function SubtasksList({ parentTodoId }: SubtasksListProps) {
  const [expanded, setExpanded] = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newSubtaskText, setNewSubtaskText] = React.useState("");
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedSubtask, setSelectedSubtask] = React.useState<Subtask | null>(null);

  const {
    subtasks,
    totalSubtasks,
    completedSubtasks,
    completionPercentage,
    isLoading,
    isWorking,
    createNewSubtask,
    toggleSubtaskComplete,
    removeSubtask
  } = useSubtasks(parentTodoId);

  const handleAddSubtask = async () => {
    if (!newSubtaskText.trim()) return;

    try {
      await createNewSubtask({
        description: newSubtaskText.trim()
      });
      setNewSubtaskText("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to create subtask:", error);
    }
  };

  const handleToggleComplete = async (subtask: Subtask) => {
    try {
      await toggleSubtaskComplete(subtask);
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, subtask: Subtask) => {
    setMenuAnchor(event.currentTarget);
    setSelectedSubtask(subtask);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSubtask(null);
  };

  const handleDeleteSubtask = async () => {
    if (!selectedSubtask) return;

    try {
      await removeSubtask(selectedSubtask.name);
      handleMenuClose();
    } catch (error) {
      console.error("Failed to delete subtask:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <Box>
      <Divider sx={{ my: 2 }} />
      
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            Subtasks
          </Typography>
          {totalSubtasks > 0 && (
            <Chip
              label={`${completedSubtasks}/${totalSubtasks}`}
              size="small"
              color={completedSubtasks === totalSubtasks ? "success" : "default"}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Progress Bar */}
      {totalSubtasks > 0 && (
        <Box sx={{ mt: 1, mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            {completionPercentage}% complete
          </Typography>
        </Box>
      )}

      <Collapse in={expanded}>
        {/* Subtasks List */}
        {totalSubtasks > 0 && (
          <List dense sx={{ py: 0 }}>
            {subtasks.map((subtask) => (
              <ListItem
                key={subtask.name}
                sx={{
                  px: 0,
                  opacity: subtask.status === "Closed" ? 0.7 : 1
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    checked={subtask.status === "Closed"}
                    onChange={() => handleToggleComplete(subtask)}
                    icon={<UncheckedIcon />}
                    checkedIcon={<CheckCircleIcon />}
                    size="small"
                    disabled={isWorking}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={subtask.description}
                  sx={{
                    "& .MuiListItemText-primary": {
                      textDecoration: subtask.status === "Closed" ? "line-through" : "none",
                      fontSize: "0.875rem"
                    }
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, subtask)}
                    disabled={isWorking}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Add New Subtask */}
        {showAddForm ? (
          <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter subtask description..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isWorking}
              autoFocus
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddSubtask}
              disabled={!newSubtaskText.trim() || isWorking}
            >
              Add
            </Button>
            <Button
              size="small"
              onClick={() => {
                setShowAddForm(false);
                setNewSubtaskText("");
              }}
              disabled={isWorking}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            size="small"
            sx={{ mt: 1 }}
            disabled={isWorking}
          >
            Add Subtask
          </Button>
        )}

        {/* Empty State */}
        {totalSubtasks === 0 && !showAddForm && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: "italic" }}>
            No subtasks yet. Break down this todo into smaller tasks.
          </Typography>
        )}
      </Collapse>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteSubtask} disabled={isWorking}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Subtask
        </MenuItem>
      </Menu>
    </Box>
  );
}
