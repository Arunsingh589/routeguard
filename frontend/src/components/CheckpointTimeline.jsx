import React from 'react';
import { Wind, CloudRain, Snowflake, Thermometer } from 'lucide-react';

export default function CheckpointTimeline({
  checkpoints,
  onSelectCheckpoint,
  selectedCheckpointIndex,
}) {
  if (!checkpoints || checkpoints.length === 0) return null;

  const getBadgeClass = (risk) => {
    switch (risk) {
      case 'No Travel': return 'badge-notravel';
      case 'Severe': return 'badge-severe';
      case 'High': return 'badge-high';
      case 'Moderate': return 'badge-mod';
      default: return 'badge-low';
    }
  };

  return (
    <div className="panel-card" style={{ padding: 14 }}>
      <div className="panel-title" style={{ marginBottom: 8 }}>
        <span>Checkpoint Weather Timeline</span>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
          {checkpoints.length} sampled points
        </span>
      </div>

      <div className="timeline-list">
        {checkpoints.map((cp) => {
          const isSelected = selectedCheckpointIndex === cp.index;
          return (
            <div
              key={cp.index}
              className="timeline-row"
              onClick={() => onSelectCheckpoint && onSelectCheckpoint(cp)}
              style={{
                borderColor: isSelected ? '#0ea5e9' : undefined,
                background: isSelected ? 'rgba(14, 165, 233, 0.12)' : undefined,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                  Mile {cp.distance_from_start_miles} &bull;{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                    {cp.eta_formatted}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: '0.74rem', color: '#cbd5e1' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Wind size={12} color="#38bdf8" /> {cp.wind_mph} mph
                  </span>
                  {cp.rain_in_hr > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#60a5fa' }}>
                      <CloudRain size={12} /> {cp.rain_in_hr} in/h
                    </span>
                  )}
                  {cp.snow_in_hr > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#a5b4fc' }}>
                      <Snowflake size={12} /> {cp.snow_in_hr} in/h
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8' }}>
                    <Thermometer size={12} /> {cp.temp_f}&deg;F
                  </span>
                </div>
                {cp.applied_rule && (
                  <div style={{ fontSize: '0.68rem', color: '#fb923c', marginTop: 3 }}>
                    &bull; {cp.applied_rule}
                  </div>
                )}
              </div>

              <div>
                <span className={`badge ${getBadgeClass(cp.final_risk)}`}>
                  {cp.final_risk}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
