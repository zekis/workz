/**
 * useSubtasks
 * - Manages subtasks for a parent todo
 * - Subtasks are todos that reference the parent todo
 * - Only visible within the parent todo drawer
 */
import { useFrappeGetDocList, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeDeleteDoc } from "frappe-react-sdk";
import type { Todo } from "./useTodos";

export interface Subtask {
  name: string;
  description: string;
  status: string;
  priority: string;
  allocated_to?: string;
  date?: string;
  reference_type: string;
  reference_name: string;
  creation: string;
  modified: string;
  owner: string;
}

export function useSubtasks(parentTodoId: string | null) {
  // Only fetch subtasks if we have a parent todo ID
  const shouldFetch = Boolean(parentTodoId);

  const { data, error, isLoading: isLoadingSubtasks, mutate } = useFrappeGetDocList("ToDo", {
    fields: [
      "name",
      "description",
      "status",
      "priority",
      "allocated_to",
      "date",
      "reference_type",
      "reference_name",
      "creation",
      "modified",
      "owner"
    ],
    filters: shouldFetch ? [
      ["reference_type", "=", "ToDo"],
      ["reference_name", "=", parentTodoId]
    ] : [],
    orderBy: {
      field: "creation",
      order: "asc"
    },
    limit: 100 // Reasonable limit for subtasks
  });

  const { createDoc: createSubtask, loading: creating } = useFrappeCreateDoc();
  const { updateDoc: updateSubtask, loading: updating } = useFrappeUpdateDoc();
  const { deleteDoc: deleteSubtask, loading: deleting } = useFrappeDeleteDoc();

  // Transform data to subtasks
  const subtasks: Subtask[] = shouldFetch && data ? data.map((item: any) => ({
    name: item.name,
    description: item.description,
    status: item.status,
    priority: item.priority,
    allocated_to: item.allocated_to,
    date: item.date,
    reference_type: item.reference_type,
    reference_name: item.reference_name,
    creation: item.creation,
    modified: item.modified,
    owner: item.owner
  })) : [];

  const createNewSubtask = async (subtaskData: {
    description: string;
    priority?: string;
    allocated_to?: string;
    date?: string;
  }) => {
    if (!parentTodoId) {
      throw new Error("Cannot create subtask without parent todo ID");
    }

    try {
      const newSubtask = await createSubtask("ToDo", {
        description: subtaskData.description,
        status: "Open",
        priority: subtaskData.priority || "Medium",
        allocated_to: subtaskData.allocated_to,
        date: subtaskData.date,
        reference_type: "ToDo",
        reference_name: parentTodoId
      });

      // Refresh the subtasks list
      mutate();
      return newSubtask;
    } catch (error) {
      console.error("Failed to create subtask:", error);
      throw error;
    }
  };

  const updateSubtaskStatus = async (subtaskId: string, status: string) => {
    try {
      await updateSubtask("ToDo", subtaskId, { status });
      // Refresh the subtasks list
      mutate();
    } catch (error) {
      console.error("Failed to update subtask status:", error);
      throw error;
    }
  };

  const updateSubtaskData = async (subtaskId: string, updates: Partial<Subtask>) => {
    try {
      await updateSubtask("ToDo", subtaskId, updates);
      // Refresh the subtasks list
      mutate();
    } catch (error) {
      console.error("Failed to update subtask:", error);
      throw error;
    }
  };

  const removeSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask("ToDo", subtaskId);
      // Refresh the subtasks list
      mutate();
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      throw error;
    }
  };

  const toggleSubtaskComplete = async (subtask: Subtask) => {
    const newStatus = subtask.status === "Closed" ? "Open" : "Closed";
    await updateSubtaskStatus(subtask.name, newStatus);
  };

  // Calculate completion stats
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(st => st.status === "Closed").length;
  const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const isLoading = shouldFetch ? isLoadingSubtasks : false;
  const isWorking = creating || updating || deleting;

  return {
    // Data
    subtasks,
    totalSubtasks,
    completedSubtasks,
    completionPercentage,
    
    // State
    isLoading,
    isWorking,
    error,
    
    // Actions
    createNewSubtask,
    updateSubtaskStatus,
    updateSubtaskData,
    removeSubtask,
    toggleSubtaskComplete,
    refresh: mutate
  };
}
