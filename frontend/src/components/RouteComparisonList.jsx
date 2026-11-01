import React from 'react';
import { ShieldCheck, Check, Clock, Route as RouteIcon } from 'lucide-react';

export default function RouteComparisonList({
  routes,
  selectedRouteId,
  onSelectRoute,
}) {
  if (!routes || routes.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
          Evaluated Route Options
        </span>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Sorted by safety &amp; duration
        </span>
      </div>

      {routes.map((route) => {
        const isSelected = route.id === selectedRouteId;
        const isRecommended = route.is_recommended;
        const stats = route.stats || {};
        const totalDist = route.distance_miles || 1;

        const lowPct = Math.max(0, ((stats.low_miles || 0) / totalDist) * 100);
        const modPct = Math.max(0, ((stats.moderate_miles || 0) / totalDist) * 100);
        const highPct = Math.max(0, ((stats.high_miles || 0) / totalDist) * 100);
        const severePct = Math.max(0, ((stats.severe_miles || 0) / totalDist) * 100);
        const noTravelPct = Math.max(0, ((stats.no_travel_miles || 0) / totalDist) * 100);

        return (
          <div
            key={route.id}
            className={`route-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
            onClick={() => onSelectRoute(route.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: isRecommended ? '#10b981' : '#334155',
                  color: '#ffffff',
                }}>
                  #{route.rank}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#ffffff' }}>
                  {route.name}
                </span>
              </div>

              {isRecommended ? (
                <span className="route-badge" style={{
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}>
                  <ShieldCheck size={13} /> Recommended
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Option {route.rank}
                </span>
              )}
            </div>

            <div className="risk-bar" title="Corridor Hazard Breakdown">
              {lowPct > 0 && <div className="risk-seg-low" style={{ width: `${lowPct}%` }} />}
              {modPct > 0 && <div className="risk-seg-mod" style={{ width: `${modPct}%` }} />}
              {highPct > 0 && <div className="risk-seg-high" style={{ width: `${highPct}%` }} />}
              {severePct > 0 && <div className="risk-seg-severe" style={{ width: `${severePct}%` }} />}
              {noTravelPct > 0 && <div className="risk-seg-notravel" style={{ width: `${noTravelPct}%` }} />}
            </div>

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
                <span className="stat-value" style={{ color: (stats.severe_miles || 0) > 0 ? '#ef4444' : '#10b981' }}>
                  {stats.severe_miles || 0} mi
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Risk</span>
                <span className="stat-value">{stats.average_risk} <span style={{ fontSize: '0.65rem', color: '#64748b' }}>/ 5</span></span>
              </div>
            </div>

            {route.recommendation_notes && route.recommendation_notes.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '0.74rem', color: '#94a3b8', lineHeight: '1.4' }}>
                {route.recommendation_notes[0]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
