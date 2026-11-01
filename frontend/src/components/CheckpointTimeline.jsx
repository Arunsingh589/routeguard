import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Wind,
  CloudRain,
  Snowflake,
  Thermometer,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

export default function CheckpointTimeline({
  checkpoints,
  onSelectCheckpoint,
  selectedCheckpointIndex,
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'hazards', 'severe'
  const [isExpanded, setIsExpanded] = useState(true);

  if (!checkpoints || checkpoints.length === 0) return null;

  const filteredCheckpoints = checkpoints.filter((cp) => {
    if (filterMode === 'severe') {
      return cp.final_risk === 'Severe' || cp.final_risk === 'No Travel';
    }
    if (filterMode === 'hazards') {
      return cp.final_risk !== 'Low';
    }
    return true;
  });

  const getBadgeClass = (risk) => {
    switch (risk) {
      case 'No Travel': return 'notravel';
      case 'Severe': return 'severe';
      case 'High': return 'high';
      case 'Moderate': return 'moderate';
      default: return 'low';
    }
  };

  return (
    <div className="form-card" style={{ marginTop: 10 }}>
      {/* Header with expand toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#38bdf8" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
            Checkpoint Weather Timeline ({checkpoints.length} samples)
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
          <span style={{ fontSize: '0.74rem' }}>{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 12 }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Filter size={11} /> Filter:
            </span>
            <button
              type="button"
              className={`preset-chip ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All ({checkpoints.length})
            </button>
            <button
              type="button"
              className={`preset-chip ${filterMode === 'hazards' ? 'active' : ''}`}
              onClick={() => setFilterMode('hazards')}
            >
              Hazards Only
            </button>
            <button
              type="button"
              className={`preset-chip ${filterMode === 'severe' ? 'active' : ''}`}
              onClick={() => setFilterMode('severe')}
            >
              Severe / No Travel
            </button>
          </div>

          {/* Timeline List */}
          <div className="timeline-container">
            {filteredCheckpoints.length === 0 ? (
              <div style={{ padding: '16px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                No checkpoints match this filter. Route corridor is clear of selected hazards!
              </div>
            ) : (
              filteredCheckpoints.map((cp) => {
                const isSelected = selectedCheckpointIndex === cp.index;
                const badgeClass = getBadgeClass(cp.final_risk);

                return (
                  <motion.div
                    key={cp.index}
                    className={`timeline-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectCheckpoint && onSelectCheckpoint(cp)}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      borderLeft: isSelected ? '3px solid #38bdf8' : undefined,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                          Mile {cp.distance_from_start_miles}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {cp.eta_formatted || cp.eta?.slice(11, 16)}
                        </span>
                      </div>

                      {/* Weather Condition Snippets */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.74rem', color: '#cbd5e1' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }} title="Wind Speed">
                          <Wind size={12} color="#38bdf8" /> {cp.wind_mph} mph
                        </span>
                        {cp.rain_in_hr > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#60a5fa' }} title="Rain Rate">
                            <CloudRain size={12} /> {cp.rain_in_hr} in/h
                          </span>
                        )}
                        {cp.snow_in_hr > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#a5b4fc' }} title="Snow Rate">
                            <Snowflake size={12} /> {cp.snow_in_hr} in/h
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8' }} title="Temperature">
                          <Thermometer size={12} /> {cp.temp_f}&deg;F
                        </span>
                      </div>

                      {/* Escalation Rule Tag */}
                      {cp.applied_rule && (
                        <div style={{ fontSize: '0.68rem', color: '#fb923c', marginTop: 3 }}>
                          &bull; {cp.applied_rule}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={`timeline-badge ${badgeClass}`}>
                        {cp.final_risk}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
