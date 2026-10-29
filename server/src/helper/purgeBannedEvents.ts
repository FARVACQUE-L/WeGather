import eventRepository from "../modules/event/eventRepository";
import reservationDocumentRepository from "../modules/reservation/reservationDocumentRepository";
import { removeReservationDocument } from "./removeReservationDocument";
import { removeUpload } from "./removeUpload";

const ONE_DAY = 24 * 60 * 60 * 1000;

// Supprime définitivement les événements bannis depuis plus d'un mois, comme
// une suppression par leur hôte : la base est vidée par les ON DELETE CASCADE,
// puis les fichiers sont effacés du disque.
const purgeBannedEvents = async () => {
  try {
    const eventIds = await eventRepository.readExpiredBannedIds();

    for (const eventId of eventIds) {
      // Les fichiers ne sont effacés qu'une fois la suppression en base réussie.
      const images = await eventRepository.readImages(eventId);
      const documentFiles =
        await reservationDocumentRepository.readFilesByEvent(eventId);
      await eventRepository.deleteEvent(eventId);
      await Promise.all(images.map(removeUpload));
      await Promise.all(documentFiles.map(removeReservationDocument));
    }

    if (eventIds.length) {
      console.info(`${eventIds.length} événement(s) banni(s) supprimé(s)`);
    }
  } catch (err) {
    console.error("Échec de la purge des événements bannis :", err);
  }
};

// Un passage au démarrage du serveur, puis un par jour.
export const startBannedEventsPurge = () => {
  purgeBannedEvents();
  setInterval(purgeBannedEvents, ONE_DAY);
};
