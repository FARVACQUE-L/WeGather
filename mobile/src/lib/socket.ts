import { io, type Socket } from "socket.io-client";

import { API_URL } from "@/constants/config";

// Une seule connexion temps réel pour toute l'app, ouverte tant que
// l'utilisateur est connecté. Le serveur l'identifie par le token
// (option auth, voir server/src/socket.ts).
let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  socket?.disconnect();
  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket"],
  });
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
