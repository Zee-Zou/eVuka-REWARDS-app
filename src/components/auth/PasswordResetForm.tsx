import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "../ui/alert";

export const PasswordResetForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
      <h2 className="text-2xl font-bold mb-6">Reset Password</h2>

      {success ? (
        <div className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">
              Password reset instructions have been sent to your email address.
              Please check your inbox and follow the link to reset your
              password.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/auth/login")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground mb-4">
            Enter your email address and we'll send you instructions to reset
            your password.
          </p>

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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size={16} className="mr-2" />
                Sending Reset Instructions...
              </>
            ) : (
              "Send Reset Instructions"
            )}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              Back to Login
            </button>
          </div>
        </form>
      )}
    </Card>
  );
};
