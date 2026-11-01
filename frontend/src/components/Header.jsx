import React from 'react';
import { Truck, ShieldCheck, HelpCircle, Layers, Zap } from 'lucide-react';

export default function Header({ onOpenRubric, onOpenGuide }) {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Truck size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="brand-title" style={{ fontSize: '1.18rem', margin: 0 }}>
              RouteGuard
            </h1>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '2px 6px',
              borderRadius: 4,
              letterSpacing: '0.04em',
            }}>
              PRO
            </span>
          </div>
          <div className="brand-subtitle">
            Weather-Aware Truck Freight Routing Engine
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="live-badge" title="Connected to Open-Meteo & OSRM APIs">
          <span className="pulse-dot"></span>
          <span>Live Meteorology &amp; Routing Active</span>
        </div>

        <button
          onClick={onOpenRubric}
          className="btn-glass"
          title="View Weather & Load Risk Rules"
        >
          <ShieldCheck size={16} color="#38bdf8" />
          <span>Risk Rubric</span>
        </button>
      </div>
    </header>
  );
}
