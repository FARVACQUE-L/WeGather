import express from "express";
import contactActions from "./contactActions";

const contactRoutes = express.Router();

contactRoutes.post("/api/contact", contactActions.send);

export default contactRoutes;
