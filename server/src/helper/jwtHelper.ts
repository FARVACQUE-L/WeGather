import jwt from "jsonwebtoken";

export interface JwtUser {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
}

const encodeJWT = (payload: JwtUser): string =>
  jwt.sign(payload, process.env.TOKEN_SECRET as string, { expiresIn: "30d" });

const decodeJWT = (token: string): JwtUser => {
  return jwt.verify(token, process.env.TOKEN_SECRET as string) as JwtUser;
};

export { decodeJWT, encodeJWT };
