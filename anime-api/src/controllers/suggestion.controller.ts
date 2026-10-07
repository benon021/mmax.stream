import { Context } from 'hono';
import { validationError } from '../utils/errors';
import {
  extractSuggestions,
  Suggestion,
  SuggestionAjaxResponse,
} from '../extractor/extractSuggestions';
import { axiosInstance } from '../services/axiosInstance';

const suggestionController = async (c: Context): Promise<Suggestion[]> => {
  const keyword = c.req.query('keyword') || null;

  if (!keyword) throw new validationError('query is required');

  const noSpaceKeyword = keyword.trim().replace(/\s+/g, '+');
  const endpoint = `/ajax/search?keyword=${encodeURIComponent(noSpaceKeyword)}`;

  const result = await axiosInstance(endpoint);

  if (!result.success || !result.data) {
    throw new validationError(result.message || 'suggestion not found');
  }

  const jsonData = JSON.parse(result.data) as SuggestionAjaxResponse;
  return extractSuggestions(jsonData);
};

export default suggestionController;
