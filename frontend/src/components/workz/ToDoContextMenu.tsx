/**
 * ToDoContextMenu
 * - Right-click context menu for ToDo items
 * - Quick actions: Open, Edit, Assign, Change Status, Delete
 * - Uses frappe-react-sdk for mutations
 */
import React from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Typography
} from "@mui/material";
import {
  OpenInNew as OpenIcon,
  Edit as EditIcon,
  PersonAdd as AssignIcon,
  ChangeCircle as StatusIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Launch as LaunchIcon
} from "@mui/icons-material";
import { useFrappeUpdateDoc, useFrappeDeleteDoc } from "frappe-react-sdk";
import type { Todo } from "../../hooks/useTodos";

export interface ToDoContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  todo: Todo | null;
  onOpen?: (todoId: string) => void;
  onRefresh?: () => void;
}

export function ToDoContextMenu(props: ToDoContextMenuProps) {
  const { anchorEl, open, onClose, todo, onOpen, onRefresh } = props;



  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  
  const [assignDialog, setAssignDialog] = React.useState(false);
  const [statusDialog, setStatusDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [assignee, setAssignee] = React.useState("");
  const [status, setStatus] = React.useState("");

  // Store todo data locally to prevent it from being cleared when context menu closes
  const [dialogTodo, setDialogTodo] = React.useState<Todo | null>(null);

  const handleOpenInFrappe = () => {
    if (todo) {
      // Open in new tab/window to Frappe todo page
      const frappeUrl = `/app/todo/${todo.id}`;
      window.open(frappeUrl, '_blank');
    }
    onClose();
  };

  const handleOpen = () => {
    if (todo && onOpen) {
      onOpen(todo.id);
    }
    onClose();
  };

  const handleEdit = () => {
    if (todo && onOpen) {
      onOpen(todo.id);
    }
    onClose();
  };

  const handleMarkComplete = async () => {
    if (!todo) return;
    console.log("Mark complete clicked for todo:", todo.id);
    try {
      const newStatus = todo.status === "Closed" ? "Open" : "Closed";
      await updateDoc("ToDo", todo.id, { status: newStatus });
      console.log("Mark complete successful");
      onRefresh?.();
    } catch (error) {
      console.error("Failed to mark complete:", error);
      alert("Failed to mark complete: " + (error as any)?.message);
    }
    onClose();
  };

  const handleAssign = () => {
    if (todo) {
      setDialogTodo(todo); // Store todo data for dialog
      setAssignee(todo.assignee || "");
      setAssignDialog(true);
    }
    onClose();
  };

  const handleChangeStatus = () => {
    if (todo) {
      setDialogTodo(todo); // Store todo data for dialog
      setStatus(todo.status || "Open");
      setStatusDialog(true);
    }
    onClose();
  };

  const handleDelete = () => {
    if (todo) {
      setDialogTodo(todo); // Store todo data for dialog
      setDeleteDialog(true);
    }
    onClose();
  };

  const confirmAssign = async () => {
    if (!dialogTodo) return;

    try {
      await updateDoc("ToDo", dialogTodo.id, {
        allocated_to: assignee.trim() || null
      });
      onRefresh?.();
      setAssignDialog(false);
      setDialogTodo(null);
    } catch (error) {
      console.error("Failed to assign ToDo:", error);
    }
  };

  const confirmStatusChange = async () => {
    if (!dialogTodo) return;

    try {
      await updateDoc("ToDo", dialogTodo.id, {
        status: status
      });
      onRefresh?.();
      setStatusDialog(false);
      setDialogTodo(null);
    } catch (error) {
      console.error("Failed to change status:", error);
    }
  };

  const confirmDelete = async () => {
    if (!dialogTodo) return;

    try {
      await deleteDoc("ToDo", dialogTodo.id);
      onRefresh?.();
      setDeleteDialog(false);
      setDialogTodo(null);
    } catch (error) {
      console.error("Failed to delete ToDo:", error);
    }
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={handleOpenInFrappe}>
          <ListItemIcon>
            <LaunchIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open in Frappe</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleMarkComplete}>
          <ListItemIcon>
            <CompleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {todo?.status === "Closed" ? "Mark as Incomplete" : "Mark as Complete"}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleAssign}>
          <ListItemIcon>
            <AssignIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Assign</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleChangeStatus}>
          <ListItemIcon>
            <StatusIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Status</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Assign Dialog */}
      <Dialog
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1400 }}
      >
        <DialogTitle>Assign ToDo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {dialogTodo?.subject || todo?.subject}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="user@example.com"
            helperText="Enter email address or leave empty to unassign"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmAssign}
            variant="contained"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1400 }}
      >
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {dialogTodo?.subject || todo?.subject}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
              MenuProps={{
                sx: { zIndex: 1500 }
              }}
            >
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Blocked">Blocked</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmStatusChange}
            variant="contained"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1400 }}
      >
        <DialogTitle>Delete ToDo</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this ToDo?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
            {dialogTodo?.subject || todo?.subject}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
