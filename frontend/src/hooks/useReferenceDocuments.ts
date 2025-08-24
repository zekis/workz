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

  const { data, error, isLoading } = useFrappeGetDocList(
    referenceType || "", // Use empty string when no type
    {
      fields,
      limit: 100, // Reasonable limit for dropdown
      orderBy: {
        field: "modified",
        order: "desc"
      }
    }
  );

  // Transform data to consistent format
  const documents: ReferenceDocument[] = referenceType && data ?
    data.map((doc: any) => ({
      name: doc.name,
      title: doc.name, // Just use the name as title for now
      subject: undefined,
      project_name: undefined
    })) : [];

  return {
    documents,
    isLoading: referenceType ? isLoading : false,
    error: referenceType ? error : null
  };
}
