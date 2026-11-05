import type { RequestParamHandler, Router } from "express";
import { isId } from "../helper/validation";

const validateIdParam: RequestParamHandler = (_req, res, next, value) => {
  if (isId(value)) {
    next();
    return;
  }

  res.status(400).json({ message: "Identifiant invalide." });
};

export const validateIds = (router: Router, ...names: string[]) => {
  for (const name of names) router.param(name, validateIdParam);
};
