/**
 * useReferenceDocuments
 * - Fetches available documents for a given reference type
 * - Uses doctype title_field for display when available
 * - Returns list of documents that can be referenced in todos
 */
import { useMemo } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useDoctypeMeta } from "./useDoctypeMeta";

export interface ReferenceDocument {
  name: string;
  title: string;
  displayValue: string; // The value to show in UI (from title_field or name)
}

export function useReferenceDocuments(referenceType: string | null) {
  // Get doctype metadata to find title_field using our dedicated API
  const { meta, isLoading: isLoadingMeta } = useDoctypeMeta(referenceType);

  // Determine fields to fetch based on doctype metadata
  const fields = useMemo(() => {
    const baseFields = ["name"];
    if (meta?.title_field && meta.title_field !== "name") {
      baseFields.push(meta.title_field);
    }
    return baseFields;
  }, [meta]);

  // Only make API call if we have a valid reference type
  const shouldFetch = Boolean(referenceType && referenceType.trim());

  // Conditionally call the hook - only when we have a valid reference type
  const hookResult = useFrappeGetDocList(
    referenceType || "ToDo", // Fallback to a valid doctype
    {
      fields,
      limit: shouldFetch ? 100 : 0, // Set limit to 0 to prevent fetching when not needed
      orderBy: {
        field: "modified",
        order: "desc"
      }
    }
  );

  // Only use the results if we should fetch
  const { data, error, isLoading: isLoadingDocs } = shouldFetch ? hookResult : {
    data: null,
    error: null,
    isLoading: false
  };

  // Transform data to consistent format using proper title field
  const documents: ReferenceDocument[] = shouldFetch && data ?
    data.map((doc: any) => {
      // Use the doctype's title_field if available, otherwise fallback to name
      let displayValue = doc.name; // fallback

      if (meta?.title_field && doc[meta.title_field] && typeof doc[meta.title_field] === 'string' && doc[meta.title_field].trim()) {
        displayValue = doc[meta.title_field].trim();
      }

      return {
        name: doc.name,
        title: displayValue,
        displayValue: displayValue
      };
    }) : [];

  return {
    documents,
    isLoading: shouldFetch ? (isLoadingMeta || isLoadingDocs) : false,
    error: shouldFetch ? error : null,
    titleField: meta?.title_field
  };
}
