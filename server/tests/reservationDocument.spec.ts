// Envoi d'un billet sur une réservation : le nom du fichier doit être
// enregistré correctement, que l'envoi vienne du site ou de l'app mobile
// (le fetch d'Expo encode le nom comme une URL).
// Les accès à la base de données sont simulés : aucune base n'est requise.
process.env.TOKEN_SECRET = "secret-de-test";

import argon2 from "argon2";
import cookieParser from "cookie-parser";
import express from "express";
import supertest from "supertest";

import { encodeJWT, passwordFingerprint } from "../src/helper/jwtHelper";
import { removeReservationDocument } from "../src/helper/removeReservationDocument";
import authorization from "../src/middleware/auth";
import {
  uploadReservationDocument,
  verifyFileSignatures,
} from "../src/middleware/upload";
import eventUserJoiningRepository from "../src/modules/event_user_joining/eventUserJoiningRepository";
import reservationDocumentActions from "../src/modules/reservation/reservationDocumentActions";
import reservationDocumentRepository from "../src/modules/reservation/reservationDocumentRepository";
import reservationRepository from "../src/modules/reservation/reservationRepository";
import userRepository from "../src/modules/user/userRepository";

// Début d'un vrai PDF : verifyFileSignatures contrôle la signature.
const PDF = Buffer.from("%PDF-1.4\n%test\n");

const app = express();
app.use(cookieParser());
app.post(
  "/api/reservations/:id/documents",
  authorization,
  uploadReservationDocument.single("document"),
  verifyFileSignatures,
  reservationDocumentActions.addDocument,
);

let token: string;
// Fichiers écrits par multer pendant les tests, supprimés à la fin.
const savedFiles: string[] = [];

beforeAll(async () => {
  const passwordHash = await argon2.hash("MotDePasse-Test-1!");
  token = encodeJWT({
    id: 1,
    username: "alice",
    email: "alice@example.test",
    pwd: passwordFingerprint(passwordHash),
  });

  jest.spyOn(userRepository, "findById").mockResolvedValue({
    user_id: 1,
    user_password: passwordHash,
    user_is_ban: 0,
  } as never);
});

beforeEach(() => {
  jest.spyOn(reservationRepository, "read").mockResolvedValue({
    reservation_id: 7,
    reservation_id_event: 42,
  } as never);
  jest
    .spyOn(eventUserJoiningRepository, "readBy")
    .mockResolvedValue([{}] as never);
  jest
    .spyOn(reservationDocumentRepository, "countByReservation")
    .mockResolvedValue(0 as never);
  jest
    .spyOn(reservationDocumentRepository, "create")
    .mockImplementation(async (document: { document_file: string }) => {
      savedFiles.push(document.document_file);
      return 99 as never;
    });
});

afterAll(async () => {
  await Promise.all(savedFiles.map(removeReservationDocument));
  jest.restoreAllMocks();
});

const upload = (filename: string, headers: Record<string, string> = {}) => {
  let request = supertest(app)
    .post("/api/reservations/7/documents")
    .set("Authorization", `Bearer ${token}`);
  for (const [key, value] of Object.entries(headers)) {
    request = request.set(key, value);
  }
  return request.attach("document", PDF, {
    filename,
    contentType: "application/pdf",
  });
};

describe("nom des billets envoyés", () => {
  it("décode le nom encodé envoyé par l'app mobile", async () => {
    const response = await upload("billet%20%C3%A9t%C3%A9.pdf", {
      "X-Client": "mobile",
    });

    expect(response.status).toBe(201);
    expect(response.body.document_name).toBe("billet été.pdf");
  });

  it("garde tel quel le nom envoyé par le site", async () => {
    const response = await upload("billet%20été.pdf");

    expect(response.status).toBe(201);
    expect(response.body.document_name).toBe("billet%20été.pdf");
  });

  it("garde le nom si l'encodage envoyé par l'app est invalide", async () => {
    const response = await upload("billet%E9.pdf", { "X-Client": "mobile" });

    expect(response.status).toBe(201);
    expect(response.body.document_name).toBe("billet%E9.pdf");
  });
});
