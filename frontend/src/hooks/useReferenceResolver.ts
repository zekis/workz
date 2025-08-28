/**
 * useReferenceResolver
 * - Resolves reference names to display values by fetching title fields
 * - Used for displaying proper names in hamburger menu and filters
 * - Fetches doctype metadata to determine title_field, then fetches documents
 */
import { useMemo, useState, useEffect } from "react";
import type { Todo } from "./useTodos";
import { useDoctypeMeta } from "./useDoctypeMeta";

interface ResolvedReference {
  name: string;
  displayValue: string;
  referenceType: string;
}

interface CachedReference {
  displayValue: string;
  isLoading: boolean;
  error?: string;
}

export function useReferenceResolver(todos: Todo[]) {
  // Cache for resolved reference display names
  const [referenceCache, setReferenceCache] = useState<Map<string, CachedReference>>(new Map());

  // Get unique references from todos
  const uniqueReferences = useMemo(() => {
    const refs = new Map<string, { type: string; name: string }>();

    todos.forEach(todo => {
      if (todo.referenceType && todo.referenceName) {
        const key = `${todo.referenceType}:${todo.referenceName}`;
        refs.set(key, {
          type: todo.referenceType,
          name: todo.referenceName
        });
      }
    });

    return Array.from(refs.entries()).map(([key, ref]) => ({
      key,
      type: ref.type,
      name: ref.name
    }));
  }, [todos]);

  // Batch resolve references using the dedicated API
  useEffect(() => {
    if (uniqueReferences.length === 0) return;

    const unresolvedReferences = uniqueReferences.filter(({ key }) => !referenceCache.has(key));
    if (unresolvedReferences.length === 0) return;

    const resolveReferences = async () => {
      try {
        // Set loading state for all unresolved references
        setReferenceCache(prev => {
          const newCache = new Map(prev);
          unresolvedReferences.forEach(({ key, name }) => {
            newCache.set(key, {
              displayValue: name, // fallback while loading
              isLoading: true
            });
          });
          return newCache;
        });

        // Prepare references for API call
        const referencesToResolve = unresolvedReferences.map(({ type, name }) => ({
          doctype: type,
          name: name
        }));

        // Call the dedicated API
        const response = await fetch('/api/method/workz.api.resolve_references', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            references: referencesToResolve
          })
        });

        if (response.ok) {
          const data = await response.json();
          const resolved = data.message || {};

          // Update cache with resolved values
          setReferenceCache(prev => {
            const newCache = new Map(prev);
            unresolvedReferences.forEach(({ key, name }) => {
              const displayValue = resolved[key] || name;
              newCache.set(key, {
                displayValue,
                isLoading: false
              });
            });
            return newCache;
          });
        } else {
          // If API fails, use fallback values
          setReferenceCache(prev => {
            const newCache = new Map(prev);
            unresolvedReferences.forEach(({ key, name }) => {
              newCache.set(key, {
                displayValue: name,
                isLoading: false,
                error: `API call failed: ${response.status}`
              });
            });
            return newCache;
          });
        }
      } catch (error) {
        // If fetch fails, use fallback values
        setReferenceCache(prev => {
          const newCache = new Map(prev);
          unresolvedReferences.forEach(({ key, name }) => {
            newCache.set(key, {
              displayValue: name,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          });
          return newCache;
        });
      }
    };

    resolveReferences();
  }, [uniqueReferences]);



  // Resolve function that uses the cache
  const resolveReference = (referenceType: string | null, referenceName: string | null): string => {
    if (!referenceType || !referenceName) return "";

    const key = `${referenceType}:${referenceName}`;
    const cached = referenceCache.get(key);

    return cached?.displayValue || referenceName;
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
          const displayValue = resolveReference(todo.referenceType, todo.referenceName);
          resolved.push({
            name: todo.referenceName,
            displayValue,
            referenceType: todo.referenceType
          });
        }
      }
    });

    return resolved;
  }, [todos, referenceCache]);

  // Check if any references are still loading
  const isLoading = Array.from(referenceCache.values()).some(ref => ref.isLoading);

  return {
    resolveReference,
    resolvedReferences,
    isLoading
  };
}
