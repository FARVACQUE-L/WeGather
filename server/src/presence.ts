// Présence des utilisateurs, en mémoire : sockets ouverts par utilisateur.
// Un utilisateur est « online » tant qu'il a au moins un onglet ouvert sur le
// site, « offline » sinon.

export type PresenceStatus = "online" | "offline";

const sockets = new Map<number, Set<string>>();

export const addSocket = (userId: number, socketId: string): void => {
  const userSockets = sockets.get(userId);

  if (userSockets) {
    userSockets.add(socketId);
    return;
  }

  sockets.set(userId, new Set([socketId]));
};

export const removeSocket = (userId: number, socketId: string): void => {
  const userSockets = sockets.get(userId);
  if (!userSockets) return;

  userSockets.delete(socketId);

  if (userSockets.size === 0) {
    sockets.delete(userId);
  }
};

export const getStatus = (userId: number): PresenceStatus =>
  sockets.has(userId) ? "online" : "offline";
