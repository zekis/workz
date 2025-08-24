/**
 * ToDoTable
 * - Desktop/md+ renderer
 * - Uses useTodos hook for data; shows basic loading/empty/error states
 * - Emits onOpen(id) on row click
 * - Selection checkboxes remain but are low priority and can be ignored
 */
import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  Box
} from "@mui/material";
import { useTodos } from "../../hooks/useTodos";

export interface SelectionApi {
  state: { selected: Set<string>; lastSelectedId: string | null; mode: "none" | "selecting" };
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
}
export interface ToDoTableProps {
  onOpen?: (id: string) => void;
  selection?: SelectionApi;
  orderedIds?: string[];
}

export function ToDoTable(props: ToDoTableProps) {
  const { onOpen, selection } = props;
  const { todos, isLoading, error, refetch } = useTodos();

  const allChecked = !!selection && selection.state.selected.size === todos.length;
  const someChecked = !!selection && selection.state.selected.size > 0 && !allChecked;

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
    <Paper variant="outlined" sx={{ width: "100%", overflow: "auto" }} aria-label="ToDo table">
      <Table size="medium">
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 600, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.default" } }}>
            <TableCell padding="checkbox">
              <Checkbox
                inputProps={{ "aria-label": "Select all" }}
                indeterminate={someChecked}
                checked={allChecked}
                onChange={() => {
                  if (!selection) return;
                  if (allChecked) {
                    todos.forEach(r => {
                      if (selection.isSelected(r.id)) selection.toggle(r.id);
                    });
                  } else {
                    todos.forEach(r => {
                      if (!selection.isSelected(r.id)) selection.toggle(r.id);
                    });
                  }
                }}
              />
            </TableCell>
            <TableCell sx={{ width: { xs: "40%", md: "45%" } }}>Subject</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell>Project</TableCell>
            <TableCell align="right">Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {todos.map(r => {
            const checked = selection ? selection.isSelected(r.id) : false;
            return (
              <TableRow
                key={r.id}
                hover
                role="row"
                onClick={() => onOpen?.(r.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Checkbox
                    checked={checked}
                    onChange={() => selection?.toggle(r.id)}
                    inputProps={{ "aria-label": `Select ${r.subject}` }}
                  />
                </TableCell>
                <TableCell>
                  {/* Allow up to 2 lines with ellipsis to avoid horizontal scrolling */}
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
                </TableCell>
                <TableCell><Typography variant="body2">{r.status || ""}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.priority || ""}</Typography></TableCell>
                <TableCell><Typography variant="body2" noWrap>{r.assignee || ""}</Typography></TableCell>
                <TableCell><Typography variant="body2" noWrap>{r.project || ""}</Typography></TableCell>
                <TableCell align="right"><Typography variant="body2" color="text.secondary">{r.updatedAt || ""}</Typography></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}