import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- 상수 ---
const SERVER = "http://127.0.0.1:8000"
const INTERVAL = "1m"
const DATA_LENGTH = 12;
const Y_TICK_COUNT = 5;
const UPDATE_INTERVAL_MS = 60 * 1000;

// --- 유틸 함수 ---
const pad2 = n => n.toString().padStart(2, '0');
const getTimeLabel = date => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

// --- Fetch ---
const fetchInitialDataFromAPI = async (symbol, now) => {
  const interval = INTERVAL;
  const limit = DATA_LENGTH;
  // 현재 시각에서 초, 밀리초를 0으로 만들고 1분 전으로 이동
  // now.setMinutes(now.getMinutes() - 1);
  // const nowUtcSec = Math.floor(now.getTime() / 1000);
  const nowUtcSec = 1753326240 - 60; // for test
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
        openPrice: Number(item.open_price).toFixed(2)
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
  // 현재 시각에서 초, 밀리초를 0으로 만듦
  // const nowUtcSec = Math.floor(now.getTime() / 1000);
  const nowUtcSec = 1753326240; // for test
  const symbolStr = symbol + 'USDT';
  const url = `${SERVER}/api/kline/?symbol=${symbolStr}&timestamp=${nowUtcSec}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const item = await res.json();
    const time = getTimeLabel(new Date(item.start_time));
    return {
      time,
      openPrice: Number(item.open_price).toFixed(2)
    };
  } catch (e) {
    console.error('API fetch error:', e);
    return null;
  }
};

// --- 메인 컴포넌트 ---
const ChartCard = ({ symbol }) => {
  const [data, setData] = useState([]);
  const intervalRef = useRef();
  const timeoutRef = useRef();

  // 데이터 업데이트 함수 (불변성 보장)
  const appendNextData = useCallback(() => {
    fetchNextDataPointFromAPI(symbol).then(nextData => {
      if (!nextData) {
        // 에러 발생 시 5초 후 재시도
        setTimeout(() => appendNextData(), 5000);
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
        const now = new Date().setSeconds(0,0);
        // (1) DATA_LENGTH-1개 데이터
        const initialData = await fetchInitialDataFromAPI(symbol, now);
        // (2) 최신 데이터
        const nextData = await fetchNextDataPointFromAPI(symbol, now);
        if (isMounted) {
          if (initialData && nextData) {
            setData([...initialData, nextData]);
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

  // 분의 0초에 맞춰 타이머 세팅 (symbol 바뀌면 재설정)
  useEffect(() => {
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    timeoutRef.current = setTimeout(() => {
      appendNextData();
      intervalRef.current = setInterval(appendNextData, UPDATE_INTERVAL_MS);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [appendNextData, symbol]);

  // y축 계산 (useMemo로 최적화)
  const { minY, maxY, yTicks } = useMemo(() => {
    const allY = data.map(d => d.openPrice);
    const min = Math.floor((Math.min(...allY) - 5) / 5) * 5;
    const max = Math.ceil((Math.max(...allY) + 5) / 5) * 5;
    const ticks = Array.from({ length: Y_TICK_COUNT }, (_, i) =>
      Math.round(min + ((max - min) * i) / (Y_TICK_COUNT - 1))
    );
    return { minY: min, maxY: max, yTicks: ticks };
  }, [data]);

  return (
    <div className="chart-card default-card">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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