import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Context } from 'hono';
import homepageController from '../../../../src/controllers/homepage.controller';
import detailpageController from '../../../../src/controllers/detailpage.controller';
import searchController from '../../../../src/controllers/search.controller';
import episodesController from '../../../../src/controllers/episodes.controller';
import charactersController from '../../../../src/controllers/characters.controller';
import characterDetailController from '../../../../src/controllers/characterDetail.controller';
import listpageController from '../../../../src/controllers/listpage.controller';
import topSearchController from '../../../../src/controllers/topSearch.controller';
import schedulesController from '../../../../src/controllers/schedules.controller';
import newsController from '../../../../src/controllers/news.controller';
import suggestionController from '../../../../src/controllers/suggestion.controller';
import nextEpisodeScheduleController from '../../../../src/controllers/nextEpisodeSchedule.controller';
import randomController from '../../../../src/controllers/random.controller';
import filterController from '../../../../src/controllers/filter.controller';
import allGenresController from '../../../../src/controllers/allGenres.controller';
import serversController from '../../../../src/controllers/servers.controller';
import { mockHtmlData } from '../../data/mocks';

// Mock global fetch since axiosInstance uses it
const mockFetch = jest.fn<typeof global.fetch>();
global.fetch = mockFetch as unknown as typeof global.fetch;

const createMockContext = (
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) => {
  return {
    req: {
      param: (name?: string) => (name ? params[name] : params),
      query: (name?: string) => (name ? query[name] : query),
    },
    json: jest.fn((data: unknown) => data),
  } as unknown as Context;
};

describe('Controllers Comprehensive Suite (Jest)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSuccess = (data: string) => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(data),
      headers: new Map(),
    } as unknown as Response);
  };

  const mockJson = (data: unknown) => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
      headers: new Map(),
    } as unknown as Response);
  };

  it('homepageController should return homepage data', async () => {
    mockSuccess(mockHtmlData.homepage);
    const result = (await homepageController()) as unknown as Record<string, unknown>;
    expect(result.spotlight).toBeDefined();
  });

  it('detailpageController should return anime details', async () => {
    mockSuccess(mockHtmlData.detail);
    const result = await detailpageController(createMockContext({ id: '123' }));
    expect(result.title).toBe('Detail Anime');
  });

  it('searchController should return search results', async () => {
    mockSuccess(mockHtmlData.search);
    const result = await searchController(createMockContext({}, { keyword: 'one' }));
    expect(result.response).toHaveLength(1);
  });

  const mockZangetsuAjax = (ajaxPayload: unknown) => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<script>window.AJAX_TOKEN = "tok";</script>'),
        headers: { getSetCookie: () => [] as string[] },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(ajaxPayload),
      } as unknown as Response);
  };

  it('episodesController should return episodes', async () => {
    mockZangetsuAjax({ success: true, episodes: mockHtmlData.episodes.episodes });
    const result = await episodesController(createMockContext({ id: 'one-piece-12' }));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Episode 1');
  });

  it('serversController should return iframe embeds', async () => {
    mockZangetsuAjax(mockHtmlData.serversJson);
    const result = await serversController(createMockContext({ episodeId: '1' }, { type: 'sub' }));
    expect(result.servers).toHaveLength(2);
    expect(result.servers[0].iframe).toContain('flixera.co/embed');
    expect(result.servers[1].iframe).toContain('/embed/hd-1/1/sub');
  });

  it('charactersController should return characters', async () => {
    mockJson(mockHtmlData.charactersJson);
    const result = await charactersController(createMockContext({ id: 'one-piece-12' }));
    expect(result.response).toHaveLength(1);
    expect(result.response[0].name).toBe('Character Name');
  });

  it('characterDetailController should return character details', async () => {
    mockSuccess(mockHtmlData.characterDetail);
    const result = await characterDetailController(createMockContext({ id: '123' }));
    expect(result.name).toBe('Character Full Name');
  });

  it('listpageController should return anime list', async () => {
    mockSuccess(mockHtmlData.search);
    const result = await listpageController(createMockContext({ query: 'most-popular' }));
    expect(result.response).toBeDefined();
  });

  it('topSearchController should return top search items', async () => {
    mockSuccess(mockHtmlData.topSearch);
    const result = await topSearchController(createMockContext());
    expect(result).toHaveLength(3);
  });

  it('schedulesController should return schedules', async () => {
    mockFetch.mockImplementation((async (url: string | URL | Request) => {
      const date = String(url).match(/date=([\d-]+)/)?.[1] || '2026-10-06';
      return {
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              [date]: [{ id: 1, slug: 'a-1', title: 'Scheduled Anime', episode: 5, time: '10:00' }],
            })
          ),
        headers: new Map(),
      } as unknown as Response;
    }) as typeof global.fetch);
    const result = await schedulesController(createMockContext());
    expect(result).toBeDefined();
    expect(Object.keys(result)).toHaveLength(7);
  });

  it('newsController should return news items', async () => {
    mockSuccess(mockHtmlData.news);
    const result = await newsController(createMockContext());
    expect(result.news).toHaveLength(1);
  });

  it('suggestionController should return suggestions', async () => {
    mockSuccess(JSON.stringify(mockHtmlData.suggestions));
    const result = await suggestionController(createMockContext({}, { keyword: 'suggest' }));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('S1');
  });

  it('nextEpisodeScheduleController should return next episode info', async () => {
    mockSuccess(JSON.stringify(mockHtmlData.scheduleNext));
    const result = await nextEpisodeScheduleController(createMockContext({ id: 'one-piece-12' }));
    expect(result.episode).toBe(1181);
  });

  it('filterController should handle complex queries', async () => {
    mockSuccess(mockHtmlData.search);
    const result = await filterController(createMockContext({}, { keyword: 'one' }));
    expect(result.response).toBeDefined();
  });

  it('filterController should use ajax api without keyword', async () => {
    mockSuccess(
      JSON.stringify({
        success: true,
        data: [
          {
            slug: 'filtered-1',
            titles: { english: 'Filtered Anime', native: 'Filt' },
            type: 'TV',
            duration_min: 24,
            episodes_count: 12,
            sub_count: 12,
            dub_count: 0,
            images: { poster: 'https://example.com/f.jpg' },
          },
        ],
        page: 1,
        pages: 3,
        total: 30,
      })
    );
    const result = await filterController(createMockContext({}, { type: 'tv', genres: 'action' }));
    expect(result.response).toHaveLength(1);
    expect(result.response[0].title).toBe('Filtered Anime');
    expect(result.pageInfo.totalPages).toBe(3);
  });

  it('allGenresController should return all genres', async () => {
    mockSuccess(mockHtmlData.homepage);
    const result = await allGenresController();
    expect(result).toBeDefined();
  });

  it('randomController should return random anime', async () => {
    mockSuccess(mockHtmlData.search);
    const result = await randomController(createMockContext());
    expect(result).toBeDefined();
  });
});
