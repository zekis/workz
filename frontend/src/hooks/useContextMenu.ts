/**
 * useContextMenu
 * - Manages context menu state (anchor element, selected item)
 * - Provides handlers for opening/closing context menu
 * - Handles right-click events on table rows and mobile cards
 */
import { useState, useCallback } from "react";
import type { Todo } from "./useTodos";

export function useContextMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const open = Boolean(anchorEl);

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLElement>, todo: Todo) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setSelectedTodo(todo);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedTodo(null);
  }, []);

  const handleLongPress = useCallback((todo: Todo, element: HTMLElement) => {
    // For mobile long-press support
    setAnchorEl(element);
    setSelectedTodo(todo);
  }, []);

  return {
    anchorEl,
    selectedTodo,
    open,
    handleContextMenu,
    handleClose,
    handleLongPress
  };
}
