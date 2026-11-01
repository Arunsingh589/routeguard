import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Wind,
  CloudRain,
  Snowflake,
  Thermometer,
  ShieldAlert,
  Eye,
  EyeOff,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function HeatmapTimelineSlider({
  forecastHour,
  setForecastHour,
  activeMetric,
  setActiveMetric,
  showHeatmap,
  setShowHeatmap,
  corridorMatrix,
  departureTime,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback timer loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setForecastHour((prev) => (prev >= 48 ? 0 : prev + 1));
      }, 750);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setForecastHour]);

  // Compute forecast timestamp from departureTime + forecastHour
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

  // Compute peak corridor conditions at this forecast hour
  const getCorridorPeakStats = () => {
    if (!corridorMatrix || corridorMatrix.length === 0) return null;
    let maxWind = 0;
    let maxRain = 0;
    let maxSnow = 0;
    let worstRisk = 'Low';
    let worstNumeric = 1;

    for (const pt of corridorMatrix) {
      const hourData = pt.forecast ? pt.forecast[forecastHour] : null;
      if (hourData) {
        if (hourData.wind_mph > maxWind) maxWind = hourData.wind_mph;
        if (hourData.rain_in_hr > maxRain) maxRain = hourData.rain_in_hr;
        if (hourData.snow_in_hr > maxSnow) maxSnow = hourData.snow_in_hr;
        if (hourData.numeric_risk > worstNumeric) {
          worstNumeric = hourData.numeric_risk;
          worstRisk = hourData.final_risk || 'Low';
        }
      }
    }

    return { maxWind, maxRain, maxSnow, worstRisk, worstNumeric };
  };

  const peakStats = getCorridorPeakStats();

  return (
    <div className="heatmap-floating-controller">
      {/* Header with Heatmap Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Flame size={16} color="#38bdf8" />
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
            Corridor Weather Heatmap
          </h4>
        </div>

        <button
          type="button"
          className="btn-glass"
          style={{
            padding: '3px 8px',
            fontSize: '0.72rem',
            background: showHeatmap ? 'rgba(14, 165, 233, 0.2)' : 'rgba(30, 41, 59, 0.5)',
            borderColor: showHeatmap ? '#38bdf8' : '#334155',
            color: showHeatmap ? '#38bdf8' : '#94a3b8',
          }}
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          {showHeatmap ? <Eye size={13} /> : <EyeOff size={13} />}
          <span>{showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}</span>
        </button>
      </div>

      {/* Forecast Time Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 10,
        padding: '6px 10px',
        background: '#090e1a',
        borderRadius: 8,
        border: '1px solid #1c2738',
      }}>
        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Forecast Window:</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
            +{forecastHour}h
          </span>
          <span style={{ fontSize: '0.74rem', color: '#cbd5e1', marginLeft: 6 }}>
            ({formatForecastTime()})
          </span>
        </div>
      </div>

      {/* Slider & Controls Row */}
      <div className="heatmap-controls-row">
        <button
          type="button"
          className="playback-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause forecast simulation' : 'Play 0-48h forecast simulation'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
        </button>

        <button
          type="button"
          className="btn-glass"
          style={{ padding: '6px 8px' }}
          onClick={() => setForecastHour((prev) => Math.max(0, prev - 1))}
          title="Previous Hour (-1h)"
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ flex: 1 }}>
          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={forecastHour}
            onChange={(e) => setForecastHour(Number(e.target.value))}
            style={{ margin: '4px 0' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#64748b' }}>
            <span>0h (Depart)</span>
            <span>12h</span>
            <span>24h</span>
            <span>36h</span>
            <span>48h (Max)</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-glass"
          style={{ padding: '6px 8px' }}
          onClick={() => setForecastHour((prev) => Math.min(48, prev + 1))}
          title="Next Hour (+1h)"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Metric Selector Tabs */}
      <div className="metric-tabs">
        {[
          { key: 'risk', label: 'Risk Index' },
          { key: 'wind', label: 'Wind (mph)' },
          { key: 'rain', label: 'Rain (in/h)' },
          { key: 'snow', label: 'Snow (in/h)' },
          { key: 'temp', label: 'Temp (°F)' },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            className={`metric-tab ${activeMetric === m.key ? 'active' : ''}`}
            onClick={() => setActiveMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Real-time Peak Summary for Selected Hour */}
      {peakStats && (
        <div style={{
          marginTop: 10,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid #1e293b',
          fontSize: '0.74rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: 3 }}>
            <span>Max Corridor Wind: <strong>{peakStats.maxWind} mph</strong></span>
            <span>Max Rain: <strong>{peakStats.maxRain} in/h</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
            <span>Max Snow: <strong>{peakStats.maxSnow} in/h</strong></span>
            <span>
              Worst Level:{' '}
              <strong style={{
                color:
                  peakStats.worstRisk === 'No Travel' ? '#c084fc' :
                  peakStats.worstRisk === 'Severe' ? '#ef4444' :
                  peakStats.worstRisk === 'High' ? '#f97316' :
                  peakStats.worstRisk === 'Moderate' ? '#f59e0b' : '#10b981',
              }}>
                {peakStats.worstRisk}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Visual Heatmap Gradient Legend */}
      <div style={{ marginTop: 10 }}>
        <div style={{
          height: 6,
          borderRadius: 3,
          background:
            activeMetric === 'temp'
              ? 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 35%, #10b981 60%, #f59e0b 80%, #ef4444 100%)'
              : 'linear-gradient(90deg, #10b981 0%, #f59e0b 35%, #f97316 60%, #ef4444 82%, #c084fc 100%)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94a3b8', marginTop: 3 }}>
          {activeMetric === 'risk' && (
            <>
              <span style={{ color: '#10b981' }}>Low</span>
              <span style={{ color: '#f59e0b' }}>Moderate</span>
              <span style={{ color: '#f97316' }}>High</span>
              <span style={{ color: '#ef4444' }}>Severe</span>
              <span style={{ color: '#c084fc' }}>No Travel</span>
            </>
          )}
          {activeMetric === 'wind' && (
            <>
              <span>&lt;25 mph</span>
              <span>25–34</span>
              <span>35–44</span>
              <span>45–54</span>
              <span>&ge;55 mph</span>
            </>
          )}
          {activeMetric === 'rain' && (
            <>
              <span>&lt;0.10 in/h</span>
              <span>0.10–0.25</span>
              <span>0.25–0.50</span>
              <span>0.50–1.00</span>
              <span>&gt;1.00 in/h</span>
            </>
          )}
          {activeMetric === 'snow' && (
            <>
              <span>&lt;0.5 in/h</span>
              <span>0.5–1.0</span>
              <span>1.0–2.0</span>
              <span>2.0–3.0</span>
              <span>&gt;3.0 in/h</span>
            </>
          )}
          {activeMetric === 'temp' && (
            <>
              <span>20°F Freezing</span>
              <span>45°F Cool</span>
              <span>65°F Mild</span>
              <span>85°F Warm</span>
              <span>100°F+</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
