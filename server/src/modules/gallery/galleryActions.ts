import fs from "node:fs";
import type { RequestHandler } from "express";

import eventRepository from "../event/eventRepository";
import galleryRepository from "./galleryRepository";

// Nombre de photos dans la galerie d'un événement, tous participants
// confondus. Supprimer une photo libère sa place.
const MAX_GALLERY_PHOTOS = 15;

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

const add: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.body.event_uuid);
    const userId = Number(req.body.gallery_id_user);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const permissions = await galleryRepository.checkUserPermissions(
      eventId,
      userId,
    );
    if (!permissions.isParticipant) {
      res.status(403).json({
        message: "Action interdite : vous devez participer à l'événement.",
      });
      return;
    }

    const newGallery = {
      gallery_id_event: eventId,
      gallery_id_user: userId,
      gallery_link: req.body.gallery_link,

      gallery_description: req.body.gallery_description,
    };

    const insertId = await galleryRepository.create(newGallery);
    res.status(201).json({ insertId });
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

    const eventId = await eventRepository.readIdByUuid(req.body.event_uuid);
    const userId = Number(req.body.gallery_id_user);

    if (!eventId) {
      res.sendStatus(404);
      return;
    }

    const permissions = await galleryRepository.checkUserPermissions(
      eventId,
      userId,
    );
    if (!permissions.isParticipant) {
      res.status(403).json({
        message: "Action interdite : vous devez participer à l'événement.",
      });
      return;
    }

    const photoCount = await galleryRepository.countByEvent(eventId);
    if (photoCount >= MAX_GALLERY_PHOTOS) {
      // multer a déjà écrit la photo sur disque : on ne la garde pas.
      fs.rmSync(req.file.path, { force: true });
      res.status(403).json({
        message: `La galerie est limitée à ${MAX_GALLERY_PHOTOS} photos.`,
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

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const galleryId = Number(req.params.gallery_id);

    const photo = await galleryRepository.read(galleryId);
    if (!photo) {
      res.status(404).json({ message: "Photo introuvable" });
      return;
    }

    const resultAffectedRows = await galleryRepository.delete(galleryId);
    res.status(200).json({ resultAffectedRows });
  } catch (err) {
    next(err);
  }
};

const edit: RequestHandler = async (req, res, next) => {
  try {
    const galleryId = Number(req.params.gallery_id);

    const description = req.body.gallery_description;

    const photo = await galleryRepository.read(galleryId);
    if (!photo) {
      res.status(404).json({ message: "Photo introuvable" });
      return;
    }
    await galleryRepository.updateDescription(galleryId, description);

    res.status(200).json({ message: "Description modifiée avec succès !" });
  } catch (err) {
    next(err);
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
  add,
  destroy,
  uploadPhoto,
  edit,
  getLikedPhotos,
  addLike,
  removeLike,
};
