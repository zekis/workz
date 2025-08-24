/**
 * ToDoToolbar
 * - Top toolbar with search, filters, group-by, sorting controls and bulk actions
 * - Integrates with table state management for filtering and grouping
 */
import React from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  AutoAwesome as MagicIcon
} from "@mui/icons-material";
import { NewTodoDialog } from "./NewTodoDialog";

export interface ToDoToolbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  priorityFilter?: string;
  onPriorityFilterChange?: (priority: string) => void;
  assigneeFilter?: string;
  onAssigneeFilterChange?: (assignee: string) => void;
  groupBy?: string;
  onGroupByChange?: (groupBy: string) => void;
  sortBy?: string;
  onSortByChange?: (sortBy: string) => void;
  sortOrder?: "asc" | "desc";
  onSortOrderChange?: (order: "asc" | "desc") => void;
  hideClosedCancelled?: boolean;
  onHideClosedCancelledChange?: (hide: boolean) => void;
  quickFilter?: "" | "today" | "week";
  onQuickFilterChange?: (filter: "" | "today" | "week") => void;
  currentReference?: string | null;
  todos?: import("../../hooks/useTodos").Todo[];
  onRefresh?: () => void;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
  activeFilter?: string | null;
  onClearFilter?: () => void;
  onQuickCreate?: (subject: string) => void;
}

export function ToDoToolbar(props: ToDoToolbarProps) {
  const {
    searchQuery = "",
    onSearchChange,
    statusFilter = "",
    onStatusFilterChange,
    priorityFilter = "",
    onPriorityFilterChange,
    assigneeFilter = "",
    onAssigneeFilterChange,
    groupBy = "",
    onGroupByChange,
    sortBy = "modified",
    onSortByChange,
    sortOrder = "desc",
    onSortOrderChange,
    hideClosedCancelled = true,
    onHideClosedCancelledChange,
    quickFilter = "",
    onQuickFilterChange,
    currentReference,
    todos = [],
    onRefresh,
    onMenuToggle,
    menuOpen = false,
    activeFilter,
    onClearFilter,
    onQuickCreate
  } = props;

  const [newTodoDialog, setNewTodoDialog] = React.useState(false);
  const [filtersExpanded, setFiltersExpanded] = React.useState(false);
  const [quickCreateText, setQuickCreateText] = React.useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCreateTodo = () => {
    setNewTodoDialog(true);
  };

  const handleQuickCreate = () => {
    if (quickCreateText.trim()) {
      onQuickCreate?.(quickCreateText.trim());
      setQuickCreateText("");
    }
  };

  const handleQuickCreateKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickCreate();
    }
  };

  const clearFilters = () => {
    onSearchChange?.("");
    onStatusFilterChange?.("");
    onPriorityFilterChange?.("");
    onAssigneeFilterChange?.("");
    onGroupByChange?.("");
    onQuickFilterChange?.("");
    onHideClosedCancelledChange?.(true);
  };

  const hasActiveFilters = searchQuery || statusFilter || priorityFilter || assigneeFilter || groupBy || quickFilter || !hideClosedCancelled;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* Header Row */}
      <Box display="flex" flexDirection="row" gap={2} alignItems="center">
        <Stack direction="row" alignItems="center" spacing={1} flex={1}>
          <IconButton onClick={onMenuToggle} size="small">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div">
            Workz ToDos
          </Typography>
          {activeFilter && (
            <Chip
              label={activeFilter}
              size="small"
              onDelete={onClearFilter}
              deleteIcon={<CloseIcon />}
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flex={1}>
          {/* Quick Create Text Field - Medium/Large screens only */}
          {!isMobile && (
            <TextField
              size="small"
              placeholder="Quick create todo... ✨ AI coming soon"
              value={quickCreateText}
              onChange={(e) => setQuickCreateText(e.target.value)}
              onKeyPress={handleQuickCreateKeyPress}
              sx={{
                flex: 1,
                "& .MuiInputBase-input::placeholder": {
                  fontSize: "0.875rem"
                }
              }}
              InputProps={{
                endAdornment: quickCreateText.trim() && (
                  <IconButton
                    size="small"
                    onClick={handleQuickCreate}
                    aria-label="Create todo"
                    sx={{ mr: -1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                ),
                startAdornment: (
                  <MagicIcon
                    fontSize="small"
                    sx={{
                      mr: 1,
                      color: "text.secondary",
                      opacity: 0.6
                    }}
                  />
                )
              }}
            />
          )}

          {/* Mobile Filter Toggle */}
          {isMobile && (
            <IconButton
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              aria-label="Toggle filters"
            >
              {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}

          {/* New ToDo Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTodo}
          >
            New
          </Button>
        </Stack>
      </Box>

      {/* Filters Section - Always visible on desktop, collapsible on mobile */}
      <Collapse in={!isMobile || filtersExpanded}>
        {/* Quick Filters Row */}
        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }} mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="Today"
              variant={quickFilter === "today" ? "filled" : "outlined"}
              color={quickFilter === "today" ? "primary" : "default"}
              onClick={() => onQuickFilterChange?.(quickFilter === "today" ? "" : "today")}
              clickable
            />
            <Chip
              label="This Week"
              variant={quickFilter === "week" ? "filled" : "outlined"}
              color={quickFilter === "week" ? "primary" : "default"}
              onClick={() => onQuickFilterChange?.(quickFilter === "week" ? "" : "week")}
              clickable
            />
            <Chip
              label={hideClosedCancelled ? "Show All" : "Hide Closed"}
              variant={hideClosedCancelled ? "outlined" : "filled"}
              color={hideClosedCancelled ? "default" : "secondary"}
              onClick={() => onHideClosedCancelledChange?.(!hideClosedCancelled)}
              clickable
            />
          </Stack>
        </Box>

        {/* Search and Filters Row */}
        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" flex={1}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search todos..."
          aria-label="Search todos"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Blocked">Blocked</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        {/* Priority Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={(e) => onPriorityFilterChange?.(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </Select>
        </FormControl>

        {/* Group By */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Group By</InputLabel>
          <Select
            value={groupBy}
            label="Group By"
            onChange={(e) => onGroupByChange?.(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="assignee">Assignee</MenuItem>
          </Select>
        </FormControl>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Tooltip title="Clear all filters">
                <IconButton onClick={clearFilters} size="small">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Collapse>

      {/* New Todo Dialog */}
      <NewTodoDialog
        open={newTodoDialog}
        onClose={() => setNewTodoDialog(false)}
        onSuccess={onRefresh}
        currentReference={currentReference}
        todos={todos}
      />
    </Box>
  );
}