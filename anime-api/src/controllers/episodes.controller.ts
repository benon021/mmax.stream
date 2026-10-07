import { Context } from 'hono';
import { validationError } from '../utils/errors';
import { extractEpisodes, Episode, ZangetsuEpisodeJson } from '../extractor/extractEpisodes';
import { animeNumId, zangetsuAjax } from '../services/zangetsu';

interface EpisodesAjaxResponse {
  success: boolean;
  episodes: ZangetsuEpisodeJson[];
}

const episodesController = async (c: Context): Promise<Episode[]> => {
  const id = c.req.param('id');

  if (!id) throw new validationError('id is required');

  let data: EpisodesAjaxResponse;
  try {
    data = await zangetsuAjax<EpisodesAjaxResponse>(
      `/ajax/episodes?animeId=${encodeURIComponent(animeNumId(id))}`,
      `/watch/${id}?ep=1`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new validationError(message || 'make sure the id is correct', {
      validIdEX: 'one-piece-12',
    });
  }

  if (!data.success || !Array.isArray(data.episodes)) {
    throw new validationError('make sure the id is correct', { validIdEX: 'one-piece-12' });
  }

  return extractEpisodes(data.episodes);
};

export default episodesController;
