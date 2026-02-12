import { io } from "socket.io-client";
import { supabase } from "./supabase";
import { logger } from "./logger";

export const socket = io(
  import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:3001",
  {
    autoConnect: false,
  },
);

/**
 * Connect to the leaderboard WebSocket with JWT authentication
 * @param userId User ID for connection context
 * @returns Cleanup function to disconnect
 */
export const connectToLeaderboard = async (userId: string) => {
  try {
    // Get JWT token from Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      logger.error("Failed to get session for WebSocket auth", error);
      throw new Error("No active session for WebSocket connection");
    }

    // Set authentication with both userId and JWT token
    socket.auth = {
      userId,
      token: session.access_token, // JWT token for server-side validation
    };

    // Connect to WebSocket server
    socket.connect();

    // Handle connection errors
    socket.on("connect_error", async (error) => {
      logger.error("WebSocket connection error", error);

      // Try to refresh token on auth error
      if (error.message.includes("auth") || error.message.includes("token")) {
        try {
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession?.access_token) {
            socket.auth = {
              userId,
              token: newSession.access_token,
            };
            // Retry connection with new token
            socket.connect();
          }
        } catch (refreshError) {
          logger.error("Failed to refresh token for WebSocket", refreshError);
        }
      }
    });

    // Handle successful connection
    socket.on("connect", () => {
      logger.info("WebSocket connected", { userId });
    });

    // Handle leaderboard updates
    socket.on("leaderboard-update", (data) => {
      // Update local leaderboard state
      window.dispatchEvent(
        new CustomEvent("leaderboard-update", { detail: data }),
      );
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info("WebSocket disconnected", { reason });

      // Auto-reconnect on certain disconnect reasons
      if (reason === "io server disconnect" || reason === "transport close") {
        // Server disconnected, try to reconnect with fresh token
        connectToLeaderboard(userId).catch(err =>
          logger.error("Failed to reconnect WebSocket", err)
        );
      }
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
    };
  } catch (error) {
    logger.error("Failed to connect to leaderboard WebSocket", error);
    throw error;
  }
};
