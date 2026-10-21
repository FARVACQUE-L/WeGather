import fs from "node:fs";
import path from "node:path";
import type { RequestHandler } from "express";

import { getPlanLimits } from "../../helper/planLimits";
import { removeUpload } from "../../helper/removeUpload";
import { detectMimeType, UPLOADS_DIRECTORY } from "../../middleware/upload";
import eventRepository from "../event/eventRepository";
import galleryRepository from "./galleryRepository";

// Nombre de photos dans la galerie d'un événement, tous participants
// confondus, selon la formule de l'organisateur. Supprimer une photo libère
// sa place.
const readPhotoLimit = async (eventId: number) =>
  getPlanLimits(await eventRepository.readHostPlan(eventId)).galleryPhotos;

const readLimit: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    res.json({ limit: await readPhotoLimit(eventId) });
  } catch (err) {
    next(err);
  }
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const gallery = await galleryRepository.readAll(eventId);

    res.json(gallery);
  } catch (err) {
    next(err);
  }
};

const uploadPhoto: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Aucune image envoyée" });
      return;
    }

    if (!req.user) {
      fs.rmSync(req.file.path, { force: true });
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const eventId = await eventRepository.readIdByUuid(req.body.event_uuid);
    // L'auteur est l'utilisateur du cookie de session, jamais un id envoyé
    // par le client.
    const userId = req.user.id;

    if (!eventId) {
      fs.rmSync(req.file.path, { force: true });
      res.sendStatus(404);
      return;
    }

    const permissions = await galleryRepository.checkUserPermissions(
      eventId,
      userId,
    );
    if (!permissions.isParticipant) {
      fs.rmSync(req.file.path, { force: true });
      res.status(403).json({
        message: "Action interdite : vous devez participer à l'événement.",
      });
      return;
    }

    const photoLimit = await readPhotoLimit(eventId);
    const photoCount = await galleryRepository.countByEvent(eventId);
    if (photoCount >= photoLimit) {
      // multer a déjà écrit la photo sur disque : on ne la garde pas.
      fs.rmSync(req.file.path, { force: true });
      res.status(403).json({
        message: `La galerie est limitée à ${photoLimit} photos.`,
      });
      return;
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const newGallery = {
      gallery_id_event: eventId,
      gallery_id_user: userId,
      gallery_link: photoUrl,
      gallery_description: req.body.gallery_description ?? null,
    };

    const insertId = await galleryRepository.create(newGallery);

    res.status(201).json({
      insertId,
      photoUrl,
    });
  } catch (error) {
    next(error);
  }
};

// L'auteur peut gérer sa photo, l'hôte n'importe quelle photo de son
// événement. L'utilisateur est celui du cookie de session, jamais le userId
// de l'URL. Renvoie la photo, ou undefined si la réponse d'erreur a déjà été
// envoyée.
const readManagedPhoto = async (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  const photo = await galleryRepository.read(Number(req.params.gallery_id));
  if (!photo) {
    res.status(404).json({ message: "Photo introuvable" });
    return undefined;
  }

  const isAuthor = photo.gallery_id_user === req.user.id;
  const [event] = await eventRepository.readEventHostId(photo.gallery_id_event);
  const isHost = event?.event_id_host === req.user.id;

  if (!isAuthor && !isHost) {
    res.status(403).json({ message: "Vous ne pouvez pas gérer cette photo." });
    return undefined;
  }

  return photo;
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const photo = await readManagedPhoto(req, res);
    if (!photo) return;

    const resultAffectedRows = await galleryRepository.delete(photo.gallery_id);
    await removeUpload(photo.gallery_link);
    res.status(200).json({ resultAffectedRows });
  } catch (err) {
    next(err);
  }
};

const edit: RequestHandler = async (req, res, next) => {
  try {
    const photo = await readManagedPhoto(req, res);
    if (!photo) return;

    await galleryRepository.updateDescription(
      photo.gallery_id,
      req.body.gallery_description,
    );

    res.status(200).json({ message: "Description modifiée avec succès !" });
  } catch (err) {
    next(err);
  }
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

// Les photos sont stockées sans extension et servies sans Content-Type par
// /uploads : téléchargées telles quelles, l'OS ne les reconnaît pas comme
// des images. On relit leur signature pour les envoyer avec le bon type et un
// nom de fichier qui porte l'extension. Réservé aux participants.
const download: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const photo = await galleryRepository.read(Number(req.params.gallery_id));
    if (!photo) {
      res.status(404).json({ message: "Photo introuvable" });
      return;
    }

    const permissions = await galleryRepository.checkUserPermissions(
      photo.gallery_id_event,
      req.user.id,
    );
    if (!permissions.isParticipant) {
      res.status(403).json({
        message: "Action interdite : vous devez participer à l'événement.",
      });
      return;
    }

    // path.basename garde le fichier dans le dossier des envois.
    const filePath = path.join(
      path.resolve(process.cwd(), UPLOADS_DIRECTORY),
      path.basename(photo.gallery_link),
    );

    try {
      await fs.promises.access(filePath);
    } catch {
      res.status(404).json({ message: "Photo introuvable" });
      return;
    }

    const mimeType = await detectMimeType(filePath);
    const extension = (mimeType && IMAGE_EXTENSIONS[mimeType]) ?? "";

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.download(filePath, `photo-${photo.gallery_id}${extension}`);
  } catch (error) {
    next(error);
  }
};

const getLikedPhotos: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);
    const userId = Number(req.params.userId);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const likedRows = (await galleryRepository.getLikesByEventAndUser(
      eventId,
      userId,
    )) as { gallery_like_id_gallery: number }[];

    const likedPhotoIds = likedRows.map((row) => row.gallery_like_id_gallery);

    res.json(likedPhotoIds);
  } catch (error) {
    next(error);
  }
};

const addLike: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { user_id } = req.body;

    const newLike = await galleryRepository.insertLike(id, Number(user_id));

    res.status(201).json(newLike);
  } catch (error) {
    next(error);
  }
};

const removeLike: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.params.userId);

    await galleryRepository.deleteLike(id, userId);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export default {
  browse,
  readLimit,
  destroy,
  download,
  uploadPhoto,
  edit,
  getLikedPhotos,
  addLike,
  removeLike,
};
