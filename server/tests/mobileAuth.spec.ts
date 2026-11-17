// Authentification de l'application mobile : token dans la réponse du
// login, en-tête "Authorization: Bearer", token Socket.io, et
// synchronisation des messages lus entre les appareils.
// Les accès à la base de données sont simulés : aucune base n'est requise.
process.env.TOKEN_SECRET = "secret-de-test";

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import argon2 from "argon2";
import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import { io as connectClient, type Socket } from "socket.io-client";
import supertest from "supertest";

import { encodeJWT, passwordFingerprint } from "../src/helper/jwtHelper";
import authorization from "../src/middleware/auth";
import eventRepository from "../src/modules/event/eventRepository";
import eventUserJoiningRepository from "../src/modules/event_user_joining/eventUserJoiningRepository";
import messageActions from "../src/modules/message/messageActions";
import messageRepository from "../src/modules/message/messageRepository";
import userActions from "../src/modules/user/userActions";
import userRepository from "../src/modules/user/userRepository";
import { getIo, initSocket } from "../src/socket";

const PASSWORD = "MotDePasse-Test-1!";
const EVENT_UUID = "11111111-2222-3333-4444-555555555555";

let passwordHash: string;

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  user_id: 1,
  user_username: "alice",
  user_mail: "alice@example.test",
  user_password: passwordHash,
  user_is_admin: 0,
  user_is_ban: 0,
  user_is_verified: 1,
  user_verify_expires: null,
  ...overrides,
});

const tokenFor = (userId: number, hash = passwordHash) =>
  encodeJWT({
    id: userId,
    username: `user${userId}`,
    email: `user${userId}@example.test`,
    pwd: passwordFingerprint(hash),
  });

// Mini application : seulement les routes testées, sans charger le
// routeur complet du site.
const app = express();
app.use(cookieParser());
app.use(express.json());
app.post("/api/login", userActions.login);
app.get("/api/me", authorization, (req, res) => {
  res.json({ id: req.user?.id });
});
app.post(
  "/api/messages/notification/:eventUuid",
  authorization,
  messageActions.notificationMessage,
);

const mockUsers = (users: Record<number, ReturnType<typeof dbUser>>) => {
  jest
    .spyOn(userRepository, "findById")
    .mockImplementation(async (id: number) => users[id] as never);
};

const mockEventMembership = () => {
  jest.spyOn(eventRepository, "readIdByUuid").mockResolvedValue(42 as never);
  jest
    .spyOn(eventUserJoiningRepository, "readBy")
    .mockResolvedValue([{}] as never);
};

