import React, { Suspense, useEffect, lazy } from "react";
import { Routes, Route, useRoutes, Navigate } from "react-router-dom";
import Home from "./components/home";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import AuthCallbackPage from "./pages/auth/callback";
import PasswordResetPage from "./pages/auth/password-reset";
import VerifyEmailPage from "./pages/auth/verify-email";
import routes from "tempo-routes";
import { AuthProvider } from "./providers/AuthProvider";
import { AuthGuard } from "./components/auth/AuthGuard";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingOverlay } from "./components/ui/loading-spinner";
import PWAInstallPrompt from "./components/ui/pwa-install-prompt";
import UpdateNotification from "./components/ui/update-notification";
import OfflineIndicator from "./components/ui/offline-indicator";
import { logger } from "./lib/logger";
import UserProfileForm from "./components/auth/UserProfileForm";

// Lazy load non-critical routes for better performance
const OfflinePage = lazy(() => import("./pages/OfflinePage"));
const AuthTestPage = lazy(() => import("./pages/auth/test"));

function App() {
  // Log application startup for debugging purposes
  useEffect(() => {
    logger.info("Application initialized", {
      env: import.meta.env.MODE,
      isTempo: import.meta.env.VITE_TEMPO === "true",
    });
  }, []);

  // Handle URL parameters for PWA shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Handle scan shortcut
    if (params.get("scan") === "true") {
      logger.info("App launched from scan shortcut");
      // You would navigate to the scan tab or open the camera here
      // For example: navigate('/scan');
    }

    // Handle rewards shortcut
    if (params.get("tab") === "rewards") {
      logger.info("App launched from rewards shortcut");
      // You would navigate to the rewards tab here
      // For example: navigate('/rewards');
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<LoadingOverlay />}>
          <>
            {/* For the tempo routes */}
            {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

            <Routes>
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <Home />
                  </AuthGuard>
                }
              />

              {/* Auth routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route
                path="/auth/password-reset"
                element={<PasswordResetPage />}
              />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              {/* Auth Test Route */}
              <Route
                path="/auth/test"
                element={
                  <AuthGuard>
                    <Suspense fallback={<LoadingOverlay />}>
                      <AuthTestPage />
                    </Suspense>
                  </AuthGuard>
                }
              />

              {/* User Profile Route */}
              <Route
                path="/profile"
                element={
                  <AuthGuard>
                    <div className="container mx-auto py-8">
                      <UserProfileForm className="max-w-md mx-auto" />
                    </div>
                  </AuthGuard>
                }
              />

              {/* Offline support */}
              <Route
                path="/offline.html"
                element={
                  <Suspense fallback={<LoadingOverlay />}>
                    <OfflinePage />
                  </Suspense>
                }
              />

              {/* Tempo routes */}
              {import.meta.env.VITE_TEMPO === "true" && (
                <Route path="/tempobook/*" />
              )}

              {/* Catch-all route - redirect to home or login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* PWA Components */}
            <PWAInstallPrompt position="bottom" showDelay={3000} />
            <UpdateNotification position="top" />
            <OfflineIndicator />

            <Toaster />
          </>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
