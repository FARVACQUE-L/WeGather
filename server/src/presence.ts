// Présence des utilisateurs, en mémoire : sockets ouverts et heure de la
// dernière action, par utilisateur. Un utilisateur est « online » s'il a agi
// depuis moins de 5 minutes, « idle » s'il a encore un onglet ouvert mais n'a
// rien fait depuis, « offline » s'il n'a plus aucun socket ouvert.

export type PresenceStatus = "online" | "idle" | "offline";

export const IDLE_DELAY_MS = 5 * 60 * 1000;

type Presence = {
  sockets: Set<string>;
  lastActivity: number;
};

const presences = new Map<number, Presence>();

export const addSocket = (userId: number, socketId: string): void => {
  const presence = presences.get(userId);

  if (presence) {
    presence.sockets.add(socketId);
    presence.lastActivity = Date.now();
    return;
  }

  presences.set(userId, {
    sockets: new Set([socketId]),
    lastActivity: Date.now(),
  });
};

export const removeSocket = (userId: number, socketId: string): void => {
  const presence = presences.get(userId);
  if (!presence) return;

  presence.sockets.delete(socketId);

  if (presence.sockets.size === 0) {
    presences.delete(userId);
  }
};

export const markActivity = (userId: number): void => {
  const presence = presences.get(userId);

  if (presence) {
    presence.lastActivity = Date.now();
  }
};

export const getStatus = (userId: number): PresenceStatus => {
  const presence = presences.get(userId);

  if (!presence) return "offline";

  return Date.now() - presence.lastActivity < IDLE_DELAY_MS ? "online" : "idle";
};

export const getConnectedUserIds = (): number[] => [...presences.keys()];
