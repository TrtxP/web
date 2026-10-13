export const getAvatarUrl = (url: string | undefined | null): string => {
  if (!url) return "";
  if (url.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

