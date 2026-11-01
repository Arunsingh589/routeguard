import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import {
  Wind,
  CloudRain,
  Snowflake,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Layers,
  Maximize2,
} from 'lucide-react';

// Setup global L for leaflet.heat if in browser
if (typeof window !== 'undefined') {
  window.L = L;
}

// Map helper to auto-fit bounds on route change
function MapBoundsUpdater({ routes, selectedRoute }) {
  const map = useMap();

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    try {
      const allCoords = [];
      const routeToFit = selectedRoute || routes[0];

      if (routeToFit && routeToFit.coordinates) {
        routeToFit.coordinates.forEach((pt) => {
          allCoords.push([pt[1], pt[0]]);
        });
      }

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true });
      }
    } catch (err) {
      console.warn('Could not fit map bounds:', err);
    }
  }, [routes, selectedRoute, map]);

  return null;
}

// Dynamic Heatmap Layer Component using leaflet.heat or radial circles
function WeatherHeatmapLayer({ corridorMatrix, forecastHour, activeMetric, showHeatmap }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!showHeatmap || !corridorMatrix || corridorMatrix.length === 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    // Prepare [lat, lon, intensity] array
    const points = [];
    for (const pt of corridorMatrix) {
      const hData = pt.forecast ? pt.forecast[forecastHour] : null;
      if (!hData) continue;

      let intensity = 0.2;
      if (activeMetric === 'risk') {
        intensity = (hData.numeric_risk || 1) / 5.0;
      } else if (activeMetric === 'wind') {
        intensity = Math.min(1.0, (hData.wind_mph || 0) / 60.0);
      } else if (activeMetric === 'rain') {
        intensity = Math.min(1.0, (hData.rain_in_hr || 0) / 1.0);
      } else if (activeMetric === 'snow') {
        intensity = Math.min(1.0, (hData.snow_in_hr || 0) / 3.0);
      } else if (activeMetric === 'temp') {
        intensity = Math.min(1.0, Math.max(0.0, ((hData.temp_f || 60) - 20) / 80.0));
      }

      points.push([pt.lat, pt.lon, Math.max(0.1, intensity)]);
    }

    // Try using L.heatLayer if available
    let layer = null;
    try {
      if (typeof L.heatLayer === 'function') {
        layer = L.heatLayer(points, {
          radius: 35,
          blur: 25,
          maxZoom: 10,
          max: 1.0,
          minOpacity: 0.35,
          gradient:
            activeMetric === 'temp'
              ? {
                  0.2: '#3b82f6',
                  0.4: '#06b6d4',
                  0.6: '#10b981',
                  0.8: '#f59e0b',
                  1.0: '#ef4444',
                }
              : {
                  0.15: '#10b981',
                  0.4: '#f59e0b',
                  0.65: '#f97316',
                  0.85: '#ef4444',
                  1.0: '#c084fc',
                },
        });
        layer.addTo(map);
        heatLayerRef.current = layer;
      }
    } catch (e) {
      console.warn('L.heatLayer failed, fallback will be used:', e);
    }

    return () => {
      if (layer) {
        map.removeLayer(layer);
        heatLayerRef.current = null;
      }
    };
  }, [corridorMatrix, forecastHour, activeMetric, showHeatmap, map]);

  return null;
}

