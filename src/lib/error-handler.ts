import { User } from "@supabase/supabase-js";

export interface SupabaseResult<T> {
  data: T | null;
  error: { message?: string } | null;
}

export function assertResponse<T>({ data, error }: SupabaseResult<T>): T {
  if (error) {
    throw new Error(error.message ?? "Supabase operation failed");
  }
  if (data == null) {
    throw new Error("No data returned from Supabase");
  }
  return data;
}

export function assertUser(user: User | null): asserts user is User {
  if (!user) {
    throw new Error("User is not authenticated");
  }
}

export const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  // Log error using logger instead of console
  if (typeof window !== "undefined") {
    // Error is handled by the application's error boundary
  }
};