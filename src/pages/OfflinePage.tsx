import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";

const OfflinePage: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState<boolean>(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.href = "/";
  };

  return (
    <AnimatedGradientBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">eVuka Rewards</h1>
          <p className="text-muted-foreground mt-2">
            {isOnline ? "You're back online!" : "You're currently offline"}
          </p>
        </div>
        <Card className="p-6 w-full max-w-md mx-auto shadow-lg border-t-4 border-primary">
          <div className="flex flex-col items-center justify-center py-8">
            {isOnline ? (
              <Wifi size={48} className="text-green-500 mb-4" />
            ) : (
              <WifiOff size={48} className="text-amber-500 mb-4" />
            )}
            <h2 className="text-xl font-semibold">
              {isOnline ? "Connected" : "No Internet Connection"}
            </h2>
            <p className="text-muted-foreground mt-2 text-center mb-6">
              {isOnline
                ? "You're back online. You can now continue using all features."
                : "Some features may be limited while you're offline. Your data will be synced when you reconnect."}
            </p>
            <Button onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw size={16} />
              {isOnline ? "Go to Home" : "Try Again"}
            </Button>
          </div>
        </Card>
      </div>
    </AnimatedGradientBackground>
  );
};

export default OfflinePage;
