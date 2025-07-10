import React from 'react';
import NavBar from './components/NavBar';
import ChartCard from './components/ChartCard';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

function App() {
  return (
    <div className="outer-container">
      <NavBar />
      <div className="inner-container">
        <ChartCard />
        <Sidebar />
      </div>
      <Footer />
    </div>
  );
}

export default App;
