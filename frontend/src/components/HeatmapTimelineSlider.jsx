import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export default function HeatmapTimelineSlider({
  forecastHour,
  setForecastHour,
  showHeatmap,
  setShowHeatmap,
  departureTime,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setForecastHour((prev) => (prev >= 48 ? 0 : prev + 1));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setForecastHour]);

  const formatForecastTime = () => {
    if (!departureTime) return `+${forecastHour} Hours`;
    try {
      const d = new Date(departureTime);
      d.setHours(d.getHours() + forecastHour);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return `+${forecastHour} Hours`;
    }
  };

  return (
    <div className="heatmap-dock">
      <div className="heatmap-dock-row">
        <button
          type="button"
          className="play-button"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause simulation' : 'Play 0-48h simulation'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>
              Corridor Forecast: <span style={{ color: '#38bdf8' }}>+{forecastHour}h</span>
              <span style={{ color: '#94a3b8', marginLeft: 6 }}>({formatForecastTime()})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{
                background: 'transparent',
                border: 'none',
                color: showHeatmap ? '#38bdf8' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
            </button>
          </div>

          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={forecastHour}
            onChange={(e) => setForecastHour(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="heatmap-legend">
        <span><span className="legend-swatch" style={{ background: '#10b981' }}></span>Low</span>
        <span><span className="legend-swatch" style={{ background: '#f59e0b' }}></span>Moderate</span>
        <span><span className="legend-swatch" style={{ background: '#f97316' }}></span>High</span>
        <span><span className="legend-swatch" style={{ background: '#ef4444' }}></span>Severe</span>
        <span><span className="legend-swatch" style={{ background: '#c084fc' }}></span>No Travel</span>
      </div>
    </div>
  );
}
