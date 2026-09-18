import type { NextFunction, Request, Response } from "express";
import userRepository from "../modules/user/userRepository";

const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await userRepository.readUserAdmin(req.user.id);

    if (!user?.user_is_admin) {
      res.status(403).json({ message: "Accès réservé aux administrateurs" });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Accès réservé aux administrateurs" });
  }
};

export default isAdmin;
