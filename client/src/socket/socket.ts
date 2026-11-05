import { io } from "socket.io-client";

export const socket = io(`${import.meta.env.VITE_API_URL}`, {
  transports: ["websocket"],
  withCredentials: true,
});

export const reconnectSocket = () => {
  socket.disconnect();
  socket.connect();
};
