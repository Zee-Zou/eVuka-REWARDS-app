import { createContext, useContext } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { UserProfile } from "./database.types";

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthResult<T = void> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface AuthContextType extends AuthState {
  userProfile: UserProfile | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<AuthResult<{ requiresMFA?: boolean; userId?: string }>>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  verifyEmail: (token: string) => Promise<AuthResult>;
  resendVerificationEmail: (email?: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signInWithMicrosoft: () => Promise<AuthResult>;
  setupMFA: (
    userId: string,
  ) => Promise<AuthResult<{ secret: string; qrCodeUrl: string }>>;
  verifyMFA: (userId: string, code: string) => Promise<AuthResult<boolean>>;
  checkMFAEnabled: (userId: string) => Promise<AuthResult<boolean>>;
  disableMFA: (userId: string) => Promise<AuthResult>;
  clearError: () => void;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
}

// Helper function to format auth errors consistently
export const formatAuthError = (error: unknown): string => {
  if (error instanceof AuthError) {
    // Handle Supabase auth errors
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else {
    return "An unknown authentication error occurred";
  }
};

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
