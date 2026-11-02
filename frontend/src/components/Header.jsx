import React from 'react';
import { Truck } from 'lucide-react';

export default function Header({ mobileTab, setMobileTab }) {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-logo-icon">
          <Truck size={17} color="#ffffff" />
        </div>
        <div className="brand-info">
          <span className="brand-title">RouteGuard</span>
          <span className="brand-subtitle">Weather-Aware Truck Routing</span>
        </div>
      </div>

      <div className="mobile-nav-toggle">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'routes' ? 'active' : ''}`}
          onClick={() => setMobileTab('routes')}
        >
          Trip Plan
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'map' ? 'active' : ''}`}
          onClick={() => setMobileTab('map')}
        >
          Map View
        </button>
      </div>

      <div className="header-status-badge">
        <span className="status-dot" />
        <span>Live Routing &amp; Weather API</span>
      </div>
    </header>
  );
}
