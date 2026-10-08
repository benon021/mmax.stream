import brandLogo from "../assets/mmax-stream-logo.svg";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import "../css/MovieModal.css";
import { getSeasonDetails, getMovieDetails, getSimilarContent } from "../services/api";
import { getProgress, saveProgress } from "../services/progress";
import { searchAnimeHiAnime, getHiAnimeEpisodes, getAnimeEmbedUrl, findBestAnimeMatch } from "../services/animeApi";
import { getMediaTimestamps } from "../services/timestampsApi";

const IMG_BASE_BACKDROP = "https://image.tmdb.org/t/p/original";
const EPISODES_PER_BATCH = 25;

// Multi-server source list (Optimized for reliability)
const SOURCES = [
  { 
    id: "vidlink", 
    name: "Alpha", 
    getUrl: (id, isTV, s, e) => isTV ? `https://vidlink.pro/tv/${id}/${s}/${e}` : `https://vidlink.pro/movie/${id}` 
  },
  { 
    id: "vidsrc", 
    name: "Beta", 
    getUrl: (id, isTV, s, e) => isTV ? `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}` : `https://vidsrc.xyz/embed/movie/${id}` 
  },
  { 
    id: "vidsrc_to", 
    name: "Gamma", 
    getUrl: (id, isTV, s, e) => isTV ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}` : `https://vidsrc.to/embed/movie/${id}` 
  },
  { 
    id: "embedsu", 
    name: "Delta", 
    getUrl: (id, isTV, s, e) => isTV ? `https://embed.su/embed/tv/${id}/${s}/${e}` : `https://embed.su/embed/movie/${id}` 
  },
  { 
    id: "vimeo", 
    name: "Vimeo Look", 
    getUrl: (id) => `https://player.vimeo.com/video/${id}` 
  }
];

// Dedicated Anime Servers (powered by local HiAnime scraper API + multi-server fallback)
const ANIME_SOURCES = [
  { 
    id: "anime_hd", 
    name: "MegaCloud (HD)", 
    isAnime: true 
  },
  { 
    id: "anime_flixera", 
    name: "Flixera (Multi-Dub)", 
    isAnime: true 
  },
  { 
    id: "vidlink", 
    name: "Alpha (VidLink)", 
    getUrl: (id, isTV, s, e) => isTV ? `https://vidlink.pro/tv/${id}/${s}/${e}` : `https://vidlink.pro/movie/${id}` 
  },
  { 
    id: "vidsrc", 
    name: "Beta (VidSrc)", 
    getUrl: (id, isTV, s, e) => isTV ? `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}` : `https://vidsrc.xyz/embed/movie/${id}` 
  }
];

import { useMovieContext } from "../contexts/MovieContext";

