export const getYouTubeVideoId = (url) => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace("www.", "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(pathParts[0])) {
        return pathParts[1] || null;
      }
    }
  } catch {
    // Accept a plain YouTube video ID as well as a full URL.
    return /^[a-zA-Z0-9_-]{6,}$/.test(url) ? url : null;
  }

  return null;
};