beforeAll(async () => {
  passwordHash = await argon2.hash(PASSWORD);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("POST /api/login", () => {
  beforeEach(() => {
    jest
      .spyOn(userRepository, "findByEmail")
      .mockResolvedValue(dbUser() as never);
  });

  it("le site reçoit un cookie et pas de token", async () => {
    const response = await supertest(app)
      .post("/api/login")
      .send({ email: "alice@example.test", password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeUndefined();
    expect(response.headers["set-cookie"]?.[0]).toMatch(
      /^auth_token=Bearer%20.+HttpOnly/,
    );
  });

  it("l'application mobile reçoit le token et pas de cookie", async () => {
    const response = await supertest(app)
      .post("/api/login")
      .set("X-Client", "mobile")
      .send({ email: "alice@example.test", password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(jwt.decode(response.body.token)).toMatchObject({
      id: 1,
      username: "alice",
    });
  });

  it("un mauvais mot de passe ne donne pas de token", async () => {
    const response = await supertest(app)
      .post("/api/login")
      .set("X-Client", "mobile")
      .send({ email: "alice@example.test", password: "Mauvais-1!" });

    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
  });
});

describe("middleware authorization", () => {
  beforeEach(() => {
    mockUsers({ 1: dbUser() });
  });

  it("accepte l'en-tête Authorization: Bearer", async () => {
    const response = await supertest(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${tokenFor(1)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1 });
  });

  it("accepte toujours le cookie du site", async () => {
    const response = await supertest(app)
      .get("/api/me")
      .set(
        "Cookie",
        `auth_token=${encodeURIComponent(`Bearer ${tokenFor(1)}`)}`,
      );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1 });
  });

  it("ignore un en-tête Authorization qui n'est pas Bearer", async () => {
    const response = await supertest(app)
      .get("/api/me")
      .set("Authorization", "Basic YWxpY2U6cGFzcw==")
      .set(
        "Cookie",
        `auth_token=${encodeURIComponent(`Bearer ${tokenFor(1)}`)}`,
      );

    expect(response.status).toBe(200);
  });

  it("refuse une requête sans identifiants", async () => {
    const response = await supertest(app).get("/api/me");

    expect(response.status).toBe(401);
  });

  it("refuse un token signé avec une autre clé", async () => {
    const forged = jwt.sign({ id: 1, username: "alice" }, "autre-secret");
    const response = await supertest(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${forged}`);

    expect(response.status).toBe(401);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("refuse un token émis avant un changement de mot de passe", async () => {
    const oldToken = tokenFor(1, "ancien-hash");
    const response = await supertest(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${oldToken}`);

    expect(response.status).toBe(401);
  });

  it("refuse un compte banni avec 403", async () => {
    mockUsers({ 1: dbUser({ user_is_ban: 1 }) });
    const response = await supertest(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${tokenFor(1)}`);

    expect(response.status).toBe(403);
  });
});

describe("Socket.io", () => {
  let server: Server;
  let url: string;
  const clients: Socket[] = [];

  const connect = (token?: string) =>
    new Promise<Socket>((resolve, reject) => {
      const client = connectClient(url, {
        auth: token ? { token } : {},
        transports: ["websocket"],
        forceNew: true,
      });
      clients.push(client);
      client.once("connect", () => resolve(client));
      client.once("connect_error", reject);
    });

  // join-event n'a pas d'accusé de réception : on attend que le serveur
  // ait placé le socket dans le salon (ou qu'il ait eu le temps de refuser).
  const roomSize = async () =>
    (await getIo().in(`event-${EVENT_UUID}`).fetchSockets()).length;

  const waitFor = async (condition: () => Promise<boolean>) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await condition()) return true;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return false;
  };

  const receives = (client: Socket, event: string, delay = 300) =>
    new Promise<unknown>((resolve) => {
      const timer = setTimeout(() => resolve(undefined), delay);
      client.once(event, (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

  // Le serveur trace chaque connexion : on coupe ces journaux pendant
  // les tests (pas avec jest.spyOn, que restoreAllMocks annulerait).
  const originalLog = console.log;

  beforeAll(async () => {
    console.log = () => {};
    server = createServer();
    initSocket(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  beforeEach(() => {
    mockUsers({ 1: dbUser(), 2: dbUser({ user_id: 2 }) });
    mockEventMembership();
  });

  afterEach(() => {
    for (const client of clients.splice(0)) client.close();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => getIo().close(() => resolve()));
    console.log = originalLog;
  });

  it("un token valide rejoint le salon de l'événement", async () => {
    const client = await connect(tokenFor(1));
    client.emit("join-event", EVENT_UUID);

    expect(await waitFor(async () => (await roomSize()) === 1)).toBe(true);

    const received = receives(client, "new-message");
    getIo().to(`event-${EVENT_UUID}`).emit("new-message", { message_id: 1 });
    expect(await received).toEqual({ message_id: 1 });
  });

  it("un faux token ne rejoint pas le salon", async () => {
    const forged = jwt.sign({ id: 1 }, "autre-secret");
    const client = await connect(forged);
    client.emit("join-event", EVENT_UUID);

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(await roomSize()).toBe(0);
  });

  it("prévient tous les appareils de l'utilisateur quand il lit ses messages", async () => {
    jest
      .spyOn(messageRepository, "notificationMessage")
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(messageRepository, "getMessagesByEventId")
      .mockResolvedValue([] as never);

    const phone = await connect(tokenFor(1));
    const otherUser = await connect(tokenFor(2));

    // Présence enregistrée après la lecture asynchrone du token.
    await waitFor(async () => {
      const sockets = await getIo().fetchSockets();
      return sockets.length === 2;
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const phoneReceived = receives(phone, "messages-read", 1000);
    const otherReceived = receives(otherUser, "messages-read");

    const response = await supertest(app)
      .post(`/api/messages/notification/${EVENT_UUID}`)
      .set("Authorization", `Bearer ${tokenFor(1)}`);

    expect(response.status).toBe(201);
    expect(await phoneReceived).toEqual({ eventUuid: EVENT_UUID });
    expect(await otherReceived).toBeUndefined();
  });
});
