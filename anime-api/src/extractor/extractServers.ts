import { buildEmbedUrl, ServerType } from '../services/zangetsu';

export interface ZangetsuServerJson {
  serverId?: string;
  serverName?: string;
  index?: number;
}

export interface ServerPayload {
  sub?: ZangetsuServerJson[];
  dub?: ZangetsuServerJson[];
}

export interface ServerEntry {
  serverName: string | null;
  serverId: string | null;
  iframe: string;
}

export interface ServersResponse {
  episodeId: string;
  type: ServerType;
  servers: ServerEntry[];
}

export const extractServers = (
  payload: ServerPayload,
  episodeId: string,
  type: ServerType,
  aniId?: string | null,
  malId?: string | null
): ServersResponse => {
  const list = (type === 'dub' ? payload.dub : payload.sub) || [];
  return {
    episodeId,
    type,
    servers: list.map(entry => ({
      serverName: entry.serverName || null,
      serverId: entry.serverId || null,
      iframe: buildEmbedUrl(entry.serverName || '', episodeId, type, aniId, malId),
    })),
  };
};
