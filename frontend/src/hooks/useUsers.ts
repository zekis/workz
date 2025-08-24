/**
 * useUsers
 * - Fetches available users for assignment
 * - Returns list of users that can be assigned todos
 */
import { useFrappeGetDocList } from "frappe-react-sdk";

export interface User {
  name: string;
  full_name?: string;
  email: string;
  enabled: number;
}

export function useUsers() {
  const { data, error, isLoading } = useFrappeGetDocList("User", {
    fields: ["name", "full_name", "email", "enabled"],
    filters: [
      ["enabled", "=", 1], // Only enabled users
      ["name", "!=", "Guest"], // Exclude Guest user
      ["name", "!=", "Administrator"] // Exclude Administrator
    ],
    limit: 200, // Reasonable limit for user dropdown
    orderBy: {
      field: "full_name",
      order: "asc"
    }
  });

  // Transform data to consistent format
  const users: User[] = (data || []).map((user: any) => ({
    name: user.name,
    full_name: user.full_name,
    email: user.email || user.name,
    enabled: user.enabled
  }));

  return {
    users,
    isLoading,
    error
  };
}
