import { Context } from 'hono';
import {
  extractNextEpisodeSchedule,
  NextEpisodeSchedule,
  NextEpisodeScheduleJson,
} from '../extractor/extractNextEpisodeSchedule';
import { axiosInstance } from '../services/axiosInstance';
import { validationError } from '../utils/errors';
import { animeNumId } from '../services/zangetsu';

const nextEpisodeSchaduleController = async (c: Context): Promise<NextEpisodeSchedule> => {
  const id = c.req.param('id');

  if (!id) throw new validationError('id is required');

  const data = await axiosInstance(`/ajax/schedule?animeId=${encodeURIComponent(animeNumId(id))}`);

  const raw = 'data' in data ? data.data : null;

  if (!data.success || !raw)
    throw new validationError(('message' in data && data.message) || 'make sure id is correct');

  const json =
    typeof raw === 'string'
      ? (JSON.parse(raw) as NextEpisodeScheduleJson)
      : (raw as NextEpisodeScheduleJson);

  const response = extractNextEpisodeSchedule(json);

  if (!response) throw new validationError('no upcoming episode found for this anime');

  return response;
};

export default nextEpisodeSchaduleController;
