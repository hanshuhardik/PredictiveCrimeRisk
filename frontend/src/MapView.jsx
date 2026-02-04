import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';

const API_BASE = 'http://localhost:5000';

function safetyColor(score) {
  if (score === null || score === undefined) return 'gray';
  if (score >= 80) return '#16a34a'; // green
  if (score >= 60) return '#ca8a04'; // yellow
  if (score >= 40) return '#f97316'; // orange
  return '#dc2626'; // red
}

export default function MapView({ stations = [], onStationClick }) {
  const mapRef = useRef(null);

  const markers = useMemo(() => {
    return stations.filter(s => {
      return s.Latitude_mean !== null && s.Latitude_mean !== undefined &&
             s.Longitude_mean !== null && s.Longitude_mean !== undefined &&
             !isNaN(s.Latitude_mean) && !isNaN(s.Longitude_mean);
    });
  }, [stations]);

  // Auto-fit map bounds when stations change
  useEffect(() => {
    if (markers.length > 0 && mapRef.current) {
      const lats = markers.map(m => m.Latitude_mean);
      const lons = markers.map(m => m.Longitude_mean);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const bounds = L.latLngBounds([[minLat, minLon], [maxLat, maxLon]]);
      
      // Add padding and fit
      setTimeout(() => {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }, 100);
    } else if (mapRef.current && markers.length === 0) {
      // Reset to full Karnataka view
      mapRef.current.setView([15.5, 76.0], 7);
    }
  }, [markers]);

  const Legend = () => (
    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded shadow p-3 text-sm z-[1000]">
      <div className="font-semibold mb-2">Safety Legend</div>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ width: 12, height: 12, background: '#16a34a', display: 'inline-block', borderRadius: 2 }} />
        <span>Safe</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ width: 12, height: 12, background: '#ca8a04', display: 'inline-block', borderRadius: 2 }} />
        <span>Moderate</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ width: 12, height: 12, background: '#f97316', display: 'inline-block', borderRadius: 2 }} />
        <span>Elevated</span>
      </div>
      <div className="flex items-center gap-2">
        <span style={{ width: 12, height: 12, background: '#dc2626', display: 'inline-block', borderRadius: 2 }} />
        <span>High Risk</span>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full relative">
      <MapContainer ref={mapRef} center={[15.5, 76.0]} zoom={7} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((s, idx) => (
          <CircleMarker
            key={idx}
            center={[s.Latitude_mean, s.Longitude_mean]}
            radius={6}
            pathOptions={{
              color: safetyColor(s.SAFETY_INDEX),
              fillColor: safetyColor(s.SAFETY_INDEX),
              fillOpacity: 0.7,
              weight: 2
            }}
            eventHandlers={{
              click: () => onStationClick && onStationClick(s)
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div style={{ minWidth: '220px' }}>
                <strong>{s.UnitName}</strong><br />
                District: {s.District_Name}<br />
                Safety Index: {s.SAFETY_INDEX?.toFixed(1)}<br />
                Total FIRs: {s.TOTAL_FIRs ?? 'N/A'}<br />
                Heinous FIRs: {s.HEINOUS_FIRs ?? 'N/A'}<br />
                FIRs/Year: {s.FIRs_PER_YEAR?.toFixed(1) ?? 'N/A'}<br />
                {s.RISK_LEVEL && (<span>Risk Level: {s.RISK_LEVEL}<br /></span>)}
                {s.predicted_FIRs_next_year !== undefined && s.predicted_FIRs_next_year !== null && (
                  <span>Predicted FIRs: {s.predicted_FIRs_next_year?.toFixed(1)}<br /></span>
                )}
                {s.trend_direction && (<span>Trend: {s.trend_direction}</span>)}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <Legend />

      {/* Station Count Badge */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 text-sm z-[999]">
        <p className="font-semibold text-slate-800">{markers.length} Stations Visible</p>
      </div>
    </div>
  );
}
