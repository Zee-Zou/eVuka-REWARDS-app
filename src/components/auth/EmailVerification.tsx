import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";
import { CheckCircle, XCircle, RefreshCw, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "../ui/alert";

export const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [verifying, setVerifying] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { verifyEmail, resendVerificationEmail, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          await verifyEmail(token);
          setVerified(true);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to verify email",
          );
        } finally {
          setVerifying(false);
        }
      } else {
        setVerifying(false);
      }
    };

    verify();
  }, [token, verifyEmail]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      await resendVerificationEmail();
      setResendSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend verification email",
      );
    } finally {
      setResendLoading(false);
    }
  };

  if (verifying) {
    return (
      <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner size={32} className="text-primary mb-4" />
          <h2 className="text-xl font-semibold">Verifying your email...</h2>
          <p className="text-muted-foreground mt-2">
            Please wait while we verify your email address.
          </p>
        </div>
      </Card>
    );
  }

  if (verified) {
    return (
      <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-green-500">
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold">Email Verified!</h2>
          <p className="text-center text-muted-foreground mt-2 mb-6">
            Your email has been successfully verified. You can now access all
            features of eVuka Rewards.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Continue to App
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
      <div className="flex flex-col py-4">
        <div className="flex items-center justify-center mb-6">
          <Mail className="h-12 w-12 text-primary p-2 bg-primary/10 rounded-full" />
        </div>

        <h2 className="text-2xl font-bold text-center">Verify Your Email</h2>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert className="bg-green-50 border-green-200 mt-4">
            <AlertDescription className="text-green-700">
              Verification email sent! Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-center text-muted-foreground mt-4 mb-6">
          {token
            ? "We couldn't verify your email with the provided link. The link may have expired or is invalid."
            : "We've sent a verification email to your inbox. Please check your email and click the verification link."}
        </p>

        <Button
          onClick={handleResendVerification}
          disabled={resendLoading}
          className="mb-4"
        >
          {resendLoading ? (
            <>
              <LoadingSpinner size={16} className="mr-2" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Verification Email
            </>
          )}
        </Button>

        <Button variant="outline" onClick={() => navigate("/auth/login")}>
          Back to Login
        </Button>
      </div>
    </Card>
  );
};
