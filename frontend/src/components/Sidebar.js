import React from 'react';
import bitcoin from '../assets/bitcoin.png';
import upArrow from '../assets/up-arrow.svg';

const PriceCard = () => (
  <div className="price-card sidebar-card default-card">
    <div className="price-card-top">
      <div>
        <img src={bitcoin} alt="Bitcoin" style={{ width: 16, height: 16 }} />
        <span className="small-text">BTCUSDT</span>
      </div>
      <div>
        <img src={upArrow} alt="Up" style={{ width: 10, height: 10 }} />
        <span className="small-text" style={{ color: '#09A249' }}>0.3%</span>
      </div>
    </div>
    <span className="big-text price-value">105,023</span>
  </div>
);

const LatencyCard = () => (
  <div className="latency-card sidebar-card default-card">
    <span className="small-text" style={{ marginBottom: 8 }}>Latency</span>
    <span className="big-text latency-value">300ms</span>
  </div>
);

const SmallBox = ({ label, className }) => (
  <a href="#" className={`small-box default-card ${className || ''}`.trim()}>
    <span className="medium-text">{label}</span>
  </a>
);

const Sidebar = () => (
  <aside className="sidebar">
    <PriceCard />
    <LatencyCard />
    <div className="small-box-container">
      <SmallBox label="BTC" className="btc-box" />
      <SmallBox label="ETH" />
      <SmallBox label="XRP" />
    </div>
  </aside>
);

export default Sidebar; 