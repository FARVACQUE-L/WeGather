export const imageUrl = (path: string) =>
  /^(https?:|blob:|data:)/.test(path)
    ? path
    : `${import.meta.env.VITE_API_URL}${path}`;
