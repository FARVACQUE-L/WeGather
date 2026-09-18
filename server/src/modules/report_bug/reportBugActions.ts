import type { RequestHandler } from "express";
import reportBugRepository from "./reportBugRepository";

const browse: RequestHandler = async (_req, res, next) => {
  try {
    const reported_bug = await reportBugRepository.readAll();

    res.json(reported_bug);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const imagePaths = files?.map((file) => file.filename) ?? [];

    const newReportBug = {
      reported_bug_description: req.body.reported_bug_description,
      reported_bug_by_id_user: req.user.id,
    };

    const alreadyExists = await reportBugRepository.exists(
      newReportBug.reported_bug_by_id_user,
    );

    if (alreadyExists) {
      res.status(409).json({
        message:
          "Vous avez déjà signalé un bug récemment. Merci pour votre retour, vous pourrez en signaler un nouveau dans 24h.",
      });
      return;
    }

    const insertId = await reportBugRepository.create(newReportBug, imagePaths);

    res.status(201).json({ insertId });
  } catch (err) {
    next(err);
  }
};

export default { browse, add };
