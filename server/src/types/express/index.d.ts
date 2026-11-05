export type {};

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        isAdmin?: boolean;
      };
    }
  }
}
