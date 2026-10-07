import { Context } from 'hono';
import config from '../config/config';
import { validationError } from '../utils/errors';
import {
  Character,
  CharactersResponse,
  CdnCharactersResponse,
  extractCdnCharacters,
} from '../extractor/extractCharacters';
import { animeNumId } from '../services/zangetsu';

const PAGE_SIZE = 12;

const charactersController = async (c: Context): Promise<CharactersResponse> => {
  try {
    const id = c.req.param('id');
    const page = Number(c.req.query('page') || '1') || 1;

    if (!id) throw new validationError('id is required');

    const res = await fetch(
      `${config.cdnApi}/anime/${encodeURIComponent(animeNumId(id))}/characters`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as CdnCharactersResponse;

    const all = extractCdnCharacters(json);
    if (all.length < 1) throw new validationError('characters not found');

    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const response: Character[] = all.slice(start, start + PAGE_SIZE);

    return {
      pageInfo: {
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
      },
      response,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
    } else {
      console.log(err);
    }

    throw new validationError('characters not found');
  }
};

export default charactersController;
