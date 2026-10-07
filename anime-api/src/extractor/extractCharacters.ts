export interface Character {
  name: string | null;
  id: string | null;
  imageUrl: string | null;
  role: string | null;
  voiceActors: VoiceActor[];
}

export interface VoiceActor {
  name: string | null;
  id: string | null;
  imageUrl: string | null;
  cast?: string | null;
}

export interface CharactersResponse {
  pageInfo?: {
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
  };
  response: Character[];
}

export interface CdnCharacterJson {
  id?: string | number;
  slug?: string;
  name?: string | { full?: string; native?: string };
  image?: string | { jpg?: string };
  role?: string;
  voice_actors?: {
    id?: string | number;
    slug?: string;
    name?: string | { full?: string };
    image?: string | { jpg?: string };
    language?: string;
    cast?: string;
  }[];
}

export interface CdnCharactersResponse {
  anime_id?: number;
  total?: number;
  data?: CdnCharacterJson[];
}

const cdnName = (name: CdnCharacterJson['name']): string | null =>
  typeof name === 'string' ? name : name?.full || null;

const cdnImage = (image: CdnCharacterJson['image']): string | null =>
  typeof image === 'string' ? image : image?.jpg || null;

export const extractCdnCharacters = (json: CdnCharactersResponse): Character[] => {
  const items = Array.isArray(json.data) ? json.data : [];
  return items.map(item => ({
    name: cdnName(item.name),
    id: item.id !== undefined && item.id !== null ? `character:${item.id}` : null,
    imageUrl: cdnImage(item.image),
    role: item.role || null,
    voiceActors: (item.voice_actors || []).map(va => ({
      name: cdnName(va.name),
      id: va.id !== undefined && va.id !== null ? `people:${va.id}` : null,
      imageUrl: cdnImage(va.image),
      cast: va.language || va.cast || null,
    })),
  }));
};
