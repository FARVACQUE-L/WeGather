import express from "express";
import contactActions from "./contactActions";

const contactRoutes = express.Router();

// Public : le formulaire est accessible sans compte.
contactRoutes.post("/api/contact", contactActions.send);

export default contactRoutes;
