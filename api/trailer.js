export default async function handler(req, res) {
  // Enable CORS so the frontend can call this serverless endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing YouTube video ID" });
  }

  try {
    let streamUrl = null;
    let title = null;

    // 1. Attempt direct MP4 stream extraction using @distube/ytdl-core
    try {
      const ytdl = (await import("@distube/ytdl-core")).default;
      let agent = undefined;

      if (process.env.YOUTUBE_COOKIE) {
        try {
          const cookies = JSON.parse(process.env.YOUTUBE_COOKIE);
          agent = ytdl.createAgent(cookies);
        } catch {
          // If raw cookie string
          agent = ytdl.createAgent([{ name: "cookie", value: process.env.YOUTUBE_COOKIE }]);
        }
      }

      const info = await ytdl.getInfo(
        `https://www.youtube.com/watch?v=${id}`,
        agent ? { agent } : undefined
      );
      title = info.videoDetails?.title;

      const format =
        ytdl.chooseFormat(info.formats, {
          quality: "highest",
          filter: (f) => f.hasVideo && f.hasAudio && f.container === "mp4",
        }) ||
        ytdl.chooseFormat(info.formats, {
          quality: "highest",
          filter: (f) => f.hasVideo && f.hasAudio,
        }) ||
        ytdl.chooseFormat(info.formats, { quality: "highestvideo" });

      if (format && format.url) {
        streamUrl = format.url;
      }
    } catch {
      // Serverless IP rate limits or YouTube bot detection fallbacks gracefully
    }

    // 2. Return clean direct stream if resolved
    if (streamUrl) {
      return res.status(200).json({
        success: true,
        type: "direct",
        title,
        streamUrl,
      });
    }

    // 3. Fallback: Return clean privacy-enhanced embed parameters without controls
    return res.status(200).json({
      success: true,
      type: "embed",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`,
      message: "Direct stream restricted by YouTube; fallback embed ready",
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      type: "embed",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`,
      error: error.message,
    });
  }
}
