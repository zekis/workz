/**
 * ToDoDetailDrawer
 * - Side drawer (md+) and full-screen (xs/sm) container for viewing/editing a single ToDo
 * - Uses frappe-react-sdk for writes; CSRF header is injected by the global fetch interceptor
 */
import React from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  TextField,
  MenuItem
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LaunchIcon from "@mui/icons-material/Launch";
import { ToDoActivity } from "./ToDoActivity";
import type { Todo } from "../../hooks/useTodos";
import { useFrappeUpdateDoc, useFrappeDeleteDoc } from "frappe-react-sdk";
import { useReferenceDocuments } from "../../hooks/useReferenceDocuments";
import { useUsers } from "../../hooks/useUsers";

type Status = "Backlog" | "Planned" | "Open" | "Closed" | "Cancelled";
type Priority = "High" | "Medium" | "Low";

export interface ToDoDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  todoId?: string | null;
  todo?: Todo | null;
  onRefresh?: () => void;
}

export function ToDoDetailDrawer(props: ToDoDetailDrawerProps) {
  const { open, onClose, todoId, todo, onRefresh } = props;
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [subject, setSubject] = React.useState("");
  const [status, setStatus] = React.useState<Status>("Open");
  const [priority, setPriority] = React.useState<Priority>("Medium");
  const [assignee, setAssignee] = React.useState("");
  const [referenceType, setReferenceType] = React.useState("");
  const [referenceName, setReferenceName] = React.useState("");

  const { updateDoc, loading: isSaving } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();

  // Fetch available reference documents based on selected type
  const { documents: referenceDocuments, isLoading: isLoadingDocs } = useReferenceDocuments(referenceType);

  // Fetch available users for assignment
  const { users, isLoading: isLoadingUsers } = useUsers();

  const [deleteDialog, setDeleteDialog] = React.useState(false);

  const [snack, setSnack] = React.useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  React.useEffect(() => {
    if (todo) {
      setSubject(todo.subject || "");
      setStatus(
        (["Backlog", "Planned", "Open", "Closed", "Cancelled"].includes(
          (todo.status as string) ?? ""
        )
          ? (todo.status as Status)
          : "Open")
      );
      setPriority(
        (["High", "Medium", "Low"].includes((todo.priority as string) ?? "")
          ? (todo.priority as Priority)
          : "Medium")
      );
      setAssignee(todo.assignee || "");
      setReferenceType(todo.referenceType || "");
      setReferenceName(todo.referenceName || "");
    } else {
      setSubject("");
      setStatus("Open");
      setPriority("Medium");
      setAssignee("");
      setReferenceType("");
      setReferenceName("");
    }
  }, [todo]);

  const headerSubject =
    subject && subject.trim().length > 0 ? subject : `ToDo ${todoId ?? ""}`;

  const onSave = React.useCallback(async () => {
    if (!todoId) return;
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      setSnack({
        open: true,
        severity: "error",
        message: "Subject cannot be empty.",
      });
      return;
    }

    const payload: Record<string, any> = {
      description: trimmedSubject,
      status,
      priority,
      allocated_to: assignee || null,
      reference_type: referenceType || null,
      reference_name: referenceName || null,
    };

    try {
      await updateDoc("ToDo", todoId, payload);
      setSnack({ open: true, severity: "success", message: "ToDo updated." });
    } catch (err: any) {
      setSnack({
        open: true,
        severity: "error",
        message: err?.message || "Failed to update ToDo.",
      });
    }
  }, [todoId, subject, status, priority, assignee, referenceType, referenceName, updateDoc]);

  // Clear reference name when reference type changes
  const handleReferenceTypeChange = (newType: string) => {
    setReferenceType(newType);
    if (newType !== referenceType) {
      setReferenceName(""); // Clear reference name when type changes
    }
  };

  const handleDelete = async () => {
    if (!todoId) return;
    try {
      await deleteDoc("ToDo", todoId);
      setSnack({ open: true, severity: "success", message: "ToDo deleted." });
      onRefresh?.();
      onClose();
    } catch (err: any) {
      setSnack({
        open: true,
        severity: "error",
        message: err?.message || "Failed to delete ToDo.",
      });
    }
    setDeleteDialog(false);
  };

  const handleToggleComplete = async () => {
    if (!todoId || !todo) return;
    try {
      const newStatus = todo.status === "Closed" ? "Open" : "Closed";
      await updateDoc("ToDo", todoId, { status: newStatus });
      setSnack({
        open: true,
        severity: "success",
        message: `ToDo marked as ${newStatus.toLowerCase()}.`
      });
      onRefresh?.();
    } catch (err: any) {
      setSnack({
        open: true,
        severity: "error",
        message: err?.message || "Failed to update ToDo status.",
      });
    }
  };

  const content = (
    <Box
      role="dialog"
      aria-label="ToDo details"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* Header for md+ drawer */}
      {isMdUp && (
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
                title={headerSubject}
              >
                {headerSubject}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <IconButton
                aria-label={todo?.status === "Closed" ? "Mark as incomplete" : "Mark as complete"}
                onClick={handleToggleComplete}
                color={todo?.status === "Closed" ? "success" : "default"}
              >
                {todo?.status === "Closed" ? (
                  <CheckCircleIcon />
                ) : (
                  <RadioButtonUncheckedIcon />
                )}
              </IconButton>
              <IconButton
                aria-label="Delete todo"
                onClick={() => setDeleteDialog(true)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
              <IconButton aria-label="Close details" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      )}

      <Divider />

      <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
        <Stack spacing={2}>
          <TextField
            label="Subject"
            value={subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSubject(e.target.value)
            }
            size="small"
            inputProps={{ "aria-label": "Subject" }}
            multiline
            minRows={2}
            maxRows={6}
          />

          {/* Reference Link */}
          {todo?.referenceType && todo?.referenceName && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Reference:
              </Typography>
              <Button
                variant="text"
                size="small"
                startIcon={<LaunchIcon />}
                onClick={() => {
                  const referenceUrl = `/app/${todo.referenceType?.toLowerCase()}/${todo.referenceName}`;
                  window.open(referenceUrl, '_blank');
                }}
                sx={{ textTransform: 'none' }}
              >
                {todo.referenceType}: {todo.referenceName}
              </Button>
            </Box>
          )}

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setStatus(e.target.value as Status)
            }
            size="small"
          >
            <MenuItem value="Backlog">Backlog</MenuItem>
            <MenuItem value="Planned">Planned</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </TextField>

          <TextField
            select
            label="Priority"
            value={priority}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPriority(e.target.value as Priority)
            }
            size="small"
          >
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </TextField>

          <TextField
            select
            label="Assignee"
            value={assignee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAssignee(e.target.value)
            }
            size="small"
            helperText={
              isLoadingUsers
                ? "Loading users..."
                : "Select user to assign this todo"
            }
            disabled={isLoadingUsers}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.name} value={user.email}>
                {user.full_name ? `${user.full_name} (${user.email})` : user.email}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Reference Type"
            value={referenceType}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleReferenceTypeChange(e.target.value)
            }
            size="small"
            helperText="Link this todo to a document type"
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="Project">Project</MenuItem>
            <MenuItem value="Activity">Activity</MenuItem>
            <MenuItem value="Communication">Communication</MenuItem>
            <MenuItem value="Task">Task</MenuItem>
            <MenuItem value="Issue">Issue</MenuItem>
          </TextField>

          <TextField
            select
            label="Reference Name"
            value={referenceName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setReferenceName(e.target.value)
            }
            size="small"
            helperText={
              !referenceType
                ? "Select a reference type first"
                : isLoadingDocs
                ? "Loading documents..."
                : "Select the specific document to reference"
            }
            disabled={!referenceType || isLoadingDocs}
          >
            <MenuItem value="">None</MenuItem>
            {referenceDocuments.map((doc) => (
              <MenuItem key={doc.name} value={doc.name}>
                {doc.title || doc.name}
              </MenuItem>
            ))}
          </TextField>

          <Divider />

          <ToDoActivity todoId={todoId ?? null} />
        </Stack>
      </Box>

      {/* Sticky action bar (bottom) */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="text"
          onClick={onClose}
          aria-label="Cancel changes"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={isSaving || !todoId}
          onClick={onSave}
          aria-label="Save changes"
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </Box>

      {/* Snackbar feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );

  if (isMdUp) {
    // Side drawer for desktop
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: 448, maxWidth: "90vw" } }}
      >
        {content}
      </Drawer>
    );
  }

  // Full-screen dialog for mobile with AppBar
  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar sx={{ position: "sticky", top: 0 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </IconButton>
          <Typography
            sx={{
              ml: 2,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            variant="h6"
            component="h2"
            title={headerSubject}
          >
            {headerSubject}
          </Typography>
          <Button
            color="inherit"
            disabled={isSaving || !todoId}
            onClick={onSave}
            aria-label="Save changes"
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </Toolbar>
      </AppBar>
      {content}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete ToDo</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this ToDo?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
            {subject}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
