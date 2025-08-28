/**
 * NewTodoDialog
 * - Dialog for creating new todos
 * - Allows selection of reference type and reference name (project)
 * - Pre-selects current filter if applicable
 */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import { useFrappeCreateDoc } from "frappe-react-sdk";
import type { Todo } from "../../hooks/useTodos";
import { useReferenceDocuments } from "../../hooks/useReferenceDocuments";
import { useUsers } from "../../hooks/useUsers";

export interface NewTodoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentReference?: string | null; // Current filter to pre-select
  todos: Todo[]; // For extracting available projects
}

export function NewTodoDialog(props: NewTodoDialogProps) {
  const { open, onClose, onSuccess, currentReference, todos } = props;

  const { createDoc, loading } = useFrappeCreateDoc();

  const [subject, setSubject] = React.useState("");
  const [priority, setPriority] = React.useState<"High" | "Medium" | "Low">("Medium");
  const [status, setStatus] = React.useState<"Open" | "In Progress">("Open");
  const [referenceType, setReferenceType] = React.useState("");
  const [referenceName, setReferenceName] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

  // Fetch available reference documents based on selected type
  const { documents: referenceDocuments, isLoading: isLoadingDocs } = useReferenceDocuments(referenceType);

  // Fetch available users for assignment
  const { users, isLoading: isLoadingUsers } = useUsers();

  // Available reference types
  const referenceTypes = ["Project", "Activity", "Communication", "Task", "Issue"];

  // Pre-select reference based on current filter
  React.useEffect(() => {
    if (open && currentReference) {
      if (currentReference.startsWith("Project:")) {
        // Specific project selected
        const projectName = currentReference.substring(8);
        setReferenceType("Project");
        setReferenceName(projectName);
      } else if (currentReference !== "" && currentReference !== "No Reference") {
        // Reference type selected
        setReferenceType(currentReference);
        setReferenceName("");
      } else {
        // No reference or "All"
        setReferenceType("");
        setReferenceName("");
      }
    }
  }, [open, currentReference]);

  const handleClose = () => {
    // Reset form
    setSubject("");
    setPriority("Medium");
    setStatus("Open");
    setReferenceType("");
    setReferenceName("");
    setAssignee("");
    setDueDate("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!subject.trim()) return;

    try {
      const payload: any = {
        description: subject.trim(),
        priority,
        status,
        allocated_to: assignee.trim() || null,
        date: dueDate || null
      };

      // Add reference fields if specified
      if (referenceType) {
        payload.reference_type = referenceType;
        if (referenceName) {
          payload.reference_name = referenceName;
        }
      }

      await createDoc("ToDo", payload);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Failed to create todo:", error);
      // TODO: Show error message to user
    }
  };

  const canSubmit = subject.trim().length > 0 && !loading;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 1300 }}
      PaperProps={{
        sx: { minHeight: "400px" }
      }}
    >
      <DialogTitle>Create New ToDo</DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Subject */}
          <TextField
            autoFocus
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What needs to be done?"
            multiline
            rows={2}
            required
          />

          {/* Priority and Status */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Reference Type */}
          <FormControl fullWidth>
            <InputLabel>Reference Type</InputLabel>
            <Select
              value={referenceType}
              label="Reference Type"
              onChange={(e) => {
                const newType = e.target.value;
                setReferenceType(newType);
                setReferenceName(""); // Reset reference name when type changes
              }}
            >
              <MenuItem value="">None</MenuItem>
              {referenceTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reference Name - only show if reference type is selected */}
          {referenceType && (
            <TextField
              select
              fullWidth
              label={`${referenceType} Name`}
              value={referenceName}
              onChange={(e) => setReferenceName(e.target.value)}
              size="small"
              helperText={
                isLoadingDocs
                  ? "Loading documents..."
                  : "Select the specific document to reference"
              }
              disabled={isLoadingDocs}
            >
              <MenuItem value="">None</MenuItem>
              {referenceDocuments.map((doc) => (
                <MenuItem key={doc.name} value={doc.name}>
                  {doc.displayValue}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Assignee */}
          <TextField
            select
            fullWidth
            label="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            size="small"
            helperText={
              isLoadingUsers
                ? "Loading users..."
                : "Optional: Select user to assign this todo to"
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

          {/* Due Date */}
          <TextField
            fullWidth
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            size="small"
            helperText="Optional: Set a due date for this todo"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!canSubmit}
        >
          {loading ? "Creating..." : "Create ToDo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
