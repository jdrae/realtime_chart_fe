import React, { useState } from 'react';
import NavBar from './components/NavBar';
import ChartCard from './components/ChartCard';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

function App() {
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  return (
    <div className="outer-container">
      <NavBar />
      <div className="inner-container">
        <ChartCard symbol={selectedCoin} />
        <Sidebar selectedCoin={selectedCoin} setSelectedCoin={setSelectedCoin} />
      </div>
      <Footer />
    </div>
  );
}

export default App;
