import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { logger } from "../lib/logger";
import {
  secureStore,
  applyRateLimitToAuth,
  sanitizeUrl,
} from "../lib/security-enhanced";
import {
  AuthContext,
  AuthContextType,
  AuthResult,
  formatAuthError,
} from "../lib/auth";
import { UserProfile } from "../lib/database.types";

// Session validation constants
const SESSION_FINGERPRINT_KEY = "auth_fingerprint";
const SESSION_LAST_VALIDATED_KEY = "auth_last_validated";
const SESSION_VALIDATION_INTERVAL = 15 * 60 * 1000; // 15 minutes

// Define AuthProvider as a named function component (not an arrow function)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Generate a fingerprint for the current browser environment
  const generateFingerprint = useCallback(() => {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const colorDepth = window.screen.colorDepth;

    return `${userAgent}|${language}|${screenWidth}x${screenHeight}|${timeZone}|${colorDepth}`;
  }, []);

  // Clear session storage and redirect to login
  const clearSessionAndRedirect = useCallback(async () => {
    await secureStore.removeItem(SESSION_FINGERPRINT_KEY);
    await secureStore.removeItem(SESSION_LAST_VALIDATED_KEY);
    navigate("/auth/login");
  }, [navigate]);

  // Sign out function defined early to avoid circular dependencies
  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        logger.error("Sign out error:", signOutError);
        setError(formatAuthError(signOutError));
        return {
          data: null,
          error: formatAuthError(signOutError),
          success: false,
        };
      }

      await clearSessionAndRedirect();
      logger.info("User signed out successfully");
      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Sign out exception:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  }, [clearSessionAndRedirect]);

  // Validate the current session against stored fingerprint
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      // Get stored fingerprint
      const storedFingerprint = await secureStore.getItem(
        SESSION_FINGERPRINT_KEY,
      );
      const currentFingerprint = generateFingerprint();

      // If no stored fingerprint or fingerprints don't match, session might be hijacked
      if (!storedFingerprint || storedFingerprint !== currentFingerprint) {
        logger.warn("Session validation failed: fingerprint mismatch");
        await clearSessionAndRedirect();
        return false;
      }

      // Update last validated timestamp
      await secureStore.setItem(
        SESSION_LAST_VALIDATED_KEY,
        Date.now().toString(),
      );
      return true;
    } catch (error) {
      logger.error("Session validation error:", error);
      return false;
    }
  }, [session, generateFingerprint, clearSessionAndRedirect]);

  // Refresh the session with Supabase
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        logger.error("Session refresh error:", error);
        await clearSessionAndRedirect();
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);

        // Validate the refreshed session
        await validateSession();
      }
    } catch (error) {
      logger.error("Session refresh exception:", error);
      await clearSessionAndRedirect();
    }
  }, [validateSession, clearSessionAndRedirect]);

  // Periodically validate the session
  useEffect(() => {
    if (!session) return;

    const checkSession = async () => {
      const lastValidatedStr = await secureStore.getItem(
        SESSION_LAST_VALIDATED_KEY,
      );
      const lastValidated = lastValidatedStr
        ? parseInt(lastValidatedStr, 10)
        : 0;
      const now = Date.now();

      if (now - lastValidated > SESSION_VALIDATION_INTERVAL) {
        await validateSession();
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session, validateSession]);

  // Fetch user profile data from Supabase
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        logger.error("Error fetching user profile:", error);
        return null;
      }

      if (data) {
        setUserProfile(data as UserProfile);
        return data as UserProfile;
      }
      return null;
    } catch (err) {
      logger.error("Exception fetching user profile:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session) {
        // Store fingerprint for session validation
        await secureStore.setItem(
          SESSION_FINGERPRINT_KEY,
          generateFingerprint(),
        );
        await secureStore.setItem(
          SESSION_LAST_VALIDATED_KEY,
          Date.now().toString(),
        );

        // Fetch user profile data
        await fetchUserProfile(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session) {
        // Store fingerprint for session validation
        await secureStore.setItem(
          SESSION_FINGERPRINT_KEY,
          generateFingerprint(),
        );
        await secureStore.setItem(
          SESSION_LAST_VALIDATED_KEY,
          Date.now().toString(),
        );

        // Fetch user profile data
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [generateFingerprint, fetchUserProfile]);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthResult<{ requiresMFA?: boolean; userId?: string }>> => {
    return applyRateLimitToAuth("signIn", async () => {
      try {
        setError(null);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          logger.error("Sign in error:", error);
          setError(formatAuthError(error));
          return { data: null, error: formatAuthError(error), success: false };
        }

        // Check if MFA is required (implement actual MFA check here)
        // For now, we'll check if the user has MFA enabled
        const userId = data.user?.id;
        let requiresMFA = false;

        if (userId) {
          const mfaResult = await checkMFAEnabled(userId);
          requiresMFA = mfaResult.data || false;
        }

        if (!requiresMFA) {
          // Store fingerprint for session validation
          await secureStore.setItem(
            SESSION_FINGERPRINT_KEY,
            generateFingerprint(),
          );
          await secureStore.setItem(
            SESSION_LAST_VALIDATED_KEY,
            Date.now().toString(),
          );

          // Use sanitizeUrl to prevent open redirect vulnerabilities
          const redirectUrl = sanitizeUrl(
            window.location.pathname === "/auth/login"
              ? "/"
              : window.location.pathname,
          );
          navigate(redirectUrl);
        }

        logger.info("Sign in successful", { email, requiresMFA });
        return {
          data: { requiresMFA, userId },
          error: null,
          success: true,
        };
      } catch (error) {
        const errorMessage = formatAuthError(error);
        logger.error("Sign in exception:", error);
        setError(errorMessage);
        return { data: null, error: errorMessage, success: false };
      }
    });
  };

  const signUp = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    return applyRateLimitToAuth("signUp", async () => {
      try {
        setError(null);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          logger.error("Sign up error:", error);
          setError(formatAuthError(error));
          return { data: null, error: formatAuthError(error), success: false };
        }

        logger.info("Sign up successful", { email, userId: data.user?.id });
        return { data: null, error: null, success: true };
      } catch (error) {
        const errorMessage = formatAuthError(error);
        logger.error("Sign up exception:", error);
        setError(errorMessage);
        return { data: null, error: errorMessage, success: false };
      }
    });
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    return applyRateLimitToAuth("resetPassword", async () => {
      try {
        setError(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/password-reset`,
        });

        if (error) {
          logger.error("Reset password error:", error);
          setError(formatAuthError(error));
          return { data: null, error: formatAuthError(error), success: false };
        }

        logger.info("Password reset email sent", { email });
        return { data: null, error: null, success: true };
      } catch (error) {
        const errorMessage = formatAuthError(error);
        logger.error("Reset password exception:", error);
        setError(errorMessage);
        return { data: null, error: errorMessage, success: false };
      }
    });
  };

  const verifyEmail = async (token: string): Promise<AuthResult> => {
    try {
      setError(null);
      // This is a placeholder - in a real implementation, you would verify the token
      logger.info("Email verification token received:", token);
      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Email verification error:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  const resendVerificationEmail = async (
    email?: string,
  ): Promise<AuthResult> => {
    try {
      setError(null);
      // This would be implemented with Supabase's resend verification email functionality
      logger.info("Resending verification email", {
        email: email || user?.email,
      });
      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Resend verification email error:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        logger.error("Google sign in error:", error);
        setError(formatAuthError(error));
        return { data: null, error: formatAuthError(error), success: false };
      }
      logger.info("Google sign in initiated");
      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Google sign in exception:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  const signInWithApple = async (): Promise<AuthResult> => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        logger.error("Apple sign in error:", error);
        setError(formatAuthError(error));
        return { data: null, error: formatAuthError(error), success: false };
      }
      logger.info("Apple sign in initiated");
      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Apple sign in exception:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  // Setup MFA for a user
  const setupMFA = async (
    userId: string,
  ): Promise<AuthResult<{ secret: string; qrCodeUrl: string }>> => {
    try {
      setError(null);
      // This would be implemented with a Supabase Edge Function
      logger.info("Setting up MFA", { userId });
      return {
        data: {
          secret: "placeholder_secret",
          qrCodeUrl: "placeholder_qr_code_url",
        },
        error: null,
        success: true,
      };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Error setting up MFA:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  // Verify MFA code
  const verifyMFA = async (
    userId: string,
    code: string,
  ): Promise<AuthResult<boolean>> => {
    try {
      setError(null);
      // This would be implemented with a Supabase Edge Function
      logger.info("Verifying MFA code", { userId });
      return { data: true, error: null, success: true }; // Placeholder
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Error verifying MFA code:", error);
      setError(errorMessage);
      return { data: false, error: errorMessage, success: false };
    }
  };

  // Check if MFA is enabled for a user
  const checkMFAEnabled = async (
    userId: string,
  ): Promise<AuthResult<boolean>> => {
    try {
      setError(null);
      // This would be implemented with a Supabase query
      logger.info("Checking MFA status", { userId });
      return { data: false, error: null, success: true }; // Placeholder
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Error checking MFA status:", error);
      setError(errorMessage);
      return { data: false, error: errorMessage, success: false };
    }
  };

  // Add method to update password
  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error("Update password error:", error);
        setError(formatAuthError(error));
        return { data: null, error: formatAuthError(error), success: false };
      }

      logger.info("Password updated successfully");
      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Update password exception:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  // Add method to sign in with Microsoft
  const signInWithMicrosoft = async (): Promise<AuthResult> => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        logger.error("Microsoft sign in error:", error);
        setError(formatAuthError(error));
        return { data: null, error: formatAuthError(error), success: false };
      }
      logger.info("Microsoft sign in initiated");
      return { data: null, error: null, success: true };
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Microsoft sign in exception:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  // Add method to disable MFA
  const disableMFA = async (userId: string): Promise<AuthResult> => {
    try {
      setError(null);
      // This would be implemented with a Supabase Edge Function
      logger.info("Disabling MFA", { userId });
      return { data: null, error: null, success: true }; // Placeholder
    } catch (error) {
      const errorMessage = formatAuthError(error);
      logger.error("Error disabling MFA:", error);
      setError(errorMessage);
      return { data: null, error: errorMessage, success: false };
    }
  };

  // Add method to clear error
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    verifyEmail,
    resendVerificationEmail,
    signInWithGoogle,
    signInWithApple,
    signInWithMicrosoft,
    setupMFA,
    verifyMFA,
    checkMFAEnabled,
    disableMFA,
    clearError,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export the hook as a named function
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
