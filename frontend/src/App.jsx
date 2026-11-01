import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import RiskRubricModal from './components/RiskRubricModal';
import RouteConfigPanel from './components/RouteConfigPanel';
import RouteComparisonList from './components/RouteComparisonList';
import CheckpointTimeline from './components/CheckpointTimeline';
import HeatmapTimelineSlider from './components/HeatmapTimelineSlider';
import MapViewer from './components/MapViewer';
import { fetchPresets, analyzeRoutes } from './api';
import { AlertCircle, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function App() {
  // Preset list
  const [presets, setPresets] = useState([]);

  // Form State
  const [origin, setOrigin] = useState({
    city: 'Chicago',
    state: 'IL',
    lat: 41.8781,
    lon: -87.6298,
    label: 'Chicago, IL (Midwest Hub)',
  });
  const [destination, setDestination] = useState({
    city: 'Dallas',
    state: 'TX',
    lat: 32.7767,
    lon: -96.7970,
    label: 'Dallas, TX (South Central Hub)',
  });

  const getInitialDepartureTime = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [departureTime, setDepartureTime] = useState(getInitialDepartureTime());
  const [loadWeightLbs, setLoadWeightLbs] = useState(35000);
  const [samplingIntervalMiles, setSamplingIntervalMiles] = useState(25);

  // Results State
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  // Heatmap State
  const [forecastHour, setForecastHour] = useState(0);
  const [activeMetric, setActiveMetric] = useState('risk');
  const [showHeatmap, setShowHeatmap] = useState(true);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showRubricModal, setShowRubricModal] = useState(false);

  // Load Presets on Mount
  useEffect(() => {
    async function init() {
      const data = await fetchPresets();
      if (data && data.presets) {
        setPresets(data.presets);
      }
    }
    init();
  }, []);

  // Perform Route Calculation
  const handleCalculateRoutes = async () => {
    if (!origin || !destination) {
      setErrorMsg('Please select both an Origin and a Destination.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const results = await analyzeRoutes({
        origin,
        destination,
        departureTime,
        loadWeightLbs,
        samplingIntervalMiles,
      });

      setAnalysisResults(results);
      if (results.routes && results.routes.length > 0) {
        // Default to the #1 Recommended Route
        setSelectedRouteId(results.metadata?.recommended_route_id || results.routes[0].id);
      }
    } catch (err) {
      console.error('Failed to analyze routes:', err);
      setErrorMsg(err.message || 'Failed to calculate routes. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial calculation once presets/defaults are ready
  useEffect(() => {
    handleCalculateRoutes();
  }, []);

  const currentRoute =
    analysisResults?.routes?.find((r) => r.id === selectedRouteId) ||
    analysisResults?.routes?.[0];

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        onOpenRubric={() => setShowRubricModal(true)}
      />

      {/* Main Split Layout */}
      <div className="main-content">
        {/* Left Sidebar Panel */}
        <div className="sidebar-panel">
          <div className="sidebar-inner">
            {/* Error Message Toast */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  color: '#fca5a5',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Route Input Configuration Card */}
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

            {/* Route Options Comparison Cards */}
            {analysisResults && analysisResults.routes && (
              <RouteComparisonList
                routes={analysisResults.routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(id) => {
                  setSelectedRouteId(id);
                  setSelectedCheckpoint(null);
                }}
              />
            )}

            {/* Selected Route Checkpoint Timeline */}
            {currentRoute && (
              <CheckpointTimeline
                checkpoints={currentRoute.checkpoints}
                selectedCheckpointIndex={selectedCheckpoint?.index}
                onSelectCheckpoint={(cp) => setSelectedCheckpoint(cp)}
              />
            )}
          </div>
        </div>

        {/* Right Map Area */}
        <div className="map-panel">
          <MapViewer
            routes={analysisResults?.routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            corridorMatrix={analysisResults?.corridor_forecast_matrix}
            forecastHour={forecastHour}
            activeMetric={activeMetric}
            showHeatmap={showHeatmap}
            origin={origin}
            destination={destination}
            selectedCheckpoint={selectedCheckpoint}
          />

          {/* Floating Weather Heatmap Controller */}
          {analysisResults?.corridor_forecast_matrix && (
            <HeatmapTimelineSlider
              forecastHour={forecastHour}
              setForecastHour={setForecastHour}
              activeMetric={activeMetric}
              setActiveMetric={setActiveMetric}
              showHeatmap={showHeatmap}
              setShowHeatmap={setShowHeatmap}
              corridorMatrix={analysisResults.corridor_forecast_matrix}
              departureTime={departureTime}
            />
          )}
        </div>
      </div>

      {/* Official Assessment Risk Rubric Modal */}
      <RiskRubricModal
        isOpen={showRubricModal}
        onClose={() => setShowRubricModal(false)}
      />
    </div>
  );
}
