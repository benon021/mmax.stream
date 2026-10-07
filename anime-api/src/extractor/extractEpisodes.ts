export interface EpisodeTitles {
  en: string | null;
  romaji: string | null;
  ja: string | null;
}

export interface Episode {
  title: string | null;
  alternativeTitle: string | null;
  id: string | null;
  isFiller: boolean;
  episodeNumber: number;
  sub: boolean;
  dub: boolean;
  embedId: string | null;
  aniId: string | null;
  malId: string | null;
}

export interface ZangetsuEpisodeJson {
  id?: string | number;
  number?: number;
  titles?: { en?: string; romaji?: string; ja?: string };
  title?: string | null;
  alternativeTitle?: string | null;
  sub?: boolean;
  dub?: boolean;
  embed_id?: string | number;
  ani?: string;
  mal?: string;
  filler?: boolean;
}

export const extractEpisodes = (episodes: ZangetsuEpisodeJson[]): Episode[] => {
  if (!Array.isArray(episodes)) return [];
  return episodes.map((ep, i) => {
    const num = typeof ep.number === 'number' ? ep.number : i + 1;
    const title = ep.titles?.en || (typeof ep.title === 'string' ? ep.title : null) || null;
    const alternativeTitle =
      ep.titles?.romaji ||
      ep.titles?.ja ||
      (typeof ep.alternativeTitle === 'string' ? ep.alternativeTitle : null) ||
      null;
    return {
      title,
      alternativeTitle,
      id: ep.id !== undefined && ep.id !== null ? String(ep.id) : null,
      isFiller: Boolean(ep.filler),
      episodeNumber: num,
      sub: Boolean(ep.sub),
      dub: Boolean(ep.dub),
      embedId: ep.embed_id !== undefined && ep.embed_id !== null ? String(ep.embed_id) : null,
      aniId: ep.ani || null,
      malId: ep.mal || null,
    };
  });
};
