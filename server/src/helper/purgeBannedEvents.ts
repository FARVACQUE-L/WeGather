import eventRepository from "../modules/event/eventRepository";
import reservationDocumentRepository from "../modules/reservation/reservationDocumentRepository";
import { removeReservationDocument } from "./removeReservationDocument";
import { removeUpload } from "./removeUpload";

const ONE_DAY = 24 * 60 * 60 * 1000;

const purgeBannedEvents = async () => {
  try {
    const eventIds = await eventRepository.readExpiredBannedIds();

    for (const eventId of eventIds) {
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

export const startBannedEventsPurge = () => {
  purgeBannedEvents();
  setInterval(purgeBannedEvents, ONE_DAY);
};
