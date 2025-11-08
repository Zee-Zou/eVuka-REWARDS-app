import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";
import { AlertCircle, Shield, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "../ui/alert";
import { supabase } from "@/lib/supabase";

interface MFAFormProps {
  mode: "setup" | "verify";
  onSuccess?: () => void;
  userId?: string;
}

export const MFAForm: React.FC<MFAFormProps> = ({
  mode = "verify",
  onSuccess,
  userId,
}) => {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If in setup mode, generate a new TOTP secret
    if (mode === "setup") {
      generateTOTPSecret();
    }
  }, [mode]);

  const generateTOTPSecret = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-totp", {
        body: { userId: userId || user?.id },
      });

      if (error) throw new Error(error.message);

      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate TOTP secret",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-totp", {
        body: {
          userId: userId || user?.id,
          code,
          secret: mode === "setup" ? secret : undefined,
        },
      });

      if (error) throw new Error(error.message);

      if (data.valid) {
        setSuccess(true);
        // If in setup mode and verification is successful, enable MFA for the user
        if (mode === "setup") {
          // MFA setup is complete
          setTimeout(() => {
            if (onSuccess) onSuccess();
            else navigate("/");
          }, 1500);
        } else {
          // MFA verification for login is complete
          setTimeout(() => {
            if (onSuccess) onSuccess();
            else navigate("/");
          }, 1500);
        }
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-2xl font-bold">
          {mode === "setup"
            ? "Set Up Two-Factor Authentication"
            : "Two-Factor Authentication"}
        </h2>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            {mode === "setup"
              ? "Two-factor authentication has been successfully set up!"
              : "Verification successful!"}
          </AlertDescription>
        </Alert>
      )}

      {mode === "setup" && (
        <div className="mb-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Scan the QR code below with your authenticator app (like Google
            Authenticator, Authy, or Microsoft Authenticator) to set up
            two-factor authentication.
          </p>

          {qrCodeUrl ? (
            <div className="flex justify-center mb-4">
              <img
                src={qrCodeUrl}
                alt="TOTP QR Code"
                className="border p-2 rounded-md"
                width={200}
                height={200}
              />
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={32} />
            </div>
          ) : null}

          {secret && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Manual entry code:</p>
              <code className="block p-2 bg-muted rounded text-sm break-all">
                {secret}
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                If you can't scan the QR code, you can manually enter this code
                into your app.
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-1">
            Verification Code
          </label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            disabled={loading || success}
            className="text-center text-lg tracking-widest"
            autoComplete="one-time-code"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || success || code.length !== 6}
        >
          {loading ? (
            <>
              <LoadingSpinner size={16} className="mr-2" />
              Verifying
            </>
          ) : mode === "setup" ? (
            "Verify and Enable"
          ) : (
            "Verify"
          )}
        </Button>
      </form>

      {mode === "verify" && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            className="text-sm text-primary hover:underline"
            disabled={loading}
          >
            Back to Login
          </button>
        </div>
      )}
    </Card>
  );
};

export default MFAForm;