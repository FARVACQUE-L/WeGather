import dns from "node:dns/promises";
import net from "node:net";

export type LinkPreview = {
  url: string;
  site: string;
  title: string;
  description: string | null;
  image: string | null;
};

// Même détection des liens que dans la messagerie côté client.
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+/i;
const URL_TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/;

const TIMEOUT_MS = 5000;
// Certains sites (YouTube…) placent leurs balises après ~800 Ko de scripts.
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const CACHE_DURATION_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

export const findFirstUrl = (text: string) => {
  const match = text.match(URL_PATTERN);
  if (!match) return null;

  const raw = match[0].replace(URL_TRAILING_PUNCTUATION, "");
  try {
    const url = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

// --- Protection SSRF -------------------------------------------------------
// Le serveur va chercher une adresse donnée par un utilisateur : il ne doit
// jamais interroger le VPS lui-même ni le réseau interne.

const isPrivateIpv4 = (ip: string) => {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
};

const isPrivateIp = (ip: string) => {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);

  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);

  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb")
  );
};

const isPublicUrl = async (url: URL) => {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  // Ports par défaut uniquement : évite de sonder d'autres services.
  if (url.port !== "") return false;

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return false;
  }
  if (net.isIP(hostname)) return !isPrivateIp(hostname);

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return (
      addresses.length > 0 &&
      addresses.every((entry) => !isPrivateIp(entry.address))
    );
  } catch {
    return false;
  }
};

// --- Téléchargement de la page ---------------------------------------------

// Les balises utiles sont dans le <head> : on arrête de lire dès sa fin.
const readHead = async (response: Response) => {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let html = "";
  let size = 0;

  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    html += decoder.decode(value, { stream: true });
    if (/<\/head>/i.test(html.slice(-value.length - 7))) break;
  }
  await reader.cancel().catch(() => {});

  return html;
};

// Suit les redirections à la main pour vérifier chaque adresse.
const fetchHtml = async (startUrl: string) => {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = new URL(current);
    if (!(await isPublicUrl(url))) return null;

    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WeGatherBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr,en;q=0.8",
      },
    });

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel().catch(() => {});
      current = new URL(location, url).href;
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("html")) {
      await response.body?.cancel().catch(() => {});
      return null;
    }

    return { html: await readHead(response), finalUrl: url };
  }

  return null;
};

// --- Lecture des balises -----------------------------------------------------

const decodeEntities = (text: string) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

const clean = (text: string | undefined, maxLength: number) => {
  if (!text) return null;
  const value = decodeEntities(text).replace(/\s+/g, " ").trim();
  if (!value) return null;
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trimEnd()}…`
    : value;
};

const readMetaTags = (html: string) => {
  const head = html.split(/<\/head>/i)[0];
  const tags = new Map<string, string>();

  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map<string, string>();
    for (const [, name, , doubleQuoted, singleQuoted] of tag.matchAll(
      /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g,
    )) {
      attributes.set(name.toLowerCase(), doubleQuoted ?? singleQuoted ?? "");
    }

    const key = (
      attributes.get("property") ?? attributes.get("name")
    )?.toLowerCase();
    const content = attributes.get("content");
    if (key && content && !tags.has(key)) tags.set(key, content);
  }

  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return { tags, title };
};

const parsePreview = (html: string, pageUrl: URL): LinkPreview | null => {
  const { tags, title: pageTitle } = readMetaTags(html);

  const title = clean(
    tags.get("og:title") ?? tags.get("twitter:title") ?? pageTitle,
    200,
  );
  if (!title) return null;

  const description = clean(
    tags.get("og:description") ??
      tags.get("twitter:description") ??
      tags.get("description"),
    300,
  );
  const site =
    clean(tags.get("og:site_name"), 100) ??
    pageUrl.hostname.replace(/^www\./, "");

  // Image affichée telle quelle par le navigateur : https uniquement, sinon
  // elle serait bloquée sur le site en https.
  let image: string | null = null;
  const rawImage = tags.get("og:image") ?? tags.get("twitter:image");
  if (rawImage) {
    try {
      const imageUrl = new URL(decodeEntities(rawImage).trim(), pageUrl);
      if (imageUrl.protocol === "https:" && imageUrl.href.length <= 2048) {
        image = imageUrl.href;
      }
    } catch {
      image = null;
    }
  }

  return { url: pageUrl.href, site, title, description, image };
};

// --- Point d'entrée ----------------------------------------------------------

const cache = new Map<string, { preview: LinkPreview | null; at: number }>();

export const fetchLinkPreview = async (
  url: string,
): Promise<LinkPreview | null> => {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_DURATION_MS) {
    return cached.preview;
  }

  let preview: LinkPreview | null = null;
  try {
    const page = await fetchHtml(url);
    preview = page ? parsePreview(page.html, page.finalUrl) : null;
    // Le lien affiché reste celui écrit dans le message.
    if (preview) preview.url = url;
  } catch {
    preview = null;
  }

  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(url, { preview, at: Date.now() });

  return preview;
};
