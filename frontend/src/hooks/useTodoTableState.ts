/**
 * useTodoTableState
 * - Manages table state: search, filters, grouping, sorting
 * - Provides filtered and grouped data for rendering
 * - Handles client-side filtering and grouping of todos
 */
import { useState, useMemo } from "react";
import type { Todo } from "./useTodos";

export interface TodoGroup {
  key: string;
  label: string;
  todos: Todo[];
}

export function useTodoTableState(todos: Todo[], projectFilter?: string | null) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [sortBy, setSortBy] = useState("modified");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hideClosedCancelled, setHideClosedCancelled] = useState(true);
  const [quickFilter, setQuickFilter] = useState<"" | "today" | "week">("");

  // Filter todos based on search and filters (excluding assignee filter for avatar display)
  const filteredTodosForAvatars = useMemo(() => {
    let filtered = [...todos];

    // Hide closed/cancelled by default
    if (hideClosedCancelled) {
      filtered = filtered.filter(todo =>
        todo.status?.toLowerCase() !== "closed" &&
        todo.status?.toLowerCase() !== "cancelled"
      );
    }

    // Quick filter for date ranges
    if (quickFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(todo => {
        if (!todo.updatedAt) return false;
        const updatedDate = new Date(todo.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        return updatedDate.getTime() === today.getTime();
      });
    } else if (quickFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(todo => {
        if (!todo.updatedAt) return false;
        const updatedDate = new Date(todo.updatedAt);
        return updatedDate >= weekAgo;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(todo =>
        todo.subject.toLowerCase().includes(query) ||
        (todo.referenceName && todo.referenceName.toLowerCase().includes(query)) ||
        (todo.referenceType && todo.referenceType.toLowerCase().includes(query)) ||
        (todo.assignee && todo.assignee.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(todo => todo.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(todo => todo.priority === priorityFilter);
    }

    // Reference filter (from reference menu)
    if (projectFilter !== undefined && projectFilter !== null) {
      if (projectFilter === "No Reference") {
        filtered = filtered.filter(todo => !todo.referenceType && !todo.referenceName);
      } else if (projectFilter.startsWith("Project:")) {
        // Project sub-filter: "Project:ProjectName"
        const projectName = projectFilter.substring(8);
        filtered = filtered.filter(todo =>
          todo.referenceType === "Project" && todo.referenceName === projectName
        );
      } else if (projectFilter.startsWith("Activity:")) {
        // Activity sub-filter: "Activity:ActivityName"
        const activityName = projectFilter.substring(9);
        filtered = filtered.filter(todo =>
          todo.referenceType === "Activity" && todo.referenceName === activityName
        );
      } else {
        // Reference type filter
        filtered = filtered.filter(todo => todo.referenceType === projectFilter);
      }
    }

    // NOTE: Intentionally excluding assignee filter here for avatar display
    return filtered;
  }, [todos, searchQuery, statusFilter, priorityFilter, hideClosedCancelled, quickFilter, projectFilter]);

  // Filter todos based on search and filters (including assignee filter)
  const filteredTodos = useMemo(() => {
    let filtered = [...filteredTodosForAvatars];

    // Assignee filter
    if (assigneeFilter) {
      filtered = filtered.filter(todo => todo.assignee === assigneeFilter);
    }

    return filtered;
  }, [filteredTodosForAvatars, assigneeFilter]);

  // Sort todos
  const sortedTodos = useMemo(() => {
    const sorted = [...filteredTodos];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "subject":
          aValue = a.subject || "";
          bValue = b.subject || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "priority":
          // Custom priority sorting: High > Medium > Low
          const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case "assignee":
          aValue = a.assignee || "";
          bValue = b.assignee || "";
          break;
        case "reference":
          aValue = a.referenceName || "";
          bValue = b.referenceName || "";
          break;
        case "created":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case "dueDate":
          aValue = new Date(a.dueDate || 0).getTime();
          bValue = new Date(b.dueDate || 0).getTime();
          break;
        case "modified":
        default:
          aValue = new Date(a.updatedAt || 0).getTime();
          bValue = new Date(b.updatedAt || 0).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredTodos, sortBy, sortOrder]);

  // Group todos
  const groupedTodos = useMemo(() => {
    if (!groupBy) {
      return [{
        key: "all",
        label: "All ToDos",
        todos: sortedTodos
      }];
    }

    const groups = new Map<string, Todo[]>();

    sortedTodos.forEach(todo => {
      let groupKey: string;
      let groupLabel: string;

      switch (groupBy) {
        case "status":
          groupKey = todo.status || "No Status";
          groupLabel = groupKey;
          break;
        case "priority":
          groupKey = todo.priority || "No Priority";
          groupLabel = groupKey;
          break;
        case "assignee":
          groupKey = todo.assignee || "Unassigned";
          groupLabel = groupKey;
          break;

        default:
          groupKey = "all";
          groupLabel = "All ToDos";
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(todo);
    });

    // Convert to array and sort groups
    const groupArray = Array.from(groups.entries()).map(([key, todos]) => ({
      key,
      label: key,
      todos
    }));

    // Sort groups by name, but put "Unassigned", "No Status", etc. at the end
    groupArray.sort((a, b) => {
      const aIsEmpty = a.key.startsWith("No ") || a.key === "Unassigned";
      const bIsEmpty = b.key.startsWith("No ") || b.key === "Unassigned";
      
      if (aIsEmpty && !bIsEmpty) return 1;
      if (!aIsEmpty && bIsEmpty) return -1;
      
      return a.label.localeCompare(b.label);
    });

    return groupArray;
  }, [sortedTodos, groupBy]);

  return {
    // State
    searchQuery,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    groupBy,
    sortBy,
    sortOrder,
    hideClosedCancelled,
    quickFilter,

    // Setters
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    setGroupBy,
    setSortBy,
    setSortOrder,
    setHideClosedCancelled,
    setQuickFilter,
    
    // Computed data
    filteredTodos,
    filteredTodosForAvatars,
    sortedTodos,
    groupedTodos,
    
    // Stats
    totalCount: todos.length,
    filteredCount: filteredTodos.length,
    hasActiveFilters: !!(searchQuery || statusFilter || priorityFilter || assigneeFilter || quickFilter || !hideClosedCancelled),

    // Helpers
    clearFilters: () => {
      setSearchQuery("");
      setStatusFilter("");
      setPriorityFilter("");
      setAssigneeFilter("");
      setGroupBy("");
      setQuickFilter("");
      setHideClosedCancelled(true);
    }
  };
}
