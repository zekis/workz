/**
 * ToDoToolbar
 * - Top toolbar with search, filters, group-by, sorting controls and bulk actions
 * - Integrates with table state management for filtering and grouping
 */
import React from "react";
import {
  Box,
  Button,
  ButtonGroup,
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
  useTheme,
  Menu
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  AutoAwesome as MagicIcon,
  ArrowDropDown as ArrowDropDownIcon
} from "@mui/icons-material";
import { NewTodoDialog } from "./NewTodoDialog";
import { AssigneeAvatars } from "./AssigneeAvatars";

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
  onOpenAIDialog?: () => void;
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
    onOpenAIDialog
  } = props;

  const [newTodoDialog, setNewTodoDialog] = React.useState(false);
  const [filtersExpanded, setFiltersExpanded] = React.useState(true);
  const [newMenuAnchor, setNewMenuAnchor] = React.useState<null | HTMLElement>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCreateTodo = () => {
    setNewTodoDialog(true);
    setNewMenuAnchor(null);
  };

  const handleOpenAIDialog = () => {
    onOpenAIDialog?.();
    setNewMenuAnchor(null);
  };

  const handleNewMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setNewMenuAnchor(event.currentTarget);
  };

  const handleNewMenuClose = () => {
    setNewMenuAnchor(null);
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

        <Stack direction="row" spacing={1} alignItems="center">
          {/* Filter Toggle - Available on All Views */}
          <IconButton
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            aria-label="Toggle filters"
            size="small"
          >
            <FilterIcon />
          </IconButton>

          {/* Spacer to push New button to the right */}
          <Box flex={1} />

          {/* New ToDo Dropdown Button */}
          <ButtonGroup variant="contained">
            <Button
              startIcon={<AddIcon />}
              onClick={handleCreateTodo}
            >
              New
            </Button>
            <Button
              size="small"
              onClick={handleNewMenuClick}
              aria-label="New options"
              sx={{ px: 1 }}
            >
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>

          {/* New Menu */}
          <Menu
            anchorEl={newMenuAnchor}
            open={Boolean(newMenuAnchor)}
            onClose={handleNewMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem onClick={handleCreateTodo}>
              <AddIcon sx={{ mr: 1 }} />
              Todo
            </MenuItem>
            <MenuItem onClick={handleOpenAIDialog}>
              <MagicIcon sx={{ mr: 1 }} />
              Ask AI
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* Filters Section - Collapsible on All Views */}
      <Collapse in={filtersExpanded}>
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

        {/* Assignee Avatars Row */}
        <Box mb={2}>
          <AssigneeAvatars
            todos={todos || []}
            selectedAssignee={assigneeFilter}
            onAssigneeSelect={(assignee) => onAssigneeFilterChange?.(assignee || "")}
          />
        </Box>

        {/* Status Filter Badges */}
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Status
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="All"
              variant={!statusFilter ? "filled" : "outlined"}
              color={!statusFilter ? "primary" : "default"}
              onClick={() => onStatusFilterChange?.("")}
              clickable
              size="small"
            />
            <Chip
              label="Open"
              variant={statusFilter === "Open" ? "filled" : "outlined"}
              color={statusFilter === "Open" ? "success" : "default"}
              onClick={() => onStatusFilterChange?.(statusFilter === "Open" ? "" : "Open")}
              clickable
              size="small"
            />
            <Chip
              label="In Progress"
              variant={statusFilter === "In Progress" ? "filled" : "outlined"}
              color={statusFilter === "In Progress" ? "info" : "default"}
              onClick={() => onStatusFilterChange?.(statusFilter === "In Progress" ? "" : "In Progress")}
              clickable
              size="small"
            />
            <Chip
              label="Closed"
              variant={statusFilter === "Closed" ? "filled" : "outlined"}
              color={statusFilter === "Closed" ? "secondary" : "default"}
              onClick={() => onStatusFilterChange?.(statusFilter === "Closed" ? "" : "Closed")}
              clickable
              size="small"
            />
          </Stack>
        </Box>

        {/* Priority Filter Badges */}
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Priority
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="All"
              variant={!priorityFilter ? "filled" : "outlined"}
              color={!priorityFilter ? "primary" : "default"}
              onClick={() => onPriorityFilterChange?.("")}
              clickable
              size="small"
            />
            <Chip
              label="High"
              variant={priorityFilter === "High" ? "filled" : "outlined"}
              color={priorityFilter === "High" ? "error" : "default"}
              onClick={() => onPriorityFilterChange?.(priorityFilter === "High" ? "" : "High")}
              clickable
              size="small"
            />
            <Chip
              label="Medium"
              variant={priorityFilter === "Medium" ? "filled" : "outlined"}
              color={priorityFilter === "Medium" ? "warning" : "default"}
              onClick={() => onPriorityFilterChange?.(priorityFilter === "Medium" ? "" : "Medium")}
              clickable
              size="small"
            />
            <Chip
              label="Low"
              variant={priorityFilter === "Low" ? "filled" : "outlined"}
              color={priorityFilter === "Low" ? "info" : "default"}
              onClick={() => onPriorityFilterChange?.(priorityFilter === "Low" ? "" : "Low")}
              clickable
              size="small"
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