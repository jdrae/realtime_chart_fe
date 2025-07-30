import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar
} from 'recharts';

// --- 상수 ---
const SERVER = "http://127.0.0.1:8000"
const INTERVAL = "1m"
const DATA_LENGTH = 10;
const Y_TICK_COUNT = 5;
const UPDATE_INTERVAL_MS = 60 * 1000;

// --- 유틸 함수 ---
const pad2 = n => n.toString().padStart(2, '0');
const getTimeLabel = date => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
const apiTimestamp = (date) => {
  const d = new Date(date);
  d.setSeconds(0,0);
  return Math.floor(d.getTime() / 1000);
};
// (추가) 매분 5초 기준으로 초기 now를 반환
const getInitialNow = () => {
  const now = new Date();
  if (now.getSeconds() < 5) {
    now.setMinutes(now.getMinutes() - 1);
  }
  return now;
};

// --- Fetch ---
const fetchInitialDataFromAPI = async (symbol, now) => {
  const interval = INTERVAL;
  const limit = DATA_LENGTH;
  const nowUtcSec = apiTimestamp(now) - 60;
  const symbolStr = symbol + 'USDT';
  const url = `${SERVER}/api/aggregatedkline/?symbol=${symbolStr}&interval=${interval}&timestamp=${nowUtcSec}&limit=${limit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const arr = await res.json();
    const result = arr.map(item => {
      const time = getTimeLabel(new Date(item.start_time));
      return {
        time,
        openPrice: Number(item.open_price).toFixed(2),
        volume: Number(item.volume_base).toFixed(5),
      };
    });
    result.sort((a, b) => a.time.localeCompare(b.time));
    return result;
  } catch (e) {
    console.error('API fetch error:', e);
    return [];
  }
};

const fetchNextDataPointFromAPI = async (symbol, now) => {
  const nowUtcSec = apiTimestamp(now);
  const symbolStr = symbol + 'USDT';
  const url = `${SERVER}/api/kline/?symbol=${symbolStr}&timestamp=${nowUtcSec}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const item = await res.json();
    const time = getTimeLabel(new Date(item.start_time));
    return {
      time,
      openPrice: Number(item.open_price).toFixed(2),
    };
  } catch (e) {
    console.error('API fetch error:', e);
    return null;
  }
};

// 마지막 데이터의 volume만 갱신하는 함수
const updateLastVolume = async (symbol, now, setData) => {
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

// --- 메인 컴포넌트 ---
const ChartCard = ({ symbol }) => {
  const [data, setData] = useState([]);
  const intervalRef = useRef();
  const timeoutRef = useRef();
  // (추가) symbol이 바뀔 때마다 초기 now를 새로 계산
  const initialNowRef = useRef(getInitialNow());

  useEffect(() => {
    initialNowRef.current = getInitialNow();
  }, [symbol]);

  // 데이터 업데이트 함수 (불변성 보장)
  const appendNextData = useCallback(() => {
    const now = new Date();

    fetchNextDataPointFromAPI(symbol, now).then(nextData => {
      if (!nextData) {
        // retry 없이 그냥 return
        return;
      }
      setData(prevData => [...prevData.slice(1), nextData]);
    });
  }, [symbol]);

  // symbol이 바뀌면 API에서 데이터 새로 받아오기
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const now = initialNowRef.current;
        // (1) DATA_LENGTH-1개 데이터
        const initialData = await fetchInitialDataFromAPI(symbol, now);
        // (2) 최신 데이터
        const nextData = await fetchNextDataPointFromAPI(symbol, now);
        if (isMounted) {
          if (initialData && nextData) {
            setData([...initialData, nextData]);
          } else if (initialData) {
            setData([...initialData])
          } else {
            setData([]);
          }
        }
      } catch (e) {
        if (isMounted) setData([]);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, [symbol]);

  // 분의 5초에 맞춰 타이머 세팅 (symbol 바뀌면 재설정)
  useEffect(() => {
    const now = initialNowRef.current;
    let msToNextMinute5 = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 5000;
    if (now.getSeconds() < 5) {
      msToNextMinute5 -= 60000; // 이미 5초 전이면 1분 더 기다림
    }
    if (msToNextMinute5 < 0) msToNextMinute5 += 60000; // 음수 방지

    timeoutRef.current = setTimeout(async () => {
      const updateNow = new Date();
      await updateLastVolume(symbol, updateNow, setData);
      appendNextData();
      intervalRef.current = setInterval(async () => {
        const updateNow = new Date();
        await updateLastVolume(symbol, updateNow, setData);
        appendNextData();
      }, UPDATE_INTERVAL_MS);
    }, msToNextMinute5);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [appendNextData, symbol]);

  // y축 계산 (useMemo로 최적화)
  const { minY, maxY, yTicks } = useMemo(() => {
    const allY = data.map(d => d.openPrice);
    const min = Math.floor((Math.min(...allY) - 10) / 5) * 5;
    const max = Math.ceil((Math.max(...allY) + 10) / 5) * 5;
    const ticks = Array.from({ length: Y_TICK_COUNT }, (_, i) =>
      Math.round(min + ((max - min) * i) / (Y_TICK_COUNT - 1))
    );
    return { minY: min, maxY: max, yTicks: ticks };
  }, [data]);

  return (
    <div className="chart-card default-card">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          {/* Histogram Bar occupying 1/4 of the chart height */}
          <Bar
            dataKey="volume"
            fill="#b0c4de"
            barSize={20}
            yAxisId="volume"
            isAnimationActive={false}
            opacity={0.5}
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          <XAxis
            dataKey="time"
            ticks={data.map(d => d.time)}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            ticks={yTicks}
            domain={[minY, maxY]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="openPrice"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            opacity={0.9}
            name="open price"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard; 