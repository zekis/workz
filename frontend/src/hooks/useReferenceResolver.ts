/**
 * useReferenceResolver
 * - Simple resolver that just returns the reference name as display value
 * - Can be enhanced later with proper title field resolution
 * - Used for displaying names in hamburger menu and filters
 */
import { useMemo } from "react";
import type { Todo } from "./useTodos";

interface ResolvedReference {
  name: string;
  displayValue: string;
  referenceType: string;
}

export function useReferenceResolver(todos: Todo[]) {
  // Simple resolve function that just returns the reference name
  // TODO: Enhance with proper title field resolution when needed
  const resolveReference = (referenceType: string | null, referenceName: string | null): string => {
    return referenceName || "";
  };

  // Get resolved references for todos
  const resolvedReferences = useMemo(() => {
    const resolved: ResolvedReference[] = [];
    const seen = new Set<string>();

    todos.forEach(todo => {
      if (todo.referenceType && todo.referenceName) {
        const key = `${todo.referenceType}:${todo.referenceName}`;
        if (!seen.has(key)) {
          seen.add(key);
          resolved.push({
            name: todo.referenceName,
            displayValue: todo.referenceName, // Simple fallback for now
            referenceType: todo.referenceType
          });
        }
      }
    });

    return resolved;
  }, [todos]);

  return {
    resolveReference,
    resolvedReferences,
    isLoading: false // No loading since we're not fetching
  };
}
