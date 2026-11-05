import type { NextFunction, Request, Response } from "express";
import userRepository from "../modules/user/userRepository";

const isSuperAdmin = async (
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

    if (!user?.user_is_superadmin) {
      res.status(403).json({ message: "Accès réservé aux superadmins" });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Accès réservé aux superadmins" });
  }
};

export default isSuperAdmin;
