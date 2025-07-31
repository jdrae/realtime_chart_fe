import React, { useEffect, useState } from 'react';
import btcImg from '../assets/btc.png';
import ethImg from '../assets/eth.png';
import { io } from 'socket.io-client';

const PriceCard = ({ price, coinImg, coinName, numTrades }) => (
  <div className="price-card sidebar-card default-card">
    <div className="price-card-top">
      <div>
        <img src={coinImg} style={{ width: 16, height: 16 }} />
        <span className="small-text">{coinName}</span>
      </div>
      <div className="small-text" style={{ color: '#777777' }}>
        <span>{numTrades} trades</span>
      </div>
    </div>
    <span className="big-text price-value">{price}</span>
  </div>
);

const LatencyCard = ({ latency }) => {
  return (
    <div className="latency-card sidebar-card default-card">
      <span className="small-text" style={{ marginBottom: 8 }}>Latency</span>
      <span className="big-text latency-value">{latency}ms</span>
    </div>
  );
};

const SmallBox = ({ label, className, onClick }) => (
  <a href="#" className={`small-box default-card ${className}`} onClick={onClick}>
    <span className="medium-text">{label}</span>
  </a>
);

const Sidebar = ({ selectedCoin, setSelectedCoin }) => {
  const [price, setPrice] = useState('');
  const [latency, setLatency] = useState('');
  const [coinImg, setCoinImg] = useState(btcImg);
  const [numTrades, setNumTrades] = useState(0);

  useEffect(() => {
    const stream = `${selectedCoin}USDT`;
    const socket = io();

    socket.on('connect', () => {
      socket.emit("subscribe", {stream});
    });
    
    socket.on("message", (data) => {
      let decimalPlaces = 2;
      if (selectedCoin === 'ETH') decimalPlaces = 3;
      const price = Number(data['data']['k']['c']).toFixed(decimalPlaces);
      const latency = Math.abs(Date.now() - data["received_at"]);
      setPrice(price);
      setLatency(latency);
      setNumTrades(data['data']['k']['n']);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [selectedCoin]);

  const handleCoinClick = (coin) => {
    setSelectedCoin(coin);
    if (coin === 'BTC') setCoinImg(btcImg);
    else if (coin === 'ETH') setCoinImg(ethImg);
  };

  const coinName = `${selectedCoin}USDT`;

  return (
    <aside className="sidebar">
      <PriceCard price={price} coinImg={coinImg} coinName={coinName} numTrades={numTrades} />
      <LatencyCard latency={latency} />
      <div className="small-box-container">
        <SmallBox
          label="BTC"
          className={selectedCoin === 'BTC' ? 'btc-box' : ''}
          onClick={() => handleCoinClick('BTC')}
        />
        <SmallBox
          label="ETH"
          className={selectedCoin === 'ETH' ? 'eth-box' : ''}
          onClick={() => handleCoinClick('ETH')}
        />
        <div class="small-box default-card empty-small-box"><span>🚀</span></div>
      </div>
    </aside>
  );
};

export default Sidebar;