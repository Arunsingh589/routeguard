import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRightLeft, Loader2, Navigation } from 'lucide-react';
import { searchLocations } from '../api';

export default function RouteConfigPanel({
  origin,
  setOrigin,
  destination,
  setDestination,
  departureTime,
  setDepartureTime,
  loadWeightLbs,
  setLoadWeightLbs,
  samplingIntervalMiles,
  setSamplingIntervalMiles,
  presets,
  onCalculate,
  isLoading,
}) {
  const [originQuery, setOriginQuery] = useState(origin?.label || '');
  const [destQuery, setDestQuery] = useState(destination?.label || '');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originRef = useRef(null);
  const destRef = useRef(null);

  useEffect(() => {
    if (origin?.label) setOriginQuery(origin.label);
  }, [origin]);

  useEffect(() => {
    if (destination?.label) setDestQuery(destination.label);
  }, [destination]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (originRef.current && !originRef.current.contains(e.target)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!originQuery || originQuery.length < 2 || originQuery === origin?.label) {
      setOriginResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchLocations(originQuery);
      setOriginResults(res);
      setShowOriginDropdown(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [originQuery, origin]);

  useEffect(() => {
    if (!destQuery || destQuery.length < 2 || destQuery === destination?.label) {
      setDestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchLocations(destQuery);
      setDestResults(res);
      setShowDestDropdown(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [destQuery, destination]);

  const handleSwap = () => {
    const prevOrigin = origin;
    const prevDest = destination;
    setOrigin(prevDest);
    setDestination(prevOrigin);
    setOriginQuery(prevDest?.label || '');
    setDestQuery(prevOrigin?.label || '');
  };

  const handleSelectPreset = (e) => {
    const presetId = e.target.value;
    if (!presetId) return;
    const found = presets.find((p) => p.id === presetId);
    if (!found) return;

    setOrigin(found.origin);
    setDestination(found.destination);
    setOriginQuery(found.origin.label);
    setDestQuery(found.destination.label);
    const weight = found.suggested_load_weight || loadWeightLbs;
    const interval = found.default_interval || samplingIntervalMiles;
    setLoadWeightLbs(weight);
    setSamplingIntervalMiles(interval);

    onCalculate({
      origin: found.origin,
      destination: found.destination,
      loadWeightLbs: weight,
      samplingIntervalMiles: interval,
    });
  };

  return (
    <div className="form-section">
      {/* Optional Preset Quick Dropdown */}
      {presets && presets.length > 0 && (
        <div>
          <label className="input-label">Sample Corridor</label>
          <select
            className="input-box"
            onChange={handleSelectPreset}
            defaultValue=""
          >
            <option value="" disabled>Choose a sample corridor...</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.origin.city} &rarr; {p.destination.city} ({p.name})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Origin & Destination Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
        <div ref={originRef} style={{ position: 'relative' }}>
          <label className="input-label">Origin</label>
          <input
            type="text"
            className="input-box"
            placeholder="Search origin city or hub..."
            value={originQuery}
            onChange={(e) => {
              setOriginQuery(e.target.value);
              setShowOriginDropdown(true);
            }}
            onFocus={() => {
              if (originResults.length > 0) setShowOriginDropdown(true);
            }}
          />

          {showOriginDropdown && originResults.length > 0 && (
            <div className="autocomplete-dropdown">
              {originResults.map((r, i) => (
                <div
                  key={i}
                  className="autocomplete-item"
                  onClick={() => {
                    setOrigin(r);
                    setOriginQuery(r.label);
                    setShowOriginDropdown(false);
                  }}
                >
                  <strong>{r.city}</strong>{r.state ? `, ${r.state}` : ''}
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleSwap}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              padding: '2px 6px',
            }}
          >
            <ArrowRightLeft size={12} />
            <span>Swap</span>
          </button>
        </div>

        <div ref={destRef} style={{ position: 'relative' }}>
          <label className="input-label">Destination</label>
          <input
            type="text"
            className="input-box"
            placeholder="Search destination city or hub..."
            value={destQuery}
            onChange={(e) => {
              setDestQuery(e.target.value);
              setShowDestDropdown(true);
            }}
            onFocus={() => {
              if (destResults.length > 0) setShowDestDropdown(true);
            }}
          />

          {showDestDropdown && destResults.length > 0 && (
            <div className="autocomplete-dropdown">
              {destResults.map((r, i) => (
                <div
                  key={i}
                  className="autocomplete-item"
                  onClick={() => {
                    setDestination(r);
                    setDestQuery(r.label);
                    setShowDestDropdown(false);
                  }}
                >
                  <strong>{r.city}</strong>{r.state ? `, ${r.state}` : ''}
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Departure Date/Time */}
      <div>
        <label className="input-label">Departure Date &amp; Time</label>
        <input
          type="datetime-local"
          className="input-box"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
        />
      </div>

      {/* Load Weight */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="input-label">Load Weight (lbs)</label>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
            {Number(loadWeightLbs).toLocaleString()} lbs
          </span>
        </div>
        <input
          type="range"
          min="5000"
          max="80000"
          step="1000"
          value={loadWeightLbs}
          onChange={(e) => setLoadWeightLbs(Number(e.target.value))}
        />
        {Number(loadWeightLbs) > 30000 && (
          <div style={{ fontSize: '0.7rem', color: '#fb923c', marginTop: 2 }}>
            {Number(loadWeightLbs) > 40000
              ? 'Load > 40,000 lbs: 35-44 mph wind triggers Severe'
              : 'Load > 30,000 lbs: 45-54 mph wind triggers No Travel'}
          </div>
        )}
      </div>

      {/* Sampling Interval */}
      <div>
        <label className="input-label">Weather Sampling Interval</label>
        <div className="segmented-control">
          {[10, 25, 50].map((intVal) => (
            <button
              key={intVal}
              type="button"
              className={`segmented-button ${Number(samplingIntervalMiles) === intVal ? 'active' : ''}`}
              onClick={() => setSamplingIntervalMiles(intVal)}
            >
              Every {intVal} miles
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        className="btn-primary"
        onClick={() => onCalculate()}
        disabled={isLoading || !origin || !destination}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="spin-animation" />
            <span>Calculating 3 Routes...</span>
          </>
        ) : (
          <>
            <Navigation size={16} />
            <span>Calculate Routes</span>
          </>
        )}
      </button>
    </div>
  );
}
