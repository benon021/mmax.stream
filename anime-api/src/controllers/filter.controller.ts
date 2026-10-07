import { Context } from 'hono';
import filterOptions, { genreNames } from '../utils/filter';
import { axiosInstance } from '../services/axiosInstance';
import { validationError } from '../utils/errors';
import {
  extractFilterResults,
  extractListPage,
  FilterAjaxResponse,
  ListPageResponse,
} from '../extractor/extractListpage';

const filterController = async (c: Context): Promise<ListPageResponse> => {
  const {
    keyword = null,
    sort = null,
    genres = null,
    type = null,
    status = null,
    rated = null,
    score = null,
    season = null,
    language = null,
    start_date = null,
    end_date = null,
    page = '1',
  } = c.req.query();

  if (keyword) {
    const noSpaceKeyword = keyword.trim().replace(/\s+/g, '+');
    const pageNum = Number(page) || 1;
    const url =
      pageNum > 1
        ? `/search?keyword=${encodeURIComponent(noSpaceKeyword)}&page=${pageNum}`
        : `/search?keyword=${encodeURIComponent(noSpaceKeyword)}`;
    const result = await axiosInstance(url);
    if (!result.success || !result.data)
      throw new validationError(result.message || 'something went wrong will queries');
    return extractListPage(result.data);
  }

  const params = new URLSearchParams();

  if (sort && filterOptions.sort.includes(sort)) params.set('sort', sort);
  if (type && filterOptions.type.includes(type) && type !== 'all') params.set('type', type);
  if (status && filterOptions.status.includes(status) && status !== 'all')
    params.set('status', status);
  if (rated && filterOptions.rated.includes(rated) && rated !== 'all') params.set('rated', rated);
  if (score && filterOptions.score.includes(score) && score !== 'all') params.set('score', score);
  if (season && filterOptions.season.includes(season) && season !== 'all')
    params.set('season', season);
  if (language && filterOptions.language.includes(language) && language !== 'all')
    params.set('language', language);

  if (genres) {
    const names = genres
      .split(',')
      .map(g => genreNames[g.trim().toLowerCase().replaceAll(' ', '-').replaceAll('_', '-')])
      .filter((n): n is string => typeof n === 'string');
    if (names.length > 0) params.set('genres', names.join(','));
  }

  const setDate = (value: string, prefix: 's' | 'e') => {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return;
    params.set(`${prefix}y`, String(y));
    params.set(`${prefix}m`, String(m));
    params.set(`${prefix}d`, String(d));
  };
  if (start_date) setDate(start_date, 's');
  if (end_date) setDate(end_date, 'e');

  const pageNum = Number(page) || 1;
  params.set('page', String(pageNum));

  const result = await axiosInstance(`/ajax/filter?${params.toString()}`);

  console.log(result.message);

  if (!result.success || !result.data)
    throw new validationError(result.message || 'something went wrong will queries');

  return extractFilterResults(JSON.parse(result.data) as FilterAjaxResponse);
};

export default filterController;
