import { useEffect } from "react";
import { socket } from "../socket/socket";

// Au plus un signal par minute : assez pour le seuil d'inactivité de
// 5 minutes du serveur, sans envoyer un message à chaque mouvement.
const ACTIVITY_THROTTLE_MS = 60 * 1000;

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll"];

// Signale au serveur que l'utilisateur agit sur le site, pour son statut de
// présence (en ligne ou inactif).
function usePresenceActivity() {
  useEffect(() => {
    let lastSent = 0;

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastSent < ACTIVITY_THROTTLE_MS) return;

      lastSent = now;
      socket.emit("activity");
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, []);
}

export default usePresenceActivity;
