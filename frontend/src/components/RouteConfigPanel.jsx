import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  ArrowRightLeft,
  Calendar,
  Weight,
  Ruler,
  Navigation,
  Loader2,
  AlertTriangle,
  Flame,
  Check,
  Compass,
} from 'lucide-react';
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
  // Autocomplete state
  const [originQuery, setOriginQuery] = useState(origin?.label || '');
  const [destQuery, setDestQuery] = useState(destination?.label || '');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
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

  // Click outside listener for dropdowns
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

  // Debounced search for Origin
  useEffect(() => {
    if (!originQuery || originQuery.length < 2 || originQuery === origin?.label) {
      setOriginResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      const res = await searchLocations(originQuery);
      setOriginResults(res);
      setIsSearchingOrigin(false);
      setShowOriginDropdown(true);
    }, 280);
    return () => clearTimeout(timer);
  }, [originQuery, origin]);

  // Debounced search for Destination
  useEffect(() => {
    if (!destQuery || destQuery.length < 2 || destQuery === destination?.label) {
      setDestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      const res = await searchLocations(destQuery);
      setDestResults(res);
      setIsSearchingDest(false);
      setShowDestDropdown(true);
    }, 280);
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

  const handleApplyPreset = (preset) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setOriginQuery(preset.origin.label);
    setDestQuery(preset.destination.label);
    if (preset.suggested_load_weight) {
      setLoadWeightLbs(preset.suggested_load_weight);
    }
    if (preset.default_interval) {
      setSamplingIntervalMiles(preset.default_interval);
    }
  };

  // Quick departure date helpers
  const handleQuickTime = (hoursOffset) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursOffset);
    // format as YYYY-MM-DDTHH:mm
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localIso = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setDepartureTime(localIso);
  };

  const isRule2Active = Number(loadWeightLbs) > 30000;
  const isRule3Active = Number(loadWeightLbs) > 40000;

  return (
    <div className="form-card">
      <div className="form-header-title">
        <Compass size={18} color="#38bdf8" />
        <span>Trip Route Configuration</span>
      </div>

      {/* Preset Corridor Shortcuts */}
      <div style={{ marginBottom: 16 }}>
        <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Flame size={12} color="#f59e0b" />
          Freight Corridor Presets
        </span>
        <div className="preset-chips">
          {presets.map((p) => {
            const isActive =
              origin?.city === p.origin?.city && destination?.city === p.destination?.city;
            return (
              <button
                key={p.id}
                type="button"
                className={`preset-chip ${isActive ? 'active' : ''}`}
                onClick={() => handleApplyPreset(p)}
              >
                {isActive && <Check size={12} />}
                <span>{p.origin.city} &rarr; {p.destination.city}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Origin & Destination Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        {/* Origin */}
        <div ref={originRef} className="autocomplete-container">
          <label className="input-label">Origin (City, State or Hub)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-box"
              placeholder="e.g. Chicago, IL"
              value={originQuery}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                setShowOriginDropdown(true);
              }}
              onFocus={() => {
                if (originResults.length > 0) setShowOriginDropdown(true);
              }}
              style={{ paddingLeft: 34 }}
            />
            <div style={{ position: 'absolute', left: 10, top: 10, color: '#10b981' }}>
              <MapPin size={16} />
            </div>
            {isSearchingOrigin && (
              <div style={{ position: 'absolute', right: 10, top: 10, color: '#94a3b8' }}>
                <Loader2 size={16} className="spin-animation" />
              </div>
            )}
          </div>

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
                  <strong style={{ color: '#f8fafc' }}>{r.city}</strong>
                  {r.state ? `, ${r.state}` : ''}
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
          <button
            type="button"
            className="btn-glass"
            onClick={handleSwap}
            title="Swap Origin and Destination"
            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: 20 }}
          >
            <ArrowRightLeft size={13} color="#38bdf8" />
            <span>Swap Points</span>
          </button>
        </div>

        {/* Destination */}
        <div ref={destRef} className="autocomplete-container">
          <label className="input-label">Destination (City, State or Hub)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-box"
              placeholder="e.g. Dallas, TX"
              value={destQuery}
              onChange={(e) => {
                setDestQuery(e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={() => {
                if (destResults.length > 0) setShowDestDropdown(true);
              }}
              style={{ paddingLeft: 34 }}
            />
            <div style={{ position: 'absolute', left: 10, top: 10, color: '#ef4444' }}>
              <MapPin size={16} />
            </div>
            {isSearchingDest && (
              <div style={{ position: 'absolute', right: 10, top: 10, color: '#94a3b8' }}>
                <Loader2 size={16} className="spin-animation" />
              </div>
            )}
          </div>

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
                  <strong style={{ color: '#f8fafc' }}>{r.city}</strong>
                  {r.state ? `, ${r.state}` : ''}
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Departure Date / Time */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} color="#38bdf8" />
            Departure Date &amp; Time
          </label>
        </div>
        <input
          type="datetime-local"
          className="input-box"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleQuickTime(0)}
          >
            Now
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleQuickTime(2)}
          >
            +2 Hours
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleQuickTime(6)}
          >
            +6 Hours
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleQuickTime(24)}
          >
            +24 Hours
          </button>
        </div>
      </div>

      {/* Load Weight */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Weight size={13} color="#38bdf8" />
            Truck Gross Load Weight
          </label>
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#38bdf8' }}>
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

        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {[
            { label: 'Empty (15k)', weight: 15000 },
            { label: 'Medium (32k)', weight: 32000 },
            { label: 'Heavy (45k)', weight: 45000 },
            { label: 'Max Legal (80k)', weight: 80000 },
          ].map((preset) => (
            <button
              key={preset.weight}
              type="button"
              className={`preset-chip ${Number(loadWeightLbs) === preset.weight ? 'active' : ''}`}
              onClick={() => setLoadWeightLbs(preset.weight)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Dynamic Weight Escalation Rule Badges */}
        <div className="weight-gauge-container">
          {isRule2Active && (
            <div className="weight-rule-badge danger">
              <AlertTriangle size={14} />
              <span>
                <strong>&gt; 30,000 lbs Active:</strong> Wind 45–54 mph triggers <strong>No Travel</strong>
              </span>
            </div>
          )}
          {isRule3Active && (
            <div className="weight-rule-badge warning">
              <AlertTriangle size={14} />
              <span>
                <strong>&gt; 40,000 lbs Active:</strong> Wind 35–44 mph triggers <strong>Severe Risk</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sampling Interval Selector */}
      <div style={{ marginTop: 16 }}>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Ruler size={13} color="#38bdf8" />
          Checkpoint Weather Sampling Interval
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
          {[
            { val: 10, label: '10 Miles', desc: 'Dense' },
            { val: 25, label: '25 Miles', desc: 'Standard (Recommended)' },
            { val: 50, label: '50 Miles', desc: 'Express' },
          ].map((opt) => {
            const isSelected = Number(samplingIntervalMiles) === opt.val;
            return (
              <button
                key={opt.val}
                type="button"
                className={`preset-chip ${isSelected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '7px 4px',
                  justifyContent: 'center',
                }}
                onClick={() => setSamplingIntervalMiles(opt.val)}
              >
                <span style={{ fontWeight: isSelected ? 700 : 500 }}>{opt.label}</span>
                <span style={{ fontSize: '0.66rem', color: isSelected ? '#38bdf8' : '#64748b' }}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Button */}
      <div style={{ marginTop: 20 }}>
        <motion.button
          type="button"
          className="btn-primary"
          onClick={onCalculate}
          disabled={isLoading || !origin || !destination}
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spin-animation" />
              <span>Analyzing 3 Routes &amp; Weather Checkpoints...</span>
            </>
          ) : (
            <>
              <Navigation size={18} />
              <span>Calculate &amp; Rank Safe Routes</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
