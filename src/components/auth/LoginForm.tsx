import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Mail, Lock, AlertCircle, Shield, Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "../ui/alert";
import { OAuthButtons } from "./OAuthButtons";
import { MFAForm } from "./MFAForm";
import { logger } from "@/lib/logger";

export const LoginForm: React.FC = () => {
  const { signIn, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect messages (e.g., after email verification)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const message = params.get("message");
    if (message) {
      setSuccessMessage(decodeURIComponent(message));
      // Clean up the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Clear any auth context errors when component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  // Set local error if auth context has an error
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    logger.info("Login attempt", { email: email.toLowerCase() });

    // Basic validation
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn(email.trim().toLowerCase(), password);

      if (!result.success) {
        setError(result.error || "Failed to sign in");
        logger.warn("Login failed", {
          email: email.toLowerCase(),
          error: result.error,
        });
        return;
      }

      if (result.data?.requiresMFA && result.data.userId) {
        logger.info("MFA required for user", { userId: result.data.userId });
        setUserId(result.data.userId);
        setShowMFA(true);
      } else {
        // Clear form fields after successful login
        setEmail("");
        setPassword("");
        logger.info("Login successful", { email: email.toLowerCase() });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMessage);
      logger.error("Sign in exception:", {
        error: err,
        email: email.toLowerCase(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
      {showMFA && userId ? (
        <MFAForm
          mode="verify"
          userId={userId}
          onSuccess={() => navigate("/")}
        />
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-6">Sign In</h2>

          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                aria-label="Email"
                className="pl-10"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                aria-label="Password"
                className="pl-10"
                autoComplete="current-password"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/auth/password-reset")}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Signing In
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <OAuthButtons className="mt-6" />

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/auth/register")}
                className="text-primary hover:underline font-medium"
                disabled={loading}
              >
                Sign Up
              </button>
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

export default LoginForm;