// Marker generators
const createOriginIcon = () =>
  L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #10b981;
        border: 2px solid #ffffff;
        box-shadow: 0 0 14px #10b981;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 14px;
        font-weight: bold;
      ">
        A
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const createDestIcon = () =>
  L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #ef4444;
        border: 2px solid #ffffff;
        box-shadow: 0 0 14px #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 14px;
        font-weight: bold;
      ">
        B
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const createCheckpointIcon = (risk, index) => {
  let bgColor = '#10b981';
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  if (risk === 'Moderate') {
    bgColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.5)';
  } else if (risk === 'High') {
    bgColor = '#f97316';
    glowColor = 'rgba(249, 115, 22, 0.6)';
  } else if (risk === 'Severe') {
    bgColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.8)';
  } else if (risk === 'No Travel') {
    bgColor = '#c084fc';
    glowColor = 'rgba(192, 132, 252, 0.9)';
  }

  const isSevereOrNoTravel = risk === 'Severe' || risk === 'No Travel';
  const size = isSevereOrNoTravel ? 20 : 14;

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bgColor};
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${glowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function MapViewer({
  routes,
  selectedRouteId,
  onSelectRoute,
  corridorMatrix,
  forecastHour,
  activeMetric,
  showHeatmap,
  origin,
  destination,
  selectedCheckpoint,
}) {
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' or 'light'
  const mapRef = useRef(null);

  const selectedRoute = routes?.find((r) => r.id === selectedRouteId) || routes?.[0];

  // Try dynamically loading leaflet.heat plugin
  useEffect(() => {
    if (typeof window !== 'undefined' && !L.heatLayer) {
      import('leaflet.heat')
        .then(() => console.log('Leaflet heat library loaded successfully'))
        .catch((e) => console.warn('Could not load leaflet.heat script:', e));
    }
  }, []);

  const defaultCenter = [39.5, -98.35]; // Center of USA

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'No Travel': return '#c084fc';
      case 'Severe': return '#ef4444';
      case 'High': return '#f97316';
      case 'Moderate': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={4}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        {/* OpenStreetMap tiles with no API key requirement */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={mapStyle === 'dark' ? 'dark-tiles' : ''}
          maxZoom={19}
        />

        {/* Dynamic bounds updater */}
        <MapBoundsUpdater routes={routes} selectedRoute={selectedRoute} />

        {/* Dynamic Weather Heatmap Layer */}
        <WeatherHeatmapLayer
          corridorMatrix={corridorMatrix}
          forecastHour={forecastHour}
          activeMetric={activeMetric}
          showHeatmap={showHeatmap}
        />

        {/* Fallback radial glow circles if leaflet.heat is loading or as crisp overlay */}
        {showHeatmap &&
          corridorMatrix?.map((pt, idx) => {
            const hData = pt.forecast ? pt.forecast[forecastHour] : null;
            if (!hData) return null;
            const color = getRiskColor(hData.final_risk);
            const isSevere = hData.final_risk === 'Severe' || hData.final_risk === 'No Travel';
            return (
              <CircleMarker
                key={`heat_pt_${idx}`}
                center={[pt.lat, pt.lon]}
                radius={isSevere ? 18 : 12}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isSevere ? 0.45 : 0.25,
                  weight: 0,
                }}
              />
            );
          })}

        {/* Polylines for all 3 routes */}
        {routes?.map((route) => {
          const isSelected = route.id === (selectedRoute?.id || selectedRouteId);
          const isRecommended = route.is_recommended;
          const latLngs = route.coordinates.map((pt) => [pt[1], pt[0]]);

          let strokeColor = '#475569';
          let strokeWidth = 3;
          let strokeOpacity = 0.5;

          if (isSelected) {
            strokeColor = isRecommended ? '#10b981' : '#38bdf8';
            strokeWidth = 6;
            strokeOpacity = 0.95;
          }

          return (
            <React.Fragment key={route.id}>
              {/* Outer glow line for selected route */}
              {isSelected && (
                <Polyline
                  positions={latLngs}
                  pathOptions={{
                    color: strokeColor,
                    weight: 12,
                    opacity: 0.35,
                    lineCap: 'round',
                  }}
                />
              )}

              {/* Main polyline */}
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: strokeColor,
                  weight: strokeWidth,
                  opacity: strokeOpacity,
                  dashArray: isSelected ? undefined : '5, 8',
                }}
                eventHandlers={{
                  click: () => onSelectRoute(route.id),
                }}
              >
                <Popup>
                  <div className="popup-container">
                    <div className="popup-header">
                      {route.name} {isRecommended && '★ (Recommended)'}
                    </div>
                    <div className="popup-row">
                      <span>Rank:</span>
                      <strong>Option #{route.rank}</strong>
                    </div>
                    <div className="popup-row">
                      <span>Travel Duration:</span>
                      <strong>{route.duration_formatted}</strong>
                    </div>
                    <div className="popup-row">
                      <span>Distance:</span>
                      <strong>{route.distance_miles} miles</strong>
                    </div>
                    <div className="popup-row">
                      <span>Severe Weather Miles:</span>
                      <strong style={{ color: (route.stats?.severe_miles || 0) > 0 ? '#ef4444' : '#10b981' }}>
                        {route.stats?.severe_miles || 0} mi
                      </strong>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Checkpoint Markers for the Selected Route */}
        {selectedRoute?.checkpoints?.map((cp) => (
          <Marker
            key={`cp_${cp.index}`}
            position={[cp.lat, cp.lon]}
            icon={createCheckpointIcon(cp.final_risk, cp.index)}
          >
            <Popup>
              <div className="popup-container">
                <div className="popup-header">
                  Checkpoint #{cp.index + 1} &bull; Mile {cp.distance_from_start_miles}
                </div>
                <div className="popup-row">
                  <span>Estimated Arrival:</span>
                  <strong>{cp.eta_formatted}</strong>
                </div>
                <div className="popup-row">
                  <span>Corridor Risk Score:</span>
                  <strong style={{ color: getRiskColor(cp.final_risk) }}>
                    {cp.final_risk} ({cp.numeric_risk}/5)
                  </strong>
                </div>
                <div className="popup-row">
                  <span>Wind Speed:</span>
                  <strong>{cp.wind_mph} mph ({cp.wind_risk})</strong>
                </div>
                <div className="popup-row">
                  <span>Rain Intensity:</span>
                  <strong>{cp.rain_in_hr} in/hr ({cp.rain_risk})</strong>
                </div>
                {cp.snow_in_hr > 0 && (
                  <div className="popup-row">
                    <span>Snowfall Rate:</span>
                    <strong>{cp.snow_in_hr} in/hr ({cp.snow_risk})</strong>
                  </div>
                )}
                <div className="popup-row">
                  <span>Temperature:</span>
                  <strong>{cp.temp_f}&deg;F</strong>
                </div>
                {cp.applied_rule && (
                  <div style={{
                    marginTop: 6,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    fontSize: '0.72rem',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}>
                    <strong>Rule Triggered:</strong> {cp.applied_rule}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Origin Marker */}
        {origin && origin.lat && origin.lon && (
          <Marker position={[origin.lat, origin.lon]} icon={createOriginIcon()}>
            <Popup>
              <div className="popup-container">
                <div className="popup-header" style={{ color: '#10b981' }}>
                  Trip Origin
                </div>
                <div style={{ fontSize: '0.84rem', color: '#f8fafc' }}>{origin.label}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && destination.lat && destination.lon && (
          <Marker position={[destination.lat, destination.lon]} icon={createDestIcon()}>
            <Popup>
              <div className="popup-container">
                <div className="popup-header" style={{ color: '#ef4444' }}>
                  Trip Destination
                </div>
                <div style={{ fontSize: '0.84rem', color: '#f8fafc' }}>{destination.label}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Style & View Toggle in bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        gap: 6,
      }}>
        <button
          type="button"
          className="btn-glass"
          style={{ padding: '5px 10px', fontSize: '0.72rem' }}
          onClick={() => setMapStyle(mapStyle === 'dark' ? 'light' : 'dark')}
        >
          <Layers size={13} />
          <span>{mapStyle === 'dark' ? 'Light Map' : 'Dark Navigation'}</span>
        </button>
      </div>
    </div>
  );
}
