import { useMemo } from 'react';
import type { TimeFormatPreference } from '@/shared/utils/datetime';

const STORAGE_KEY = 'hr_shakya_time_format';

export function getTimeFormatPreference(): TimeFormatPreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === '12h' ? '12h' : '24h';
}

export function setTimeFormatPreference(preference: TimeFormatPreference) {
  localStorage.setItem(STORAGE_KEY, preference);
}

export function useTimeFormat() {
  return useMemo(() => getTimeFormatPreference(), []);
}
