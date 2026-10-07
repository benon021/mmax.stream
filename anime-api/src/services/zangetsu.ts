import config from '../config/config';

const TOKEN_RE = /window\.AJAX_TOKEN\s*=\s*"([^"]+)"/;
const TIMEOUT = 15000;

const ua = (config.headers as Record<string, string>)?.['User-Agent'] || 'Mozilla/5.0';

const withTimeout = () => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  return { signal: controller.signal, done: () => clearTimeout(id) };
};

export const zangetsuAjax = async <T>(
  ajaxPath: string,
  refererPath: string = '/home'
): Promise<T> => {
  const page = withTimeout();
  const pageRes = await fetch(`${config.baseurl}${refererPath}`, {
    headers: {
      'User-Agent': ua,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: `${config.baseurl}/home`,
    },
    signal: page.signal,
  });
  page.done();

  if (!pageRes.ok) throw new Error(`Session bootstrap failed: HTTP ${pageRes.status}`);

  const html = await pageRes.text();
  const token = html.match(TOKEN_RE)?.[1];
  if (!token) throw new Error('Session bootstrap failed: no page token found');

  const rawCookies =
    typeof (pageRes.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie ===
    'function'
      ? (pageRes.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : [];
  const cookie = rawCookies.map(c => c.split(';')[0].trim()).join('; ');

  const ajax = withTimeout();
  const res = await fetch(`${config.baseurl}${ajaxPath}`, {
    headers: {
      'User-Agent': ua,
      Accept: 'application/json',
      Referer: `${config.baseurl}${refererPath}`,
      'X-Requested-With': 'XMLHttpRequest',
      'X-Page-Token': token,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal: ajax.signal,
  });
  ajax.done();

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return (await res.json()) as T;
};

export const animeNumId = (id: string): string => id.split('-').at(-1) || id;

export type ServerType = 'sub' | 'dub';

export const buildEmbedUrl = (
  serverName: string,
  episodeId: string,
  type: ServerType,
  aniId?: string | null,
  malId?: string | null
): string => {
  if (serverName === 's-2') {
    return `${config.embedCdn}/embed/hd-1/${episodeId}/${type}?k=1&autoPlay=0&skipIntro=0&skipOutro=0`;
  }
  if (serverName === 's-3') {
    const base = aniId
      ? `${config.embedCdn}/embed/hd-2/ani/${aniId}/${type}`
      : malId
        ? `${config.embedCdn}/embed/hd-2/mal/${malId}/${type}`
        : `${config.embedCdn}/embed/hd-2/${episodeId}/${type}`;
    return `${base}?k=1&autoPlay=0&skipIntro=0&skipOutro=0`;
  }
  const base = aniId
    ? `${config.flixera}/embed/ani/${aniId}/${type}`
    : malId
      ? `${config.flixera}/embed/mal/${malId}/${type}`
      : `${config.flixera}/embed/ani/${episodeId}/${type}`;
  return `${base}?autoplay=0&skipintro=0&skipoutro=0`;
};
