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
          title={isPlaying ? 'Pause forecast simulation' : 'Play 0–48h radar simulation'}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
              Corridor Weather Forecast: <span style={{ color: '#38bdf8' }}>+{forecastHour}h</span>
              <span style={{ color: '#94a3b8', marginLeft: 6, fontWeight: 400 }}>({formatForecastTime()})</span>
            </span>

            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{
                background: showHeatmap ? 'rgba(14, 165, 233, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                border: showHeatmap ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
                color: showHeatmap ? '#38bdf8' : '#94a3b8',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.7rem',
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
        <div className="legend-item"><span className="legend-swatch" style={{ background: '#10b981' }} />Low</div>
        <div className="legend-item"><span className="legend-swatch" style={{ background: '#f59e0b' }} />Moderate</div>
        <div className="legend-item"><span className="legend-swatch" style={{ background: '#f97316' }} />High</div>
        <div className="legend-item"><span className="legend-swatch" style={{ background: '#ef4444' }} />Severe</div>
        <div className="legend-item"><span className="legend-swatch" style={{ background: '#c084fc' }} />No Travel</div>
      </div>
    </div>
  );
}
