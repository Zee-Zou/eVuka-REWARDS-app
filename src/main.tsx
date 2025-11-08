import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "./lib/async-error-handler";
import { initializeEnvironment } from "./lib/env-validator";

// Initialize environment validation first
initializeEnvironment();

// Initialize global error handlers
setupGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);