import React, { useState } from "react";
import { logger } from "@/lib/logger";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import { MFAForm } from "./MFAForm";

const AuthTestHarness: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("status");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setTestResult(null);
    try {
      const success = await testFn();
      setTestResult({
        success,
        message: success
          ? `${testName} test passed!`
          : `${testName} test failed.`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error in ${testName} test: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const testSessionPersistence = async () => {
    // This test just checks if there's a current session
    return !!user;
  };

  const testSignOut = async () => {
    if (!user) {
      setTestResult({
        success: false,
        message: "No user is signed in to test sign out.",
      });
      return false;
    }

    try {
      await signOut();
      return true;
    } catch (error) {
      logger.error("Sign out error:", error);
      return false;
    }
  };

  return (
    <Card className="p-6 w-full max-w-4xl mx-auto shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Auth Test Harness</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="mfa">MFA</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-semibold mb-2">Current Auth Status</h2>
            <div className="space-y-2">
              <p>
                <strong>Authenticated:</strong> {user ? "Yes" : "No"}
              </p>
              {user && (
                <>
                  <p>
                    <strong>User ID:</strong> {user.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Email Verified:</strong>{" "}
                    {user.email_confirmed_at ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Last Sign In:</strong>{" "}
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : "N/A"}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Run Tests</h2>
            <div className="flex space-x-2">
              <Button
                onClick={() =>
                  runTest("Session Persistence", testSessionPersistence)
                }
                variant="outline"
              >
                Test Session Persistence
              </Button>
              <Button
                onClick={() => runTest("Sign Out", testSignOut)}
                variant="outline"
                disabled={!user}
              >
                Test Sign Out
              </Button>
            </div>
          </div>

          {testResult && (
            <Alert
              variant={testResult.success ? "default" : "destructive"}
              className={testResult.success ? "bg-green-50" : undefined}
            >
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="login">
          <LoginForm />
        </TabsContent>

        <TabsContent value="signup">
          <SignUpForm />
        </TabsContent>

        <TabsContent value="mfa">
          {user ? (
            <MFAForm mode="setup" userId={user.id} onSuccess={() => {}} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in first to test MFA functionality.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AuthTestHarness;
