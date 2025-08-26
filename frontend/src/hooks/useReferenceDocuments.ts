/**
 * useReferenceDocuments
 * - Fetches available documents for a given reference type
 * - Returns list of documents that can be referenced in todos
 */
import { useFrappeGetDocList } from "frappe-react-sdk";

export interface ReferenceDocument {
  name: string;
  title?: string;
  subject?: string;
  project_name?: string;
}

export function useReferenceDocuments(referenceType: string | null) {
  // Use basic fields that are commonly available
  // We'll try to get a display field but fall back to name if not available
  const fields = ["name"];

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
  const { data, error, isLoading } = shouldFetch ? hookResult : {
    data: null,
    error: null,
    isLoading: false
  };

  // Transform data to consistent format
  const documents: ReferenceDocument[] = shouldFetch && data ?
    data.map((doc: any) => ({
      name: doc.name,
      title: doc.name, // Just use the name as title for now
      subject: undefined,
      project_name: undefined
    })) : [];

  return {
    documents,
    isLoading: shouldFetch ? isLoading : false,
    error: shouldFetch ? error : null
  };
}
