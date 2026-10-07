import { Context } from 'hono';
import { validationError } from '../utils/errors';
import { extractServers, ServerPayload, ServersResponse } from '../extractor/extractServers';
import { ServerType, zangetsuAjax } from '../services/zangetsu';

const serversController = async (c: Context): Promise<ServersResponse> => {
  const episodeId = c.req.param('episodeId');

  if (!episodeId) throw new validationError('episodeId is required');

  const type = (c.req.query('type') || 'sub').toLowerCase();
  if (type !== 'sub' && type !== 'dub') {
    throw new validationError('type must be sub or dub');
  }
  const serverType = type as ServerType;

  const ani = c.req.query('ani') || null;
  const mal = c.req.query('mal') || null;

  const sub = serverType === 'sub' ? 1 : 0;
  const dub = serverType === 'dub' ? 1 : 0;

  let payload: ServerPayload;
  try {
    payload = await zangetsuAjax<ServerPayload>(
      `/ajax/server?episodeId=${encodeURIComponent(episodeId)}&sub=${sub}&dub=${dub}`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new validationError(message || 'make sure the episodeId is correct');
  }

  return extractServers(payload, episodeId, serverType, ani, mal);
};

export default serversController;
