import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";
import {
  Mail,
  Lock,
  AlertCircle,
  User,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "../ui/alert";
import { OAuthButtons } from "./OAuthButtons";
import { checkPasswordStrength } from "@/lib/security-enhanced";
import { Progress } from "../ui/progress";
import { logger } from "@/lib/logger";

export const SignUpForm: React.FC = () => {
  const { signUp, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    meetsMinimumRequirements: false,
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Rate limiting for failed attempts
  useEffect(() => {
    if (attemptCount >= 5) {
      const timer = setTimeout(() => setAttemptCount(0), 60000); // Reset after 1 minute
      return () => clearTimeout(timer);
    }
  }, [attemptCount]);

  // Check for redirect messages
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

  // Check password strength whenever password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({
        score: 0,
        feedback: "",
        meetsMinimumRequirements: false,
      });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    logger.info("Sign up attempt", { email: email.toLowerCase() });

    // Check for rate limiting
    if (attemptCount >= 5) {
      const errorMsg = "Too many attempts. Please try again later.";
      setError(errorMsg);
      logger.warn("Sign up rate limited", { email: email.toLowerCase() });
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      const errorMsg = "Please enter a valid email address";
      setError(errorMsg);
      logger.warn("Sign up validation error", {
        email: email.toLowerCase(),
        error: errorMsg,
      });
      setLoading(false);
      setAttemptCount((prev) => prev + 1);
      return;
    }

    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      setError(errorMsg);
      logger.warn("Sign up validation error", {
        email: email.toLowerCase(),
        error: errorMsg,
      });
      setLoading(false);
      setAttemptCount((prev) => prev + 1);
      return;
    }

    // Enhanced password validation
    if (!passwordStrength.meetsMinimumRequirements) {
      const errorMsg = `Password does not meet security requirements. ${passwordStrength.feedback}`;
      setError(errorMsg);
      logger.warn("Sign up validation error", {
        email: email.toLowerCase(),
        error: "Password does not meet security requirements",
        passwordScore: passwordStrength.score,
      });
      setLoading(false);
      setAttemptCount((prev) => prev + 1);
      return;
    }

    try {
      const result = await signUp(email.trim().toLowerCase(), password);

      if (!result.success) {
        setError(result.error || "Failed to sign up");
        logger.warn("Sign up failed", {
          email: email.toLowerCase(),
          error: result.error,
        });
        setAttemptCount((prev) => prev + 1);
        return;
      }

      // Clear form fields after successful signup
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      logger.info("Sign up successful", { email: email.toLowerCase() });
      navigate("/auth/verify-email");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign up";
      setError(errorMessage);
      logger.error("Sign up exception:", {
        error: err,
        email: email.toLowerCase(),
      });
      setAttemptCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Get color for password strength indicator
  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return "bg-red-500";
      case 1:
        return "bg-orange-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-lime-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  // Get label for password strength
  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  return (
    <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
      <h2 className="text-2xl font-bold mb-6">Create Account</h2>

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
            type={passwordVisible ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            aria-label="Password"
            className="pl-10 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-3 text-muted-foreground"
            onClick={() => setPasswordVisible(!passwordVisible)}
            tabIndex={-1}
          >
            {passwordVisible ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </button>
        </div>

        {password && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">
                {getStrengthLabel(passwordStrength.score)}
              </span>
              <span className="text-xs text-muted-foreground">
                {passwordStrength.meetsMinimumRequirements
                  ? "Meets requirements"
                  : "Does not meet requirements"}
              </span>
            </div>
            <Progress
              value={(passwordStrength.score / 4) * 100}
              className={getStrengthColor(passwordStrength.score)}
            />
            {passwordStrength.feedback && (
              <p className="text-xs text-muted-foreground mt-1">
                {passwordStrength.feedback}
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type={passwordVisible ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            aria-label="Confirm Password"
            className="pl-10"
            autoComplete="new-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            loading ||
            !passwordStrength.meetsMinimumRequirements ||
            attemptCount >= 5
          }
        >
          {loading ? (
            <>
              <LoadingSpinner size={16} className="mr-2" />
              Creating Account
            </>
          ) : attemptCount >= 5 ? (
            "Too many attempts. Please wait..."
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <OAuthButtons className="mt-6" />

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            className="text-primary hover:underline font-medium"
            disabled={loading}
          >
            Sign In
          </button>
        </p>
      </div>
    </Card>
  );
};

export default SignUpForm;
