import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";

const AuthCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data?.session) {
          // Redirect to home page or dashboard
          navigate("/");
        } else {
          // If no session, redirect to login
          navigate("/auth/login");
        }
      } catch (err) {
        setError("Authentication failed. Please try again.");
        // Redirect to login after a short delay
        setTimeout(() => navigate("/auth/login"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <AnimatedGradientBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">eVuka Rewards</h1>
          <p className="text-muted-foreground mt-2">
            Completing authentication...
          </p>
        </div>
        <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
          <div className="flex flex-col items-center justify-center py-8">
            {error ? (
              <div className="text-center text-red-500">
                <p>{error}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redirecting to login...
                </p>
              </div>
            ) : (
              <>
                <LoadingSpinner size={32} className="text-primary mb-4" />
                <h2 className="text-xl font-semibold">
                  Completing authentication...
                </h2>
                <p className="text-muted-foreground mt-2">
                  Please wait while we verify your credentials.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </AnimatedGradientBackground>
  );
};

export default AuthCallbackPage;