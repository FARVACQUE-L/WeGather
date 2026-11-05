import fs from "node:fs";
import path from "node:path";
import { ZipArchive } from "archiver";
import type { RequestHandler } from "express";

import { isEventMember, readMemberEventId } from "../../helper/eventMembership";
import { getPlanLimits } from "../../helper/planLimits";
import { removeUpload } from "../../helper/removeUpload";
import { asText, isText, LIMITS } from "../../helper/validation";
import { detectMimeType, UPLOADS_DIRECTORY } from "../../middleware/upload";
import eventRepository from "../event/eventRepository";
import galleryRepository from "./galleryRepository";

const DESCRIPTION_TOO_LONG = `La description ne doit pas dépasser ${LIMITS.galleryDescription} caractères.`;

const readPhotoLimit = async (eventId: number) =>
  getPlanLimits(await eventRepository.readHostPlan(eventId)).galleryPhotos;

const readLimit: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    res.json({ limit: await readPhotoLimit(eventId) });
  } catch (err) {
    next(err);
  }
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

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
    const userId = req.user.id;

    if (!eventId) {
      fs.rmSync(req.file.path, { force: true });
      res.sendStatus(404);
      return;
    }

    if (!isText(req.body.gallery_description, LIMITS.galleryDescription, 0)) {
      fs.rmSync(req.file.path, { force: true });
      res.status(400).json({ message: DESCRIPTION_TOO_LONG });
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
      gallery_description: asText(req.body.gallery_description) || null,
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

  const isAuthor =
    photo.gallery_id_user === req.user.id &&
    (await isEventMember(photo.gallery_id_event, req.user.id));
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

    if (!isText(req.body.gallery_description, LIMITS.galleryDescription, 0)) {
      res.status(400).json({ message: DESCRIPTION_TOO_LONG });
      return;
    }

    await galleryRepository.updateDescription(
      photo.gallery_id,
      asText(req.body.gallery_description),
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

const readUploadPath = (link: string) =>
  path.join(
    path.resolve(process.cwd(), UPLOADS_DIRECTORY),
    path.basename(link),
  );

const photoFileName = (galleryId: number, mimeType: string | null) =>
  `photo-${galleryId}${(mimeType && IMAGE_EXTENSIONS[mimeType]) ?? ""}`;

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

    const filePath = readUploadPath(photo.gallery_link);

    try {
      await fs.promises.access(filePath);
    } catch {
      res.status(404).json({ message: "Photo introuvable" });
      return;
    }

    const mimeType = await detectMimeType(filePath);

    res.setHeader("X-Content-Type-Options", "nosniff");
    if (mimeType) {
      res.type(mimeType);
    }
    res.download(filePath, photoFileName(photo.gallery_id, mimeType));
  } catch (error) {
    next(error);
  }
};

const downloadAll: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);
    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const permissions = await galleryRepository.checkUserPermissions(
      eventId,
      req.user.id,
    );
    if (!permissions.isParticipant) {
      res.status(403).json({
        message: "Action interdite : vous devez participer à l'événement.",
      });
      return;
    }

    const photos = (await galleryRepository.readAll(eventId)) as {
      gallery_id: number;
      gallery_link: string;
    }[];
    if (photos.length === 0) {
      res.status(404).json({ message: "Aucune photo dans cette galerie" });
      return;
    }

    const [event] = await eventRepository.readEventName(eventId);
    res.attachment(`${event?.event_name || "galerie"}.zip`);

    const archive = new ZipArchive({ store: true });
    archive.on("error", (error) => res.destroy(error));
    archive.pipe(res);

    for (const photo of photos) {
      const filePath = readUploadPath(photo.gallery_link);
      try {
        const mimeType = await detectMimeType(filePath);
        archive.file(filePath, {
          name: photoFileName(photo.gallery_id, mimeType),
        });
      } catch {}
    }

    await archive.finalize();
  } catch (error) {
    if (res.headersSent) {
      res.destroy(error as Error);
      return;
    }
    next(error);
  }
};

const getLikedPhotos: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId || !req.user) return;

    const likedRows = (await galleryRepository.getLikesByEventAndUser(
      eventId,
      req.user.id,
    )) as { gallery_like_id_gallery: number }[];

    const likedPhotoIds = likedRows.map((row) => row.gallery_like_id_gallery);

    res.json(likedPhotoIds);
  } catch (error) {
    next(error);
  }
};

const readLikeablePhoto = async (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  const photo = await galleryRepository.read(Number(req.params.id));
  if (!photo) {
    res.status(404).json({ message: "Photo introuvable" });
    return undefined;
  }

  if (!(await isEventMember(photo.gallery_id_event, req.user.id))) {
    res.status(403).json({
      message: "Action interdite : vous devez participer à l'événement.",
    });
    return undefined;
  }

  return { photo, userId: req.user.id };
};

const addLike: RequestHandler = async (req, res, next) => {
  try {
    const found = await readLikeablePhoto(req, res);
    if (!found) return;

    const newLike = await galleryRepository.insertLike(
      found.photo.gallery_id,
      found.userId,
    );

    res.status(201).json(newLike);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "Photo déjà likée." });
      return;
    }
    next(error);
  }
};

const removeLike: RequestHandler = async (req, res, next) => {
  try {
    const found = await readLikeablePhoto(req, res);
    if (!found) return;

    await galleryRepository.deleteLike(found.photo.gallery_id, found.userId);

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
  downloadAll,
  uploadPhoto,
  edit,
  getLikedPhotos,
  addLike,
  removeLike,
};
