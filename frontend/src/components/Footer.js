import React from 'react';
import githubIcon from '../assets/github.svg';

const Footer = () => (
  <footer className="footer">
    <p style={{ fontSize: 14, paddingBottom: 1, fontWeight: 300, color: '#0d0d0d' }}>JDRAE</p>
    <a href="https://github.com/jdrae" style={{ padding: 3 }}>
      <img src={githubIcon} alt="GitHub" />
    </a>
  </footer>
);

export default Footer; 