import { SERVER, INTERVAL, DATA_LENGTH } from './constants';
import { apiTimestamp, getTimeLabel } from './utils';

export const fetchInitialDataFromAPI = async (symbol, now) => {
  const interval = INTERVAL;
  const limit = DATA_LENGTH;
  const nowUtcSec = apiTimestamp(now) - 60;
  const symbolStr = symbol + 'USDT';
  const url = `${SERVER}/api/aggregatedkline/?symbol=${symbolStr}&interval=${interval}&timestamp=${nowUtcSec}&limit=${limit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const arr = await res.json();
    const result = arr.map(item => ({
      time: getTimeLabel(new Date(item.start_time)),
      openPrice: Number(item.open_price).toFixed(2),
      volume: Number(item.volume_base).toFixed(5),
    }));
    result.sort((a, b) => a.time.localeCompare(b.time));
    return result;
  } catch (e) {
    console.error('API fetch error:', e);
    return [];
  }
};

export const fetchNextDataPointFromAPI = async (symbol, now) => {
  const nowUtcSec = apiTimestamp(now);
  const symbolStr = symbol + 'USDT';
  const url = `${SERVER}/api/kline/?symbol=${symbolStr}&timestamp=${nowUtcSec}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const item = await res.json();
    return {
      time: getTimeLabel(new Date(item.start_time)),
      openPrice: Number(item.open_price).toFixed(2),
    };
  } catch (e) {
    console.error('API fetch error:', e);
    return null;
  }
};

export const updateLastVolume = async (symbol, now, setData) => {
  try {
    const nowUtcSec = apiTimestamp(now);
    const symbolStr = symbol + 'USDT';
    const url = `${SERVER}/api/aggregatedkline/?symbol=${symbolStr}&interval=${INTERVAL}&timestamp=${nowUtcSec}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const result = await res.json();
    const item = result[0];
    const newVolume = Number(item.volume_base).toFixed(5);
    setData(prevData => {
      if (!prevData.length) return prevData;
      const updated = [...prevData];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        volume: newVolume
      };
      return updated;
    });
  } catch (e) {
    console.error('updateLastVolume error:', e);
  }
};