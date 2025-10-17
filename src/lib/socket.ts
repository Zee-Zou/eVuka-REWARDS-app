import { io } from "socket.io-client";

export const socket = io(
  import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:3001",
  {
    autoConnect: false,
  },
);

export const connectToLeaderboard = (userId: string) => {
  socket.auth = { userId };
  socket.connect();

  socket.on("leaderboard-update", (data) => {
    // Update local leaderboard state
    window.dispatchEvent(
      new CustomEvent("leaderboard-update", { detail: data }),
    );
  });

  return () => {
    socket.disconnect();
  };
};
