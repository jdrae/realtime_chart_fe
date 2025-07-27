import React, { useEffect, useState } from 'react';
import btcImg from '../assets/btc.png';
import ethImg from '../assets/eth.png';
import xrpImg from '../assets/xrp.png';
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
  const [showTooltip, setShowTooltip] = React.useState(false);
  return (
    <div
      className="latency-card sidebar-card default-card"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: 'relative' }}
    >
      <span className="small-text" style={{ marginBottom: 8 }}>Latency</span>
      <span className="big-text latency-value">{latency}ms</span>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '100%',
            marginLeft: 12,
            transform: 'translateY(-50%)',
            background: '#222',
            color: '#fff',
            width: 200,
            padding: 10,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          Time difference between when the backend receives data from Binance via WebSocket and when the frontend receives that data from the backend.
        </div>
      )}
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
    const socket = io('http://localhost:5555');

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit("subscribe", {stream});
    });
    
    socket.on("message", (data) => {
      let decimalPlaces = 2;
      if (selectedCoin === 'ETH') decimalPlaces = 3;
      else if (selectedCoin === 'XRP') decimalPlaces = 4;
      const price = Number(data['data']['k']['c']).toFixed(decimalPlaces);
      const latency = Date.now() - data["received_at"];
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
    else if (coin === 'XRP') setCoinImg(xrpImg);
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
        <SmallBox
          label="XRP"
          className={selectedCoin === 'XRP' ? 'xrp-box' : ''}
          onClick={() => handleCoinClick('XRP')}
        />
      </div>
    </aside>
  );
};

export default Sidebar;