function MovieModal({ movie, onClose, initialPlaying = false }) {
  const { isFavorite, addToFavorites, removeFromFavorites, setIsModalOpen } = useMovieContext();
  
  // State Declarations
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [fullDetails, setFullDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [similarContent, setSimilarContent] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [expandedEpisode, setExpandedEpisode] = useState(1);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  // default source index will be set dynamically based on content type
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isServerOpen, setIsServerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [playTrailerFirst, setPlayTrailerFirst] = useState(false);
  const [trailerStream, setTrailerStream] = useState(null);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [episodeViewMode, setEpisodeViewMode] = useState("grid"); // "grid" | "list"
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState("");
  const [isPlayerServerOpen, setIsPlayerServerOpen] = useState(false);
  const [animeAudio, setAnimeAudio] = useState("dub"); // "dub" | "sub" (unified audio preference)
  const [hiAnimeEpisodes, setHiAnimeEpisodes] = useState([]);
  const [isAdShieldActive, setIsAdShieldActive] = useState(true);
  const [mediaTimestamps, setMediaTimestamps] = useState(null);
  const [showCreditsPrompt, setShowCreditsPrompt] = useState(false);
  
  const handleAudioChange = (newAudio) => {
    setAnimeAudio(newAudio);
    setIsVideoLoading(true);
  };
  
  const modalOverlayRef = useRef(null);
  const iframeRef = useRef(null);
  const playerServerDropdownRef = useRef(null);

  // Content type helper variables derived from currentMovie
  const isTV = currentMovie.media_type === "tv" || currentMovie.mediaType === "tv" || !!(currentMovie.name || currentMovie.first_air_date);
  const isAnime = useMemo(() => {
    if (currentMovie.mediaType === "anime") return true;
    if (currentMovie.genre_ids?.includes(16) && (currentMovie.original_language === "ja" || currentMovie.origin_country?.includes("JP"))) return true;
    if (fullDetails?.genres?.some(g => g.id === 16) && (fullDetails?.original_language === "ja" || fullDetails?.origin_country?.includes("JP"))) return true;
    if (typeof window !== "undefined" && window.location.pathname.includes("anime")) return true;
    return false;
  }, [currentMovie, fullDetails]);
  const mediaType = isTV ? "tv" : "movie";

  // Re-arm ad shield when video source, movie, or episode changes
  useEffect(() => {
    setIsAdShieldActive(true);
  }, [currentSourceIndex, selectedEpisode, selectedSeason, currentMovie.id]);

  // Method 2: Anti-Framebusting - Trap external ad redirects attempting to hijack the main window
  useEffect(() => {
    if (!isPlaying) return;

    const handleBeforeUnload = (e) => {
      // Prevents embedded ad scripts from redirecting the parent tab away from MMAX
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPlaying]);

  // Fetch verified Intro and End Credits timestamps from TheIntroDB and AniSkip
  useEffect(() => {
    if (!currentMovie?.id) return;
    let cancelled = false;

    const activeAnimeEp = isAnime
      ? hiAnimeEpisodes.find((item) => item.episodeNumber === selectedEpisode) || hiAnimeEpisodes[selectedEpisode - 1]
      : null;

    setMediaTimestamps(null);
    setShowCreditsPrompt(false);

    getMediaTimestamps({
      tmdbId: currentMovie.id,
      isTV,
      season: selectedSeason,
      episode: selectedEpisode,
      malId: activeAnimeEp?.malId,
      isAnime,
    }).then((data) => {
      if (cancelled) return;
      if (data) {
        setMediaTimestamps(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentMovie?.id, isTV, selectedSeason, selectedEpisode, isAnime, hiAnimeEpisodes]);

  // Listen for timeupdate events from embed player iframes (e.g. VidLink postMessage)
  useEffect(() => {
    if (!isPlaying || !mediaTimestamps?.credits?.start) return;

    const handleMessage = (event) => {
      try {
        let payload = event.data;
        if (typeof payload === "string") {
          payload = JSON.parse(payload);
        }
        const time = payload?.currentTime || payload?.data?.currentTime || payload?.time;
        if (typeof time === "number" && time >= mediaTimestamps.credits.start) {
          setShowCreditsPrompt(true);
        }
      } catch {
        // Not a JSON message or unrelated event
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isPlaying, mediaTimestamps]);

  // Reset trailer states when movie changes
  useEffect(() => {
    setTrailerKey(currentMovie.youtube_key || null);
    setPlayTrailerFirst(false);
    setTrailerStream(null);
  }, [currentMovie.id, currentMovie.youtube_key]);

  // Fetch clean direct stream via Vercel serverless function when trailer is triggered
  useEffect(() => {
    if (!playTrailerFirst || !trailerKey) {
      setTrailerStream(null);
      return;
    }

    let isMounted = true;

    fetch(`/api/trailer?id=${encodeURIComponent(trailerKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Trailer extraction returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && data?.type === "direct" && data?.streamUrl) {
          setTrailerStream({
            type: "direct",
            streamUrl: data.streamUrl,
            title: data.title || "",
          });
        } else if (data?.embedUrl) {
          setTrailerStream({
            type: "embed",
            embedUrl: data.embedUrl,
          });
        } else {
          setTrailerStream({
            type: "embed",
            embedUrl: `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`,
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Direct trailer stream resolution fallback to embed:", err);
        setTrailerStream({
          type: "embed",
          embedUrl: `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [playTrailerFirst, trailerKey]);

  useEffect(() => {
    setIsPlaying(initialPlaying);
  }, [initialPlaying, currentMovie.id]);

  useEffect(() => {
    setIsModalOpen(true);
    return () => setIsModalOpen(false);
  }, [setIsModalOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);



  // Set default streaming source: 0 for both Anime (MegaCloud) and Movies/TV (Alpha)
  useEffect(() => {
    setCurrentSourceIndex(0);
  }, [isAnime, currentMovie.id]);

  // Query local HiAnime API for anime episodes and stream manifests
  useEffect(() => {
    if (!isAnime || !currentMovie) return;
    let cancelled = false;
    const animeTitle = currentMovie.name || currentMovie.title || currentMovie.original_name || "";
    if (!animeTitle) return;

    searchAnimeHiAnime(animeTitle, selectedSeason)
      .then(async (results) => {
        if (cancelled || !results || results.length === 0) return;
        const best = findBestAnimeMatch(results, animeTitle);
        if (!best) return;
        const eps = await getHiAnimeEpisodes(best.id);
        if (cancelled || !eps || eps.length === 0) return;
        setHiAnimeEpisodes(eps);
      })
      .catch((err) => {
        console.warn("[Anime] Offline HiAnime load error:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isAnime, currentMovie, selectedSeason]);

  
  // Robust Data Sanitization - Solve "Unknown"
  const title = currentMovie.title || currentMovie.name || currentMovie.original_title || "Untitled Cinematic";
  const backdropPath = currentMovie.backdrop_path || currentMovie.poster_path;
  const date = currentMovie.release_date || currentMovie.first_air_date || "";
  const year = date ? date.split("-")[0] : "New Stream";
  const votePercent = currentMovie.vote_average ? Math.round(currentMovie.vote_average * 10) : 85; // fallback to high match for premium feel

  // Progress Saving Logic
  useEffect(() => {
    if (isPlaying) {
      const saveInterval = setInterval(() => {
        saveProgress(currentMovie.id, {
          id: currentMovie.id,
          title,
          poster_path: currentMovie.poster_path,
          season: isTV ? selectedSeason : null,
          episode: isTV ? selectedEpisode : null,
          episodeName: isTV ? episodes.find(e => e.episode_number === selectedEpisode)?.name : null,
          mediaType,
          progressPercent: 10,
          timeString: isTV ? `S${selectedSeason}:E${selectedEpisode}` : "Watching",
          timestamp: Date.now()
        });
      }, 5000); // Save more frequently (5s)

      return () => clearInterval(saveInterval);
    }
  }, [isPlaying, currentMovie, selectedSeason, selectedEpisode, episodes, title, mediaType, isTV]);

  // Extract dynamic maturity rating
    const movieLogo = useMemo(() => {
    if (!fullDetails?.images?.logos || fullDetails.images.logos.length === 0) return null;
    const enLogo = fullDetails.images.logos.find(l => l.iso_639_1 === "en");
    const chosen = enLogo || fullDetails.images.logos[0];
    return chosen?.file_path ? `https://image.tmdb.org/t/p/original${chosen.file_path}` : null;
  }, [fullDetails]);

  const getRating = () => {
    if (!fullDetails) return "NR";
    if (isTV) {
      const usRating = fullDetails.content_ratings?.results?.find(r => r.iso_3166_1 === "US")?.rating;
      return usRating || fullDetails.content_ratings?.results?.[0]?.rating || "TV-MA";
    } else {
      const usRelease = fullDetails.release_dates?.results?.find(r => r.iso_3166_1 === "US");
      const certification = usRelease?.release_dates?.find(d => d.certification)?.certification;
      return certification || "PG-13";
    }
  };

  // Extract Director/Writer
  const getCrewByJob = (job) => {
    return fullDetails?.credits?.crew?.filter(c => c.job === job).map(c => c.name).join(", ");
  };

  const director = getCrewByJob("Director");
  const creator = isTV ? fullDetails?.created_by?.map(c => c.name).join(", ") : null;

  const handlePlayStart = () => {
    setIsPlaying(true);
    
    // Initial save
    saveProgress(currentMovie.id, {
      id: currentMovie.id,
      title,
      poster_path: currentMovie.poster_path,
      mediaType,
      timestamp: Date.now()
    });
  };

  const handleEpisodeSelect = (episodeNumber) => {
    setSelectedEpisode(episodeNumber);
    setIsPlaying(true);
    modalOverlayRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };


  // Fetch Logic
  useEffect(() => {
    if (currentMovie.id) {
      setFullDetails(null);
      setDetailsLoading(true);
      setLogoLoaded(false);
      setLogoError(false);
      setSimilarContent([]);
      setLoadingSimilar(true);
      const saved = getProgress(currentMovie.id);
      if (saved) {
        if (isTV) {
          setSelectedSeason(saved.season || 1);
          setSelectedEpisode(saved.episode || 1);
          setExpandedEpisode(saved.episode || 1);
        }
      }

      // Fetch detailed data for BOTH movies and TV
      let cancelled = false;

      getMovieDetails(currentMovie.id, mediaType)
        .then(data => {
          if (cancelled) return;
          setFullDetails(data);
          setDetailsLoading(false);

          // Extract YouTube Trailer Key
          const videos = data.videos?.results || [];
          const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube") || 
                          videos.find(v => v.site === "YouTube");
          if (trailer?.key) {
            setTrailerKey(trailer.key);
          } else if (!currentMovie.youtube_key) {
            setTrailerKey(null);
          }

          // Use recommendations if available, fallback to similar
          const related = data.recommendations?.results || [];
          setSimilarContent(related.length > 0 ? related.slice(0, 12) : []);
          setLoadingSimilar(false);
        })
        .catch(err => {
          if (cancelled) return;
          console.error(`Failed to fetch ${mediaType} details`, err);
          // Fallback to similar content fetch if full details fail
          getSimilarContent(currentMovie.id, mediaType)
            .then(data => {
              if (!cancelled) setSimilarContent((data || []).slice(0, 12));
            })
            .finally(() => {
              if (!cancelled) {
              setLoadingSimilar(false);
              setDetailsLoading(false);
            }
            });
        });

      return () => {
        cancelled = true;
      };
    }
  }, [isTV, currentMovie.id, mediaType, currentMovie.youtube_key]);

  useEffect(() => {
    if (isTV && currentMovie.id) {
      setLoadingEpisodes(true);
      getSeasonDetails(currentMovie.id, selectedSeason)
        .then((data) => {
          setEpisodes(data.episodes || []);
          setLoadingEpisodes(false);
        })
        .catch((err) => {
          console.error("Failed to fetch episodes", err);
          setLoadingEpisodes(false);
        });
    }
  }, [isTV, currentMovie.id, selectedSeason]);

  // Calculate batches for pagination / tabs (e.g., 1–25, 26–50, etc.)
  const episodeBatches = useMemo(() => {
    if (!episodes || episodes.length === 0) return [];
    const totalBatches = Math.ceil(episodes.length / EPISODES_PER_BATCH);
    const list = [];
    for (let i = 0; i < totalBatches; i++) {
      const start = i * EPISODES_PER_BATCH;
      const end = Math.min((i + 1) * EPISODES_PER_BATCH, episodes.length);
      const batchSlice = episodes.slice(start, end);
      const startNum = batchSlice[0]?.episode_number ?? (start + 1);
      const endNum = batchSlice[batchSlice.length - 1]?.episode_number ?? end;
      list.push({
        index: i,
        label: `${startNum}–${endNum}`,
        startNum,
        endNum,
        containsSelected: batchSlice.some((e) => e.episode_number === selectedEpisode)
      });
    }
    return list;
  }, [episodes, selectedEpisode]);

  // Auto-jump to the batch containing the selected/watched episode
  useEffect(() => {
    if (!episodes || episodes.length === 0) return;
    const currentIdx = episodes.findIndex((e) => e.episode_number === selectedEpisode);
    if (currentIdx !== -1) {
      const targetBatch = Math.floor(currentIdx / EPISODES_PER_BATCH);
      setActiveBatchIndex(targetBatch);
    }
  }, [episodes, selectedEpisode]);

  // Filter episodes if search query is entered
  const filteredEpisodes = useMemo(() => {
    if (!episodeSearchQuery.trim()) return episodes;
    const q = episodeSearchQuery.trim().toLowerCase();
    const queryNum = parseInt(q, 10);
    return episodes.filter((ep) => {
      const matchesNum = !isNaN(queryNum) && ep.episode_number === queryNum;
      const matchesName = ep.name?.toLowerCase().includes(q);
      const matchesOverview = ep.overview?.toLowerCase().includes(q);
      return matchesNum || matchesName || matchesOverview;
    });
  }, [episodes, episodeSearchQuery]);

  // Slice displayed episodes according to active batch (or search)
  const displayedEpisodes = useMemo(() => {
    if (episodeSearchQuery.trim()) {
      return filteredEpisodes;
    }
    if (episodes.length <= EPISODES_PER_BATCH) {
      return episodes;
    }
    const maxBatch = Math.max(0, episodeBatches.length - 1);
    const safeBatchIndex = Math.min(activeBatchIndex, maxBatch);
    const start = safeBatchIndex * EPISODES_PER_BATCH;
    const end = start + EPISODES_PER_BATCH;
    return episodes.slice(start, end);
  }, [episodes, activeBatchIndex, episodeSearchQuery, filteredEpisodes, episodeBatches]);

  // Fullscreen state tracking & Orientation Lock for Mobile
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      if (isCurrentlyFullscreen) {
        // Only attempt to lock orientation if it's supported and we're on a mobile-like screen
        if (screen.orientation && screen.orientation.lock && window.innerWidth <= 1024) {
          screen.orientation.lock("landscape").catch(err => {
            console.warn("Orientation lock failed:", err);
          });
        }
      } else {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Cleanup fullscreen on unmount
  useEffect(() => {
    return () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen().catch(() => {});
        }
      }
    };
  }, []);

  const handleClose = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => {});
      }
    }
    onClose();
  };

  // Close with Escape key when not in browser fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Smooth transition from trailer to full movie with zero flash of YouTube
  const handleSkipTrailer = () => {
    setIsVideoLoading(true);
    setPlayTrailerFirst(false);
  };

  // Close player server dropdown on click outside
  useEffect(() => {
    if (!isPlayerServerOpen) return;
    const handleClickOutside = (e) => {
      if (playerServerDropdownRef.current && !playerServerDropdownRef.current.contains(e.target)) {
        setIsPlayerServerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPlayerServerOpen]);

  // Active source list based on whether content is anime
  const activeSources = isAnime ? ANIME_SOURCES : SOURCES.slice(0, 4);
  const currentSource = activeSources[currentSourceIndex] || activeSources[0];

  // Dynamic Video Source Resolution
  const videoUrl = useMemo(() => {
    if (isAnime && currentSource?.isAnime && hiAnimeEpisodes.length > 0) {
      const ep = hiAnimeEpisodes.find((item) => item.episodeNumber === selectedEpisode) || hiAnimeEpisodes[selectedEpisode - 1];
      if (ep) {
        return getAnimeEmbedUrl({
          aniId: ep.aniId,
          episodeId: ep.id || ep.embedId,
          audio: animeAudio,
          server: currentSource.id === "anime_flixera" ? "flixera" : "4animo",
        });
      }
    }
    const getUrlFn = currentSource?.getUrl || SOURCES[0].getUrl;
    return getUrlFn(currentMovie.id, isTV, selectedSeason, selectedEpisode);
  }, [isAnime, currentSource, hiAnimeEpisodes, selectedEpisode, selectedSeason, animeAudio, currentMovie.id, isTV]);

  const hasNextEpisode = isAnime
    ? selectedEpisode < (hiAnimeEpisodes?.length || 0)
    : isTV
      ? selectedEpisode < (episodes?.length || 0)
      : false;

  return createPortal(
    <div
      className={`modal-overlay  ${isFullscreen ? "is-fullscreen" : ""}`}
      onClick={(event) => event.stopPropagation()}
      ref={modalOverlayRef}
    >
      <div
        className={`modal-content ${isFullscreen ? "fullscreen" : ""} ${isPlaying ? "playing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={(event) => {
          if (event.target.matches("button, a, [tabindex='0']")) {
            event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        }}
      >
        <button className="modal-close" onClick={handleClose} aria-label="Close modal" title="Close">✕</button>

        {/* Netflix Pause Hero (when not playing) OR Active Player Section (when playing) */}
        {isPlaying ? (
          <div className="modal-player-section">
            <div className="player-wrapper-outer liquid-crystal">
              <div className="player-video-bg">

                {playTrailerFirst && trailerStream?.type === "direct" && trailerStream?.streamUrl ? (
                  <video
                    key={trailerStream.streamUrl}
                    src={trailerStream.streamUrl}
                    controls
                    autoPlay
                    playsInline
                    className="movie-player-trailer-video is-ready"
                    onEnded={handleSkipTrailer}
                    onLoadedData={() => setIsVideoLoading(false)}
                    onPlaying={() => setIsVideoLoading(false)}
                    onWaiting={() => setIsVideoLoading(true)}
                  />
                ) : playTrailerFirst ? (
                  <iframe
                    key={`trailer-iframe-${trailerKey}`}
                    ref={iframeRef}
                    src={
                      trailerStream?.embedUrl ||
                      `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`
                    }
                    title={`${title} Trailer`}
                    className={`movie-player-iframe movie-player-trailer-iframe ${isVideoLoading ? "is-loading" : "is-ready"}`}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    onLoad={() => setIsVideoLoading(false)}
                  ></iframe>
                ) : (
                  <iframe
                    key={`movie-iframe-${currentSource.id}-${currentMovie.id}-${selectedSeason}-${selectedEpisode}-${animeAudio}`}
                    ref={iframeRef}
                    src={videoUrl}
                    title={title}
                    className={`movie-player-iframe ${isVideoLoading ? "is-loading" : "is-ready"}`}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                    frameBorder="0"
                    onLoad={() => setIsVideoLoading(false)}
                  ></iframe>
                )}

                {/* Method 1: Transparent Interceptor Layer (Click Shield) */}
                {isAdShieldActive && !playTrailerFirst && (
                  <div
                    className="player-click-shield"
                    title="Ad Shield Active: Click to unlock player controls"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAdShieldActive(false);
                    }}
                  >
                    <div className="click-shield-badge">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                      </svg>
                      <span>🛡️ Ad Shield Active • Click to Play</span>
                    </div>
                  </div>
                )}

                {playTrailerFirst && (
                  <button 
                    className="skip-trailer-overlay-btn"
                    onClick={handleSkipTrailer}
                    title={`Watch Full ${isAnime ? "Anime" : isTV ? "Show" : "Movie"}`}
                  >
                    <span>Watch Full {isAnime ? "Anime" : isTV ? "Show" : "Movie"}</span>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                )}

                {/* Community-Verified End Credits & Skip to Next Episode Card */}
                {showCreditsPrompt && mediaTimestamps?.credits && (
                  <div className="credits-prompt-card" role="alert">
                    <div className="credits-prompt-header">
                      <span className="credits-prompt-kicker">🎬 END CREDITS • {mediaTimestamps.source}</span>
                      <button 
                        type="button" 
                        className="credits-prompt-dismiss" 
                        onClick={() => setShowCreditsPrompt(false)}
                        aria-label="Dismiss credits prompt"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="credits-prompt-body">
                      <p className="credits-prompt-text">
                        Credits roll at <strong>{mediaTimestamps.credits.formattedStart}</strong>.
                      </p>
                      {hasNextEpisode ? (
                        <button
                          type="button"
                          className="credits-prompt-next-btn"
                          onClick={() => {
                            setShowCreditsPrompt(false);
                            handleEpisodeSelect(selectedEpisode + 1);
                          }}
                        >
                          <span>Next Episode (E{selectedEpisode + 1})</span>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="credits-prompt-dismiss-btn"
                          onClick={() => setShowCreditsPrompt(false)}
                        >
                          ✓ Continue Watching Credits
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="player-now-watching-bar">
              <div className="player-now-watching-info">
                <h2 className="player-now-watching-title">{title}</h2>
                <div className="modal-meta">
                  <span className="modal-rating-pill">{votePercent}% Match</span>
                  <span className="modal-year">{year}</span>
                  <span className="modal-maturity-dynamic">{getRating()}</span>
                  <span className="modal-quality">4K Ultra HD</span>
                  {isTV && <span className="modal-duration">S{selectedSeason}:E{selectedEpisode}</span>}
                  {mediaTimestamps?.credits && (
                    <span className="modal-meta-credits-pill" title={`Verified End Credits timestamp (${mediaTimestamps.source})`}>
                      🎬 Credits: {mediaTimestamps.credits.formattedStart}
                    </span>
                  )}
                  {mediaTimestamps?.intro && (
                    <span className="modal-meta-intro-pill" title={`Verified Intro timestamp (${mediaTimestamps.source})`}>
                      ⚡ Intro: {mediaTimestamps.intro.formattedStart}
                    </span>
                  )}
                </div>
              </div>
              <div className="player-now-watching-actions">
                <button 
                  className="modal-btn secondary pause-details-toggle"
                  onClick={() => {
                    setIsPlaying(false);
                    setPlayTrailerFirst(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  <span>Pause / Info</span>
                </button>

                {isAnime && (
                  <div className="anime-audio-switch-pill" role="group" aria-label="Audio language">
                    <button
                      type="button"
                      className={`anime-audio-btn ${animeAudio === "dub" ? "active" : ""}`}
                      onClick={() => handleAudioChange("dub")}
                      title="English / Multi-language dubbed audio"
                    >
                      <span>DUB</span>
                    </button>
                    <button
                      type="button"
                      className={`anime-audio-btn ${animeAudio === "sub" ? "active" : ""}`}
                      onClick={() => handleAudioChange("sub")}
                      title="Japanese audio with English subtitles"
                    >
                      <span>SUB</span>
                    </button>
                  </div>
                )}

                <div className="player-server-dropdown-wrapper" ref={playerServerDropdownRef}>
                  <button 
                    className={`modal-btn secondary server-help-toggle-btn ${isPlayerServerOpen ? "active" : ""}`}
                    onClick={() => setIsPlayerServerOpen((prev) => !prev)}
                    title="Select streaming server"
                    aria-expanded={isPlayerServerOpen}
                    aria-haspopup="listbox"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>Server ({currentSource.name})</span>
                    <span className="player-server-chevron" aria-hidden="true">{isPlayerServerOpen ? "▴" : "▾"}</span>
                  </button>

                  {isPlayerServerOpen && (
                    <div className="player-server-dropdown-menu" role="listbox" aria-label="Select streaming server">
                      <div className="player-server-dropdown-header">Streaming Server</div>
                      {activeSources.map((source, index) => (
                        <button
                          key={source.id}
                          type="button"
                          role="option"
                          aria-selected={currentSourceIndex === index}
                          className={`player-server-dropdown-option ${currentSourceIndex === index ? "active" : ""}`}
                          onClick={() => {
                            setCurrentSourceIndex(index);
                            setIsVideoLoading(true);
                            setIsPlayerServerOpen(false);
                          }}
                        >
                          <span className="player-server-option-indicator" />
                          <span className="player-server-option-name">{source.name}</span>
                          {currentSourceIndex === index && <span className="player-server-option-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  className={`modal-btn secondary shield-toggle-btn ${isAdShieldActive ? "shield-active" : ""}`}
                  onClick={() => setIsAdShieldActive((prev) => !prev)}
                  title={isAdShieldActive ? "Ad Shield is active (absorbing popup clicks). Click to unlock native player controls" : "Click to arm Ad Shield against popups"}
                  aria-pressed={isAdShieldActive}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  <span>{isAdShieldActive ? "Shield Active" : "Shield"}</span>
                </button>
                {mediaTimestamps?.credits && (
                  <button 
                    type="button"
                    className={`modal-btn secondary credits-quick-btn ${showCreditsPrompt ? "active" : ""}`}
                    onClick={() => {
                      if (hasNextEpisode) {
                        handleEpisodeSelect(selectedEpisode + 1);
                      } else {
                        setShowCreditsPrompt((prev) => !prev);
                      }
                    }}
                    title={`End credits begin at ${mediaTimestamps.credits.formattedStart} (${mediaTimestamps.source})`}
                  >
                    <span>{hasNextEpisode ? `⏭️ Next Ep (${mediaTimestamps.credits.formattedStart})` : `🎬 Credits (${mediaTimestamps.credits.formattedStart})`}</span>
                  </button>
                )}
                <button 
                  className={`modal-btn secondary fav-btn ${isFavorite(currentMovie.id) ? "active" : ""}`}
                  onClick={() => isFavorite(currentMovie.id) ? removeFromFavorites(currentMovie.id) : addToFavorites(currentMovie)}
                >
                  <span>{isFavorite(currentMovie.id) ? "✓ FAVORITES" : "+ FAVORITES"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="netflix-pause-hero">
            <div className="netflix-hero-bg">
              {backdropPath ? (
                <img
                  src={`${IMG_BASE_BACKDROP}${backdropPath}`}
                  alt={title}
                  className="netflix-hero-backdrop-img"
                  onError={(event) => { event.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="netflix-hero-backdrop-placeholder" aria-label={title}>
                  <span>{title}</span>
                </div>
              )}
              <div className="netflix-hero-top-fade" />
              <div className="netflix-hero-gradient-overlay" />
              <div className="netflix-hero-bottom-fade" />
            </div>

            <div className="netflix-hero-content">
              {/* Netflix Red Brand Kicker */}
              <div className="hero-kicker-mmax">
                <img src={brandLogo} alt="MMAX" className="hero-kicker-mmax-logo" />
              </div>

              <div className="netflix-hero-title-area">
                {detailsLoading ? (
                  <div className="modal-title-placeholder" aria-hidden="true" />
                ) : (movieLogo && !logoError) ? (
                  <div className="modal-title-logo-wrap">
                    <img 
                      src={movieLogo} 
                      alt={title} 
                      className={`modal-title-logo ${logoLoaded ? "loaded" : "loading"}`} 
                      onLoad={() => setLogoLoaded(true)}
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  <h1 className="modal-title">{title}</h1>
                )}
              </div>

              <div className="modal-meta">
                <span className="modal-rating-pill">{votePercent}% Match</span>
                <span className="modal-year">{year}</span>
                <span className="modal-maturity-dynamic">{getRating()}</span>
                <span className="modal-quality">4K Ultra HD</span>
                {(fullDetails?.runtime || fullDetails?.number_of_seasons) && (
                  <span className="modal-duration">
                    {isTV 
                      ? `${fullDetails.number_of_seasons} Season${fullDetails.number_of_seasons > 1 ? 's' : ''}`
                      : `${Math.floor(fullDetails.runtime / 60)}h ${fullDetails.runtime % 60}m`
                    }
                  </span>
                )}
                {mediaTimestamps?.credits && (
                  <span className="modal-meta-credits-pill" title={`Verified End Credits timestamp (${mediaTimestamps.source})`}>
                    🎬 Credits: {mediaTimestamps.credits.formattedStart}
                  </span>
                )}
                {mediaTimestamps?.intro && (
                  <span className="modal-meta-intro-pill" title={`Verified Intro timestamp (${mediaTimestamps.source})`}>
                    ⚡ Intro: {mediaTimestamps.intro.formattedStart}
                  </span>
                )}
              </div>

              {/* Row 1: Action Buttons on one line */}
              <div className="modal-actions">
                <button className="modal-btn play liquid-btn-primary" onClick={handlePlayStart}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 4l15 8-15 8V4z" /></svg>
                  <span>WATCH NOW</span>
                </button>
                
                {isAnime && (
                  <div className="anime-preference-toggle glass-btn" role="group" aria-label="Audio language preference">
                    <button 
                      type="button"
                      className={`pref-btn ${animeAudio === 'dub' ? 'active' : ''}`}
                      onClick={() => handleAudioChange('dub')}
                      title="English / Multi-language dubbed audio"
                    >
                      DUB
                    </button>
                    <button 
                      type="button"
                      className={`pref-btn ${animeAudio === 'sub' ? 'active' : ''}`}
                      onClick={() => handleAudioChange('sub')}
                      title="Japanese audio with English subtitles"
                    >
                      SUB
                    </button>
                  </div>
                )}

                <div className="modal-secondary-actions">
                  {trailerKey && (
                    <button 
                      className="modal-btn secondary trailer-btn"
                      onClick={() => {
                        setPlayTrailerFirst(true);
                        setIsPlaying(true);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z"/>
                      </svg>
                      <span>TRAILER</span>
                    </button>
                  )}

                  <button 
                    className={`modal-btn secondary fav-btn ${isFavorite(currentMovie.id) ? "active" : ""}`}
                    onClick={() => isFavorite(currentMovie.id) ? removeFromFavorites(currentMovie.id) : addToFavorites(currentMovie)}
                  >
                    <span>{isFavorite(currentMovie.id) ? "✓ FAVORITES" : "+ FAVORITES"}</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Server Picker & Social Links */}
              <div className="modal-sub-actions">
                <div className="modal-server-picker">
                  <button
                    type="button"
                    className="modal-server-trigger"
                    onClick={() => setIsServerOpen(!isServerOpen)}
                    aria-expanded={isServerOpen}
                    aria-haspopup="listbox"
                  >
                    <span className="server-trigger-label">SERVER</span>
                    <span className="server-name-display">{currentSource.name}</span>
                    <span aria-hidden="true">▾</span>
                  </button>
                  {isServerOpen && (
                    <div className="modal-server-menu" role="listbox" aria-label="Choose streaming server">
                      {SOURCES.map((source, index) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={currentSourceIndex === index}
                          key={source.id}
                          className={`modal-server-option ${currentSourceIndex === index ? "active" : ""}`}
                          onClick={() => {
                            setCurrentSourceIndex(index);
                            setIsServerOpen(false);
                          }}
                        >
                          {source.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="social-links-premium">
                  {fullDetails?.external_ids?.instagram_id && (
                    <a href={`https://instagram.com/${fullDetails.external_ids.instagram_id}`} target="_blank" rel="noreferrer" className="social-btn-liquid" title="Instagram">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                  )}
                  {fullDetails?.external_ids?.twitter_id && (
                    <a href={`https://twitter.com/${fullDetails.external_ids.twitter_id}`} target="_blank" rel="noreferrer" className="social-btn-liquid" title="Twitter/X">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {fullDetails?.external_ids?.imdb_id && (
                    <a href={`https://www.imdb.com/title/${fullDetails.external_ids.imdb_id}`} target="_blank" rel="noreferrer" className="social-btn-liquid" title="IMDb">
                      <span style={{ fontWeight: 900, fontSize: '0.8rem' }}>IMDb</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <p className="modal-overview">{currentMovie.overview}</p>

              {/* Cast & Crew Details */}
              <div className="modal-extra">
                <p><span>Starring:</span> {fullDetails?.credits?.cast?.slice(0, 5).map(c => c.name).join(", ") || "Loading..."}</p>
                {director && <p><span>Director:</span> {director}</p>}
                {creator && <p><span>Creator:</span> {creator}</p>}
                <p><span>Genres:</span> {fullDetails?.genres?.map(g => g.name).join(", ") || "Loading..."}</p>
                <p><span>Language:</span> {fullDetails?.spoken_languages?.map(l => l.english_name).join(", ") || currentMovie.original_language?.toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="modal-details-center">
          {isPlaying && (
            <div className="player-details-summary">
              <p className="modal-overview">{currentMovie.overview}</p>
              <div className="modal-extra">
                <p><span>Starring:</span> {fullDetails?.credits?.cast?.slice(0, 5).map(c => c.name).join(", ") || "Loading..."}</p>
                {director && <p><span>Director:</span> {director}</p>}
                {creator && <p><span>Creator:</span> {creator}</p>}
                <p><span>Genres:</span> {fullDetails?.genres?.map(g => g.name).join(", ") || "Loading..."}</p>
              </div>
            </div>
          )}

          {/* Netflix-Style Production Companies Grid */}
          {fullDetails?.production_companies && fullDetails.production_companies.length > 0 && (
            <div className="production-studios-section">
              <span className="production-studios-title">PRODUCED BY</span>
              <div className="production-studios-grid">
                {fullDetails.production_companies.map((company) => (
                  <div key={company.id} className="studio-card" title={company.name}>
                    {company.logo_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                        alt={company.name}
                        className="studio-logo-img"
                      />
                    ) : (
                      <span className="studio-name-text">{company.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isTV && (
            <div className="episodes-section">
              <div className="episodes-header">
                <div className="episodes-header-left">
                  <h2 className="episodes-title">
                    Episodes
                    {episodes.length > 0 && (
                      <span className="episodes-count-badge">{episodes.length}</span>
                    )}
                  </h2>
                  {(fullDetails?.number_of_seasons || 1) > 1 && (
                    <div className="season-custom-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button className={`season-trigger ${isSeasonOpen ? "open" : ""}`} onClick={() => setIsSeasonOpen(!isSeasonOpen)}>
                        <span>Season {selectedSeason}</span>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z" /></svg>
                      </button>
                      {isSeasonOpen && fullDetails && (
                        <div className="season-menu liquid-menu">
                          {[...Array(fullDetails.number_of_seasons)].map((_, i) => (
                            <div key={i + 1} className={`season-option ${selectedSeason === i + 1 ? "active" : ""}`} onClick={() => { setSelectedSeason(i + 1); setIsSeasonOpen(false); setSelectedEpisode(1); }}>
                              Season {i + 1}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {episodes.length > 0 && (
                  <div className="episodes-header-right">
                    <div className="episodes-search-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" className="search-icon">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search or Ep #..."
                        value={episodeSearchQuery}
                        onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                        className="episodes-search-input"
                        aria-label="Search episodes"
                      />
                      {episodeSearchQuery && (
                        <button
                          type="button"
                          className="episodes-search-clear"
                          onClick={() => setEpisodeSearchQuery("")}
                          title="Clear search"
                          aria-label="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="episodes-view-toggle">
                      <button
                        type="button"
                        className={`view-toggle-btn ${episodeViewMode === "grid" ? "active" : ""}`}
                        onClick={() => setEpisodeViewMode("grid")}
                        title="Grid View (Compact Tiles)"
                        aria-label="Grid View"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <rect x="3" y="3" width="7" height="7" rx="1.5" />
                          <rect x="14" y="3" width="7" height="7" rx="1.5" />
                          <rect x="3" y="14" width="7" height="7" rx="1.5" />
                          <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`view-toggle-btn ${episodeViewMode === "list" ? "active" : ""}`}
                        onClick={() => setEpisodeViewMode("list")}
                        title="List View (Detailed Accordion)"
                        aria-label="List View"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Tabs (when total episodes > 25 and not actively searching) */}
              {episodeBatches.length > 1 && !episodeSearchQuery && (
                <div className="episodes-batch-nav">
                  <div className="batch-tabs-scroll-wrap">
                    {episodeBatches.map((batch) => (
                      <button
                        key={batch.index}
                        type="button"
                        className={`batch-tab-btn ${activeBatchIndex === batch.index ? "active" : ""} ${batch.containsSelected ? "has-current" : ""}`}
                        onClick={() => setActiveBatchIndex(batch.index)}
                      >
                        {batch.containsSelected && <span className="batch-now-playing-dot" title="Current Episode" />}
                        <span>{batch.label}</span>
                      </button>
                    ))}
                  </div>

                  {!episodeBatches[activeBatchIndex]?.containsSelected && episodes.some((e) => e.episode_number === selectedEpisode) && (
                    <button
                      type="button"
                      className="batch-jump-current-btn"
                      onClick={() => {
                        const currentIdx = episodes.findIndex((e) => e.episode_number === selectedEpisode);
                        if (currentIdx !== -1) {
                          setActiveBatchIndex(Math.floor(currentIdx / EPISODES_PER_BATCH));
                        }
                      }}
                      title="Jump to current playing episode batch"
                    >
                      <span className="batch-now-playing-dot" />
                      Jump to Ep {selectedEpisode}
                    </button>
                  )}
                </div>
              )}

              {/* Search active results feedback */}
              {episodeSearchQuery && (
                <div className="episodes-search-feedback">
                  <span>Found {displayedEpisodes.length} {displayedEpisodes.length === 1 ? "episode" : "episodes"} for &ldquo;{episodeSearchQuery}&rdquo;</span>
                  <button type="button" onClick={() => setEpisodeSearchQuery("")} className="clear-search-pill">
                    Clear filter
                  </button>
                </div>
              )}

              {loadingEpisodes ? (
                <div className="episodes-loading">Loading episodes...</div>
              ) : episodes.length === 0 ? (
                <div className="episodes-loading">
                  {isAnime ? "Anime episodes are currently unavailable." : "Episodes are currently unavailable."}
                </div>
              ) : displayedEpisodes.length === 0 ? (
                <div className="episodes-no-results">
                  <p>No episodes match your search &ldquo;{episodeSearchQuery}&rdquo;</p>
                  <button type="button" className="episodes-clear-search-btn" onClick={() => setEpisodeSearchQuery("")}>
                    Reset Search
                  </button>
                </div>
              ) : episodeViewMode === "grid" ? (
                /* Compact Grid / Tile View (Matching Video Card Reference) */
                <div className="episodes-grid-view">
                  {displayedEpisodes.map((ep) => {
                    const isCurrent = selectedEpisode === ep.episode_number;
                    const durationText = ep.runtime ? `${ep.runtime}:00` : "24:00";
                    const animeEpMatch = isAnime ? hiAnimeEpisodes.find((h) => h.episodeNumber === ep.episode_number) : null;
                    const epTitle = (ep.name && ep.name !== `Episode ${ep.episode_number}`) ? ep.name : (animeEpMatch?.title || ep.name || `Episode ${ep.episode_number}`);
                    const kickerText = currentMovie.name || currentMovie.title 
                      ? `${(currentMovie.name || currentMovie.title).toUpperCase()} • EP ${ep.episode_number}`
                      : `EPISODE ${ep.episode_number}`;

                    return (
                      <div
                        key={ep.id || ep.episode_number}
                        className={`episode-grid-card ${isCurrent ? "playing" : ""}`}
                        onClick={() => handleEpisodeSelect(ep.episode_number)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleEpisodeSelect(ep.episode_number);
                          }
                        }}
                        aria-label={`Play Episode ${ep.episode_number}: ${epTitle}`}
                      >
                        <div className="episode-grid-thumb-wrap">
                          <img
                            src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : `${IMG_BASE_BACKDROP}${currentMovie.backdrop_path}`}
                            alt={epTitle}
                            className="episode-grid-thumb"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = `${IMG_BASE_BACKDROP}${currentMovie.backdrop_path}`;
                            }}
                          />

                          {/* Netflix Top-10 Giant Outlined Rank Number */}
                          <div className="netflix-episode-rank-num" aria-hidden="true">
                            {ep.episode_number}
                          </div>

                          <div className="episode-card-scrim" />

                          {isCurrent && (
                            <div className="episode-grid-now-playing-tag">
                              <span className="playing-pulse-indicator" />
                              NOW PLAYING
                            </div>
                          )}

                          {/* Card Overlay: Red Kicker, White Play Icon + Bold Title, and Timestamp Badge */}
                          <div className="episode-card-overlay">
                            <div className="episode-card-meta-left">
                              <span className="episode-card-kicker">
                                {kickerText}
                                {animeEpMatch?.isFiller && <span className="anime-filler-badge">FILLER</span>}
                                {animeEpMatch?.dub && <span className="popover-badge dub" style={{ marginLeft: 6, padding: '2px 6px', fontSize: '0.65rem' }}>DUB</span>}
                              </span>
                              <div className="episode-card-main-row">
                                <div className="episode-card-play-glyph">
                                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                                <h4 className="episode-card-title-text" title={epTitle}>
                                  {epTitle}
                                </h4>
                              </div>
                            </div>

                            <div className="episode-card-time-badge">
                              {durationText}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Detailed Accordion List View */
                <div className="episodes-list">
                  {displayedEpisodes.map((ep) => {
                    const animeEpMatch = isAnime ? hiAnimeEpisodes.find((h) => h.episodeNumber === ep.episode_number) : null;
                    const epTitle = (ep.name && ep.name !== `Episode ${ep.episode_number}`) ? ep.name : (animeEpMatch?.title || ep.name || `Episode ${ep.episode_number}`);
                    return (
                      <div
                        key={ep.id}
                        className={`episode-card-accordion ${expandedEpisode === ep.episode_number ? "expanded" : ""} ${selectedEpisode === ep.episode_number ? "playing" : ""}`}
                        onClick={() => {
                          if (expandedEpisode === ep.episode_number) handleEpisodeSelect(ep.episode_number);
                          else setExpandedEpisode(ep.episode_number);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            if (expandedEpisode === ep.episode_number) handleEpisodeSelect(ep.episode_number);
                            else setExpandedEpisode(ep.episode_number);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${epTitle}, episode ${ep.episode_number}`}
                      >
                        <div className="episode-header-row">
                          <div className="episode-number">{ep.episode_number}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                            <h3 className="episode-name" style={{ margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{epTitle}</h3>
                            {animeEpMatch?.isFiller && <span className="anime-filler-badge">FILLER</span>}
                            {animeEpMatch?.dub && <span className="popover-badge dub" style={{ marginLeft: 4, padding: "2px 6px", fontSize: "0.65rem" }}>DUB</span>}
                          </div>
                          <span className="episode-runtime">{ep.runtime ? `${ep.runtime}m` : "24m"}</span>
                        </div>
                      <div className="episode-expandable-content">
                        <div className="episode-body">
                          <div className="episode-thumbnail-wrap">
                            <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : `${IMG_BASE_BACKDROP}${currentMovie.backdrop_path}`} alt={ep.name} className="episode-thumbnail" />
                            <div className="episode-play-overlay"><svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M8 5v14l11-7z" /></svg></div>
                          </div>
                          <div className="episode-details">
                            <p className="episode-desc">{ep.overview || "No description available."}</p>
                            <button className="episode-play-inline-btn liquid-btn" onClick={(e) => { e.stopPropagation(); handleEpisodeSelect(ep.episode_number); }}>
                              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
                              PLAY NOW
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              {/* Batch Pagination Footer */}
              {episodeBatches.length > 1 && !episodeSearchQuery && (
                <div className="episodes-batch-footer">
                  <button
                    type="button"
                    className="batch-nav-step-btn prev"
                    disabled={activeBatchIndex === 0}
                    onClick={() => setActiveBatchIndex((prev) => Math.max(0, prev - 1))}
                  >
                    ← Previous Batch
                  </button>
                  <span className="batch-page-indicator">
                    Batch {activeBatchIndex + 1} of {episodeBatches.length} &bull; Episodes {episodeBatches[activeBatchIndex]?.label}
                  </span>
                  <button
                    type="button"
                    className="batch-nav-step-btn next"
                    disabled={activeBatchIndex >= episodeBatches.length - 1}
                    onClick={() => setActiveBatchIndex((prev) => Math.min(episodeBatches.length - 1, prev + 1))}
                  >
                    Next Batch →
                  </button>
                </div>
              )}
            </div>
          )}

                    <div className="modal-tech-specs liquid-glass">
            <div className="tech-item">
              <span className="tech-label">Status</span>
              <span className="tech-value">{fullDetails?.status || "Released"}</span>
            </div>
            {!isTV && (
              <>
                <div className="tech-item">
                  <span className="tech-label">Budget</span>
                  <span className="tech-value">{fullDetails?.budget && fullDetails.budget > 0 ? "$" + Number(fullDetails.budget).toLocaleString() : "N/A"}</span>
                </div>
                <div className="tech-item">
                  <span className="tech-label">Revenue</span>
                  <span className="tech-value">{fullDetails?.revenue && fullDetails.revenue > 0 ? "$" + Number(fullDetails.revenue).toLocaleString() : "N/A"}</span>
                </div>
              </>
            )}
            <div className="tech-item">
              <span className="tech-label">Runtime</span>
              <span className="tech-value">
                {fullDetails?.runtime
                  ? String(fullDetails.runtime) + "m"
                  : fullDetails?.episode_run_time?.[0]
                  ? String(fullDetails.episode_run_time[0]) + "m"
                  : isTV && episodes[0]?.runtime
                  ? String(episodes[0].runtime) + "m"
                  : isTV && fullDetails?.number_of_seasons
                  ? String(fullDetails.number_of_seasons) + (fullDetails.number_of_seasons > 1 ? " Seasons" : " Season")
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="cast-section">
            <h2 className="section-title-premium">Top Cast</h2>
            <div className="cast-scroll-wrap">
              {fullDetails?.credits?.cast?.slice(0, 10).map((person) => (
                <div key={person.id} className="cast-card-premium">
                  <div className="cast-img-wrap">
                    <img
                      src={person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : "https://via.placeholder.com/185x278?text=No+Photo"}
                      alt={person.name}
                    />
                  </div>
                  <div className="cast-info">
                    <div className="cast-name">{person.name}</div>
                    <div className="cast-character">{person.character}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reviews-section">
            <h2 className="section-title-premium">User Reviews</h2>
            <div className="reviews-list">
              {fullDetails?.reviews?.results?.slice(0, 3).map((review) => (
                <div key={review.id} className="review-card-liquid">
                  <div className="review-header">
                    <span className="review-author">{review.author}</span>
                    <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="review-content">
                    {review.content.length > 300 ? review.content.substring(0, 300) + "..." : review.content}
                  </p>
                </div>
              )) || <p className="no-reviews">No reviews yet.</p>}
            </div>
          </div>

          <div className="related-section">
            <h2 className="related-title">More Like This</h2>
            {loadingSimilar ? (
              <div className="related-loading">Loading...</div>
            ) : (
              <div className="related-grid">
                {similarContent.map((item) => {
                  const posterUrl = item.poster_path
                    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                    : item.backdrop_path
                    ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}`
                    : null;
                  const itemTitle = item.title || item.name || "Untitled";
                  const itemYear = (item.release_date || item.first_air_date)?.split("-")[0] || "";
                  const itemRating = Math.round((item.vote_average || 0) * 10);

                  return (
                    <div
                      key={item.id}
                      className="related-card"
                      onClick={() => {
                        setCurrentMovie(item);
                        setIsPlaying(false);
                        setEpisodes([]);
                        setSelectedSeason(1);
                        setSelectedEpisode(1);
                        modalOverlayRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <div className="related-poster-wrap">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={itemTitle}
                            className="related-poster"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="related-poster-fallback">
                            <span>{itemTitle}</span>
                          </div>
                        )}
                        <div className="related-hover">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="related-info">
                        <h4 className="related-name" title={itemTitle}>{itemTitle}</h4>
                        <div className="related-meta">
                          <span className="related-year">{itemYear}</span>
                          <span className="related-rating">{itemRating}% Match</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MovieModal;
