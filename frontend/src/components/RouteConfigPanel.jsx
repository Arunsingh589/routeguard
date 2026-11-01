import React, { useState, useEffect, useRef } from 'react';
import { ArrowRightLeft, Loader2, Navigation, Calendar, Scale, MapPin } from 'lucide-react';
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
    }, 240);
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
    }, 240);
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
    <div className="panel-card">
      <div className="panel-title">
        <span>Trip Configuration</span>
        {presets && presets.length > 0 && (
          <select
            className="input-box"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.74rem' }}
            onChange={handleSelectPreset}
            defaultValue=""
          >
            <option value="" disabled>Load Sample Corridor...</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.origin.city} &rarr; {p.destination.city}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Origin & Destination with connected route guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <div ref={originRef} style={{ position: 'relative' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Origin
            </label>
            <input
              type="text"
              className="input-box"
              placeholder="Enter origin city or freight hub..."
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
                    <strong style={{ color: '#ffffff' }}>{r.city}</strong>{r.state ? `, ${r.state}` : ''}
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
            <button
              type="button"
              onClick={handleSwap}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#38bdf8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              <ArrowRightLeft size={11} />
              <span>Swap Origin / Dest</span>
            </button>
          </div>

          <div ref={destRef} style={{ position: 'relative' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Destination
            </label>
            <input
              type="text"
              className="input-box"
              placeholder="Enter destination city or freight hub..."
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
                    <strong style={{ color: '#ffffff' }}>{r.city}</strong>{r.state ? `, ${r.state}` : ''}
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} color="#38bdf8" />
            Departure Date &amp; Time
          </label>
          <input
            type="datetime-local"
            className="input-box"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
        </div>

        {/* Load Weight Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Scale size={12} color="#38bdf8" />
              Truck Load Weight
            </label>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#38bdf8' }}>
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
            style={{ margin: '6px 0' }}
          />
          {Number(loadWeightLbs) > 30000 && (
            <div style={{
              fontSize: '0.72rem',
              color: '#f97316',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              padding: '4px 8px',
              borderRadius: 4,
            }}>
              {Number(loadWeightLbs) > 40000
                ? 'Load > 40k lbs: 35–44 mph winds elevate to Severe'
                : 'Load > 30k lbs: 45–54 mph winds elevate to No Travel'}
            </div>
          )}
        </div>

        {/* Sampling Interval Selector */}
        <div>
          <label className="input-label">Weather Sampling Interval</label>
          <div className="segmented-control">
            {[
              { val: 10, label: 'Every 10 mi' },
              { val: 25, label: 'Every 25 mi' },
              { val: 50, label: 'Every 50 mi' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                className={`segmented-button ${Number(samplingIntervalMiles) === opt.val ? 'active' : ''}`}
                onClick={() => setSamplingIntervalMiles(opt.val)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="btn-primary"
          onClick={() => onCalculate()}
          disabled={isLoading || !origin || !destination}
          style={{ marginTop: 4 }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin-animation" />
              <span>Analyzing Weather Checkpoints...</span>
            </>
          ) : (
            <>
              <Navigation size={16} />
              <span>Calculate Safe Routes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
