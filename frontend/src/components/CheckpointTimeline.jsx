import React from 'react';
import { Wind, CloudRain, Snowflake } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>
        Checkpoints &amp; Weather ({checkpoints.length} samples)
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
                borderColor: isSelected ? '#3b82f6' : undefined,
                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : undefined,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                  Mile {cp.distance_from_start_miles} &bull; <span style={{ color: '#94a3b8', fontWeight: 400 }}>{cp.eta_formatted}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Wind size={11} color="#38bdf8" /> {cp.wind_mph} mph
                  </span>
                  {cp.rain_in_hr > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#60a5fa' }}>
                      <CloudRain size={11} /> {cp.rain_in_hr} in/h
                    </span>
                  )}
                  {cp.snow_in_hr > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#a5b4fc' }}>
                      <Snowflake size={11} /> {cp.snow_in_hr} in/h
                    </span>
                  )}
                  <span>{cp.temp_f}&deg;F</span>
                </div>
                {cp.applied_rule && (
                  <div style={{ fontSize: '0.68rem', color: '#fb923c', marginTop: 2 }}>
                    {cp.applied_rule}
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
