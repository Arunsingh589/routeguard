import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Milestone,
  CheckCircle2,
  TrendingDown,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function RouteComparisonList({
  routes,
  selectedRouteId,
  onSelectRoute,
}) {
  if (!routes || routes.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#38bdf8" />
          <span>3 Evaluated Route Options</span>
        </h3>
        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
          Sorted by safety &amp; duration
        </span>
      </div>

      {routes.map((route) => {
        const isSelected = route.id === selectedRouteId;
        const isRecommended = route.is_recommended;
        const stats = route.stats || {};
        const totalDist = route.distance_miles || 1;

        // Proportions for visual risk bar
        const lowPct = Math.max(0, ((stats.low_miles || 0) / totalDist) * 100);
        const modPct = Math.max(0, ((stats.moderate_miles || 0) / totalDist) * 100);
        const highPct = Math.max(0, ((stats.high_miles || 0) / totalDist) * 100);
        const severePct = Math.max(0, ((stats.severe_miles || 0) / totalDist) * 100);
        const noTravelPct = Math.max(0, ((stats.no_travel_miles || 0) / totalDist) * 100);

        return (
          <motion.div
            key={route.id}
            className={`route-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
            onClick={() => onSelectRoute(route.id)}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
          >
            {/* Top row: Rank badge & Route Name */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: isRecommended ? '#10b981' : '#334155',
                    color: '#ffffff',
                  }}>
                    Option #{route.rank}
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f1f5f9' }}>
                    {route.name}
                  </h4>
                </div>
              </div>

              {isRecommended ? (
                <div className="recommended-badge">
                  <ShieldCheck size={14} />
                  <span>Recommended</span>
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Alternate #{route.rank - 1}
                </span>
              )}
            </div>

            {/* Proportional Risk Bar */}
            <div className="risk-proportion-bar" title="Route Hazard Mileage Distribution">
              {lowPct > 0 && <div className="risk-seg-low" style={{ width: `${lowPct}%` }} />}
              {modPct > 0 && <div className="risk-seg-mod" style={{ width: `${modPct}%` }} />}
              {highPct > 0 && <div className="risk-seg-high" style={{ width: `${highPct}%` }} />}
              {severePct > 0 && <div className="risk-seg-severe" style={{ width: `${severePct}%` }} />}
              {noTravelPct > 0 && <div className="risk-seg-notravel" style={{ width: `${noTravelPct}%` }} />}
            </div>

            {/* Key Stats Grid */}
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{route.duration_formatted}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Distance</span>
                <span className="stat-value">{route.distance_miles} mi</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Severe Mi</span>
                <span className="stat-value" style={{
                  color: (stats.severe_miles || 0) > 0 ? '#ef4444' : '#10b981',
                }}>
                  {stats.severe_miles || 0} mi
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Risk</span>
                <span className="stat-value" style={{
                  color: (stats.average_risk || 1) >= 3 ? '#f97316' : '#38bdf8',
                }}>
                  {stats.average_risk} <span style={{ fontSize: '0.65rem', color: '#64748b' }}>/ 5</span>
                </span>
              </div>
            </div>

            {/* Hazard Alert if No-Travel or Severe Miles */}
            {(stats.no_travel_miles || 0) > 0 && (
              <div style={{
                marginTop: 10,
                padding: '6px 10px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontSize: '0.76rem',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <AlertTriangle size={14} />
                <span>
                  <strong>Hazard Alert:</strong> {stats.no_travel_miles} miles under NO TRAVEL conditions.
                </span>
              </div>
            )}

            {/* Recommendation Notes */}
            {route.recommendation_notes && route.recommendation_notes.length > 0 && (
              <div style={{ marginTop: 10, fontSize: '0.76rem', color: '#94a3b8', lineHeight: '1.4' }}>
                {route.recommendation_notes.map((note, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <span style={{ color: isRecommended ? '#10b981' : '#f59e0b' }}>&bull;</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selection indicator arrow */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 8,
              fontSize: '0.72rem',
              color: isSelected ? '#38bdf8' : '#64748b',
              fontWeight: 500,
            }}>
              <span>{isSelected ? 'Currently Viewing on Map' : 'Click to inspect route'}</span>
              <ChevronRight size={14} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
