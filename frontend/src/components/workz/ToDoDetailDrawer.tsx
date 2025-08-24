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
import { ToDoActivity } from "./ToDoActivity";
import type { Todo } from "../../hooks/useTodos";
import { useFrappeUpdateDoc } from "frappe-react-sdk";

type Status = "Backlog" | "Planned" | "Open" | "Closed" | "Cancelled";
type Priority = "High" | "Medium" | "Low";

export interface ToDoDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  todoId?: string | null;
  todo?: Todo | null;
}

export function ToDoDetailDrawer(props: ToDoDetailDrawerProps) {
  const { open, onClose, todoId, todo } = props;
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [subject, setSubject] = React.useState("");
  const [status, setStatus] = React.useState<Status>("Open");
  const [priority, setPriority] = React.useState<Priority>("Medium");
  const [assignee, setAssignee] = React.useState("");

  const { updateDoc, loading: isSaving } = useFrappeUpdateDoc();

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
    } else {
      setSubject("");
      setStatus("Open");
      setPriority("Medium");
      setAssignee("");
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
  }, [todoId, subject, status, priority, assignee, updateDoc]);

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
            <IconButton aria-label="Close details" onClick={onClose}>
              <CloseIcon />
            </IconButton>
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
            autoFocus
            inputProps={{ "aria-label": "Subject" }}
            multiline
            minRows={2}
            maxRows={6}
          />

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
            label="Assignee"
            value={assignee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAssignee(e.target.value)
            }
            size="small"
            placeholder="user@example.com"
          />

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
    </Dialog>
  );
}
