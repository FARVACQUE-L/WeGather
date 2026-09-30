import { io } from "socket.io-client";

// withCredentials : le cookie de session accompagne la connexion, pour que le
// serveur sache quel utilisateur est en ligne.
export const socket = io(`${import.meta.env.VITE_API_URL}`, {
  transports: ["websocket"],
  withCredentials: true,
});

// Le serveur identifie l'utilisateur à la connexion du socket seulement :
// après une connexion ou une déconnexion au site, on rouvre le socket pour
// qu'il lise le nouveau cookie.
export const reconnectSocket = () => {
  socket.disconnect();
  socket.connect();
};
