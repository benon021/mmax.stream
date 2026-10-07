import { Context } from 'hono';
import { validationError } from '../utils/errors';
import {
  extractSchedule,
  ScheduledAnime,
  ZangetsuScheduleJson,
} from '../extractor/extractSchedule';
import { axiosInstance } from '../services/axiosInstance';

export interface ScheduleResponse {
  [date: string]: ScheduledAnime[];
}

async function schedulesController(c: Context): Promise<ScheduleResponse> {
  const today = new Date();
  const dateParam = c.req.query('date');

  let startDate = today;
  if (dateParam) {
    const [year, month, day] = dateParam.split('-').map(Number);
    startDate = new Date(year, month - 1, day);
    if (isNaN(startDate.getTime())) {
      throw new validationError('Invalid date format. Use YYYY-MM-DD');
    }
  }

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  try {
    const promises = dates.map(async date => {
      try {
        const result = await axiosInstance(`/ajax/schedules?date=${date}`);

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch');
        }

        const jsonData = JSON.parse(result.data) as Record<string, unknown>;
        const byData = jsonData.data as Record<string, unknown> | undefined;
        const items = (jsonData[date] || byData?.[date] || []) as ZangetsuScheduleJson[];
        return {
          date,
          shows: extractSchedule(items),
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Failed to fetch schedule for ${date}: ${errorMessage}`);
        return {
          date,
          shows: [] as ScheduledAnime[],
          error: 'Failed to fetch',
        };
      }
    });

    const results = await Promise.all(promises);

    const response: ScheduleResponse = {};
    results.forEach(result => {
      response[result.date] = result.shows;
    });

    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(errorMessage);
    throw new validationError('Failed to fetch schedules');
  }
}

export default schedulesController;
