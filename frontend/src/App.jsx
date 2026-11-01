import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RouteConfigPanel from './components/RouteConfigPanel';
import RouteComparisonList from './components/RouteComparisonList';
import CheckpointTimeline from './components/CheckpointTimeline';
import HeatmapTimelineSlider from './components/HeatmapTimelineSlider';
import MapViewer from './components/MapViewer';
import { fetchPresets, analyzeRoutes } from './api';
import { SlidersHorizontal, Map as MapIcon } from 'lucide-react';

export default function App() {
  const [presets, setPresets] = useState([]);
  const [mobileTab, setMobileTab] = useState('routes');

  const [origin, setOrigin] = useState({
    city: 'Chicago',
    state: 'IL',
    lat: 41.8781,
    lon: -87.6298,
    label: 'Chicago, IL',
  });
  const [destination, setDestination] = useState({
    city: 'Dallas',
    state: 'TX',
    lat: 32.7767,
    lon: -96.7970,
    label: 'Dallas, TX',
  });

  const getInitialDepartureTime = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [departureTime, setDepartureTime] = useState(getInitialDepartureTime());
  const [loadWeightLbs, setLoadWeightLbs] = useState(35000);
  const [samplingIntervalMiles, setSamplingIntervalMiles] = useState(25);

  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  const [forecastHour, setForecastHour] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchPresets().then((data) => {
      if (data?.presets) setPresets(data.presets);
    });
  }, []);

  const handleCalculateRoutes = async (overrideParams = null) => {
    const orig = overrideParams?.origin || origin;
    const dest = overrideParams?.destination || destination;
    const weight = overrideParams?.loadWeightLbs !== undefined ? overrideParams.loadWeightLbs : loadWeightLbs;
    const interval = overrideParams?.samplingIntervalMiles !== undefined ? overrideParams.samplingIntervalMiles : samplingIntervalMiles;
    const depTime = overrideParams?.departureTime || departureTime;

    if (!orig || !dest) {
      setErrorMsg('Please specify both an origin and destination.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const results = await analyzeRoutes({
        origin: orig,
        destination: dest,
        departureTime: depTime,
        loadWeightLbs: weight,
        samplingIntervalMiles: interval,
      });

      setAnalysisResults(results);
      if (results.routes && results.routes.length > 0) {
        setSelectedRouteId(results.metadata?.recommended_route_id || results.routes[0].id);
      }
      if (window.innerWidth <= 768) {
        setMobileTab('map');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to calculate routes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleCalculateRoutes();
  }, []);

  const currentRoute =
    analysisResults?.routes?.find((r) => r.id === selectedRouteId) ||
    analysisResults?.routes?.[0];

  return (
    <div className="app-container">
      <Header mobileTab={mobileTab} setMobileTab={setMobileTab} />

      <div className="main-content">
        <div className={`sidebar-panel ${mobileTab === 'routes' ? 'mobile-active' : ''}`}>
          <div className="sidebar-inner">
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '8px 12px',
                borderRadius: 6,
                color: '#fca5a5',
                fontSize: '0.8rem',
              }}>
                {errorMsg}
              </div>
            )}

            <RouteConfigPanel
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              departureTime={departureTime}
              setDepartureTime={setDepartureTime}
              loadWeightLbs={loadWeightLbs}
              setLoadWeightLbs={setLoadWeightLbs}
              samplingIntervalMiles={samplingIntervalMiles}
              setSamplingIntervalMiles={setSamplingIntervalMiles}
              presets={presets}
              onCalculate={handleCalculateRoutes}
              isLoading={isLoading}
            />

            {analysisResults?.routes && (
              <RouteComparisonList
                routes={analysisResults.routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(id) => {
                  setSelectedRouteId(id);
                  setSelectedCheckpoint(null);
                  if (window.innerWidth <= 768) {
                    setMobileTab('map');
                  }
                }}
              />
            )}

            {currentRoute && (
              <CheckpointTimeline
                checkpoints={currentRoute.checkpoints}
                selectedCheckpointIndex={selectedCheckpoint?.index}
                onSelectCheckpoint={(cp) => {
                  setSelectedCheckpoint(cp);
                  if (window.innerWidth <= 768) {
                    setMobileTab('map');
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="map-panel">
          <MapViewer
            routes={analysisResults?.routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            corridorMatrix={analysisResults?.corridor_forecast_matrix}
            forecastHour={forecastHour}
            showHeatmap={showHeatmap}
            origin={origin}
            destination={destination}
            isMobileView={mobileTab === 'map'}
          />

          {analysisResults?.corridor_forecast_matrix && (
            <HeatmapTimelineSlider
              forecastHour={forecastHour}
              setForecastHour={setForecastHour}
              showHeatmap={showHeatmap}
              setShowHeatmap={setShowHeatmap}
              departureTime={departureTime}
            />
          )}

          {/* Floating Mobile Pill Switcher */}
          <div className="mobile-nav-toggle" style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
          }}>
            <button
              type="button"
              className="mobile-tab-btn"
              onClick={() => setMobileTab('routes')}
              style={{
                background: 'rgba(13, 20, 36, 0.95)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '6px 14px',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <SlidersHorizontal size={12} />
              <span>Trip Options &amp; List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
