import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Problem from './components/Problem';
import HowItWorks from './components/HowItWorks';
import DashboardPreview from './components/DashboardPreview';
import AnomalyDemo from './components/AnomalyDemo';
import Features from './components/Features';
import TechStack from './components/TechStack';
import ImpactStats from './components/ImpactStats';
import Roadmap from './components/Roadmap';
import Footer from './components/Footer';

import './App.css';
import './index.css';

function App() {
  return (
    <div className="app-container">
      {/* Sticky Navbar */}
      <Navbar />

      {/* Ambient backgrounds */}
      <div className="ambient-light" style={{ top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'var(--cyan)' }}></div>
      <div className="ambient-light" style={{ bottom: '20%', right: '-10%', width: '40vw', height: '40vw', background: 'var(--green)' }}></div>

      {/* Main Content Sections */}
      <Hero />
      <div id="problem"><Problem /></div>
      <div id="how-it-works"><HowItWorks /></div>
      <div id="dashboard"><DashboardPreview /></div>
      <div id="anomaly"><AnomalyDemo /></div>
      <Features />
      <div id="tech-stack"><TechStack /></div>
      <ImpactStats />
      <Roadmap />
      <Footer />
    </div>
  );
}

export default App;
