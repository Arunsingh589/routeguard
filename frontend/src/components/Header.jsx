import React from 'react';
import { Truck } from 'lucide-react';

export default function Header({ mobileTab, setMobileTab }) {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-logo-icon">
          <Truck size={18} color="#ffffff" />
        </div>
        <div>
          <span className="brand-title">RouteGuard</span>
          <span className="brand-subtitle" style={{ marginLeft: 8 }}>
            Weather-Aware Truck Routing
          </span>
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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.74rem',
        color: '#94a3b8',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '4px 10px',
        borderRadius: 999,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 6px #10b981',
        }} />
        <span>Live Routing &amp; Weather API</span>
      </div>
    </header>
  );
}
