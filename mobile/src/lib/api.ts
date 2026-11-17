import { API_URL } from "@/constants/config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Appelé quand le serveur refuse le token (expiré, mot de passe changé) :
// la session est alors fermée dans l'app.
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export const api = async <T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> => {
  const headers: Record<string, string> = { "X-Client": "mobile" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // 403 n'est pas pris en compte : il signale aussi un simple refus
    // (ex. événement dont on n'est pas membre) sans que la session soit morte.
    if (response.status === 401 && authToken) {
      onUnauthorized?.();
    }
    throw new ApiError(
      response.status,
      typeof data.message === "string" ? data.message : "Erreur serveur",
      data,
    );
  }

  return data as T;
};
