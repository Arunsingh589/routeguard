import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

if (typeof window !== 'undefined') {
  window.L = L;
}

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
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11, animate: true });
      }
    } catch {
      // ignore
    }
  }, [routes, selectedRoute, map]);

  return null;
}

function MapResizeHandler({ isMobileView }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map, isMobileView]);

  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  return null;
}

function WeatherHeatmapLayer({ corridorMatrix, forecastHour, showHeatmap }) {
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

    const points = [];
    for (const pt of corridorMatrix) {
      const hData = pt.forecast ? pt.forecast[forecastHour] : null;
      if (!hData) continue;
      const intensity = (hData.numeric_risk || 1) / 5.0;
      points.push([pt.lat, pt.lon, Math.max(0.15, intensity)]);
    }

    let layer = null;
    try {
      if (typeof L.heatLayer === 'function') {
        layer = L.heatLayer(points, {
          radius: 35,
          blur: 25,
          maxZoom: 10,
          max: 1.0,
          minOpacity: 0.35,
          gradient: {
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
    } catch {
      // fallback handled below
    }

    return () => {
      if (layer) {
        map.removeLayer(layer);
        heatLayerRef.current = null;
      }
    };
  }, [corridorMatrix, forecastHour, showHeatmap, map]);

  return null;
}

const createPinIcon = (letter, color) =>
  L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
      ">
        ${letter}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const createCheckpointIcon = (risk) => {
  let bgColor = '#10b981';
  if (risk === 'Moderate') bgColor = '#f59e0b';
  else if (risk === 'High') bgColor = '#f97316';
  else if (risk === 'Severe') bgColor = '#ef4444';
  else if (risk === 'No Travel') bgColor = '#c084fc';

  const size = (risk === 'Severe' || risk === 'No Travel') ? 16 : 12;

  return L.divIcon({
    className: 'custom-cp-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bgColor};
        border: 2px solid #ffffff;
        box-shadow: 0 0 8px ${bgColor};
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
  showHeatmap,
  origin,
  destination,
  isMobileView,
}) {
  const mapRef = useRef(null);
  const selectedRoute = routes?.find((r) => r.id === selectedRouteId) || routes?.[0];

  useEffect(() => {
    if (typeof window !== 'undefined' && !L.heatLayer) {
      import('leaflet.heat').catch(() => {});
    }
  }, []);

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
        center={[39.5, -98.35]}
        zoom={4}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-tiles"
          maxZoom={19}
        />

        <MapBoundsUpdater routes={routes} selectedRoute={selectedRoute} />
        <MapResizeHandler isMobileView={isMobileView} />

        <WeatherHeatmapLayer
          corridorMatrix={corridorMatrix}
          forecastHour={forecastHour}
          showHeatmap={showHeatmap}
        />

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

        {routes?.map((route) => {
          const isSelected = route.id === (selectedRoute?.id || selectedRouteId);
          const isRecommended = route.is_recommended;
          const latLngs = route.coordinates.map((pt) => [pt[1], pt[0]]);

          const strokeColor = isSelected ? (isRecommended ? '#10b981' : '#38bdf8') : '#64748b';
          const strokeWidth = isSelected ? 6 : 3;
          const strokeOpacity = isSelected ? 1.0 : 0.65;

          return (
            <React.Fragment key={route.id}>
              {isSelected && (
                <Polyline
                  positions={latLngs}
                  pathOptions={{
                    color: strokeColor,
                    weight: 12,
                    opacity: 0.3,
                    lineCap: 'round',
                  }}
                />
              )}

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
              />
            </React.Fragment>
          );
        })}

        {selectedRoute?.checkpoints?.map((cp) => (
          <Marker
            key={`cp_${cp.index}`}
            position={[cp.lat, cp.lon]}
            icon={createCheckpointIcon(cp.final_risk)}
          >
            <Popup>
              <div className="popup-container">
                <div className="popup-title">
                  Mile {cp.distance_from_start_miles} &bull; {cp.eta_formatted}
                </div>
                <div className="popup-item">
                  <span>Risk Level:</span>
                  <strong style={{ color: getRiskColor(cp.final_risk) }}>
                    {cp.final_risk} ({cp.numeric_risk}/5)
                  </strong>
                </div>
                <div className="popup-item">
                  <span>Wind:</span>
                  <strong>{cp.wind_mph} mph ({cp.wind_risk})</strong>
                </div>
                <div className="popup-item">
                  <span>Rain:</span>
                  <strong>{cp.rain_in_hr} in/hr ({cp.rain_risk})</strong>
                </div>
                {cp.snow_in_hr > 0 && (
                  <div className="popup-item">
                    <span>Snow:</span>
                    <strong>{cp.snow_in_hr} in/hr</strong>
                  </div>
                )}
                <div className="popup-item">
                  <span>Temperature:</span>
                  <strong>{cp.temp_f}&deg;F</strong>
                </div>
                {cp.applied_rule && (
                  <div style={{ fontSize: '0.7rem', color: '#fb923c', marginTop: 4 }}>
                    {cp.applied_rule}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {origin && origin.lat && origin.lon && (
          <Marker position={[origin.lat, origin.lon]} icon={createPinIcon('A', '#10b981')}>
            <Popup>
              <div className="popup-container">
                <div className="popup-title">Origin</div>
                <div>{origin.label}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {destination && destination.lat && destination.lon && (
          <Marker position={[destination.lat, destination.lon]} icon={createPinIcon('B', '#ef4444')}>
            <Popup>
              <div className="popup-container">
                <div className="popup-title">Destination</div>
                <div>{destination.label}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
