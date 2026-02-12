import React, { Suspense, useEffect, lazy } from "react";
import { Routes, Route, useRoutes, Navigate } from "react-router-dom";
import routes from "tempo-routes";
import { AuthProvider } from "./providers/AuthProvider";
import { AuthGuard } from "./components/auth/AuthGuard";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingFallback } from "./components/LoadingFallback";
import { ErrorFallback } from "./components/ErrorFallback";
import PWAInstallPrompt from "./components/ui/pwa-install-prompt";
import UpdateNotification from "./components/ui/update-notification";
import OfflineIndicator from "./components/ui/offline-indicator";
import { logger } from "./lib/logger";

// Lazy load ALL routes for optimal bundle splitting and faster initial load
// Critical routes load first when needed
const Home = lazy(() => import("./components/home"));
const LoginPage = lazy(() => import("./pages/auth/login"));
const RegisterPage = lazy(() => import("./pages/auth/register"));
const AuthCallbackPage = lazy(() => import("./pages/auth/callback"));
const PasswordResetPage = lazy(() => import("./pages/auth/password-reset"));
const VerifyEmailPage = lazy(() => import("./pages/auth/verify-email"));
const UserProfileForm = lazy(() => import("./components/auth/UserProfileForm"));

// Non-critical routes
const OfflinePage = lazy(() => import("./pages/OfflinePage"));
const AuthTestPage = lazy(() => import("./pages/auth/test"));
const ShareReceiptHandler = lazy(() => import("./pages/ShareReceiptHandler"));

function App() {
  useEffect(() => {
    logger.info("Application initialized", {
      env: import.meta.env.MODE,
      isTempo: import.meta.env.VITE_TEMPO === "true",
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("scan") === "true") {
      logger.info("App launched from scan shortcut");
    }

    if (params.get("tab") === "rewards") {
      logger.info("App launched from rewards shortcut");
    }
  }, []);

  return (
    <ErrorBoundary level="page">
      <AuthProvider>
        <Suspense fallback={<LoadingFallback fullScreen message="Loading application..." />}>
          <>
            {/* For the tempo routes */}
            {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

            <Routes>
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ErrorBoundary level="page">
                    <AuthGuard>
                      <Suspense fallback={<LoadingFallback fullScreen />}>
                        <Home />
                      </Suspense>
                    </AuthGuard>
                  </ErrorBoundary>
                }
              />

              {/* Auth routes */}
              <Route 
                path="/auth/login" 
                element={
                  <ErrorBoundary level="section">
                    <LoginPage />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/auth/register" 
                element={
                  <ErrorBoundary level="section">
                    <RegisterPage />
                  </ErrorBoundary>
                } 
              />
              <Route
                path="/auth/password-reset"
                element={
                  <ErrorBoundary level="section">
                    <PasswordResetPage />
                  </ErrorBoundary>
                }
              />
              <Route 
                path="/auth/verify-email" 
                element={
                  <ErrorBoundary level="section">
                    <VerifyEmailPage />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/auth/callback" 
                element={
                  <ErrorBoundary level="section">
                    <AuthCallbackPage />
                  </ErrorBoundary>
                } 
              />

              {/* Auth Test Route */}
              <Route
                path="/auth/test"
                element={
                  <ErrorBoundary level="page">
                    <AuthGuard>
                      <Suspense fallback={<LoadingFallback fullScreen />}>
                        <AuthTestPage />
                      </Suspense>
                    </AuthGuard>
                  </ErrorBoundary>
                }
              />

              {/* User Profile Route */}
              <Route
                path="/profile"
                element={
                  <ErrorBoundary level="page">
                    <AuthGuard>
                      <div className="container mx-auto py-8">
                        <Suspense fallback={<LoadingFallback />}>
                          <UserProfileForm className="max-w-md mx-auto" />
                        </Suspense>
                      </div>
                    </AuthGuard>
                  </ErrorBoundary>
                }
              />

              {/* Offline support */}
              <Route
                path="/offline.html"
                element={
                  <ErrorBoundary level="section">
                    <Suspense fallback={<LoadingFallback />}>
                      <OfflinePage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />

              {/* Share Target Handler */}
              <Route
                path="/share-receipt"
                element={
                  <ErrorBoundary level="section">
                    <Suspense fallback={<LoadingFallback />}>
                      <ShareReceiptHandler />
                    </Suspense>
                  </ErrorBoundary>
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
            <ErrorBoundary level="component">
              <PWAInstallPrompt position="bottom" showDelay={3000} />
            </ErrorBoundary>
            <ErrorBoundary level="component">
              <UpdateNotification position="top" />
            </ErrorBoundary>
            <ErrorBoundary level="component">
              <OfflineIndicator />
            </ErrorBoundary>

            <Toaster />
          </>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;