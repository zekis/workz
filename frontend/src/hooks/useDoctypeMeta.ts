/**
 * useDoctypeMeta
 * - Simple stub for doctype metadata
 * - Returns null for now to avoid complex hook interactions
 * - Can be enhanced later when needed
 */
export interface DoctypeMeta {
  name: string;
  title_field?: string;
  fields: Array<{
    fieldname: string;
    fieldtype: string;
    label: string;
  }>;
}

export function useDoctypeMeta(doctype: string | null) {
  // Simple stub implementation to avoid hook complexity
  // TODO: Implement proper doctype metadata fetching when needed
  return {
    meta: null,
    isLoading: false,
    error: null
  };
}
