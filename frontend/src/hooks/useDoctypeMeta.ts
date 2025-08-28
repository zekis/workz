/**
 * useDoctypeMeta
 * - Fetches doctype metadata from Frappe including title_field
 * - Used to determine which field to use for display names
 */
import { useState, useEffect } from "react";

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
  const [meta, setMeta] = useState<DoctypeMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctype) {
      setMeta(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchMeta = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch doctype title field from our dedicated API
        const response = await fetch(`/api/method/workz.api.get_doctype_title_field?doctype=${encodeURIComponent(doctype)}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          const titleInfo = data.message;

          setMeta({
            name: titleInfo.doctype,
            title_field: titleInfo.title_field || undefined,
            fields: [] // We don't need full field list for our use case
          });
        } else {
          setError(`Failed to fetch title field for ${doctype}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeta();
  }, [doctype]);

  return {
    meta,
    isLoading,
    error
  };
}
