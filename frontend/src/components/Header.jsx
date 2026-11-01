import React from 'react';
import { Truck } from 'lucide-react';

export default function Header() {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <Truck size={22} color="#38bdf8" />
        <div>
          <span className="brand-title">RouteGuard</span>
          <span className="brand-subtitle" style={{ marginLeft: 8 }}>
            Weather-Aware Truck Routing
          </span>
        </div>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
        Live OSRM &amp; Open-Meteo Integration
      </div>
    </header>
  );
}
