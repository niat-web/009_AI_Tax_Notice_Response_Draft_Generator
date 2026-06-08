import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, BarChart3, Home, FileText } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import MainDashboard from './pages/MainDashboard';
import HistoryPage from './pages/HistoryPage';
import AdminAnalytics from './pages/AdminAnalytics';
import Footer from './components/Footer';
import './index.css';

function NavBar() {
  const location = useLocation();

  return (
    <nav className="nav-bar glass-header">
      <div className="nav-brand">
        <LayoutDashboard size={24} color="#818CF8" />
        AI Tax Notice Generator
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <Home size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
          Home
        </Link>
        <Link to="/app" className={`nav-link ${location.pathname === '/app' ? 'active' : ''}`}>
          <FileText size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
          Generator Tool
        </Link>
        <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
          <History size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
          History
        </Link>
        <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
          <BarChart3 size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
          Analytics
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<MainDashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
