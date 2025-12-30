import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Clears highlight when clicking on map background
function MapClickHandler({ onClear }) {
  useMapEvents({
    click: (e) => {
      if (e.originalEvent.target.tagName === "DIV") {
        onClear();
      }
    },
  });
  return null;
}

export default function MapView({ mapView, stations, routes, highlight, onSelect, onClear }) {
  const sfCenter = [37.7749, -122.4194];
  const [hovered, setHovered] = useState({ type: null, id: null });

  const stationMin = Math.min(...stations.map(s => s.total_trips));
  const stationMax = Math.max(...stations.map(s => s.total_trips));
  const routeMin = Math.min(...routes.map(r => r.total_trips));
  const routeMax = Math.max(...routes.map(r => r.total_trips));

  const stationStyle = (trips, isActive, isDimmed, isHovered) => {
    const t = Math.min(1, Math.max(0, (trips - stationMin) / (stationMax - stationMin)));

    let fillOpacity = 0.5 + 0.3 * t;
    let radius = 6;

    if (isHovered) radius = 9;
    if (isActive) radius = 12;
    if (isDimmed) fillOpacity = 0.25;

    return {
      color: "#ec4899",      // pink-500
      fillColor: "#ec4899",
      fillOpacity,
      weight: isActive ? 2 : 1,
      radius
    };
  };


  const routeStyle = (trips, isActive, isDimmed, isHovered) => {
    const t = Math.min(1, Math.max(0, (trips - routeMin) / (routeMax - routeMin)));

    // Color interpolation (light → saturated)
    const baseColor = isActive
      ? "#2563eb" // blue-600
      : isHovered
      ? "#3b82f6" // blue-500
      : `rgba(59, 130, 246, ${0.4 + 0.6 * t})`; // volume-encoded

    let opacity = 0.5 + 0.35 * t;
    let weight = 4 + 2 * t;

    if (isHovered) {
      opacity = 0.9;
      weight = 9;
    }

    if (isActive) {
      opacity = 0.95;
      weight = 11;
    }

    if (isDimmed) {
      opacity = 0.18;
      weight = 3;
    }

    return {
      color: baseColor,
      weight,
      opacity,
    };
  };



  return (
    <MapContainer center={sfCenter} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onClear={onClear} />

      {/* Routes */}
      {mapView !== "stations" &&
        routes.map(route => {
          const routeId = `${route.s1_id}-${route.s2_id}`;
          const isActive = highlight.type === 'route' && highlight.id === routeId;
          const isHovered = hovered.type === 'route' && hovered.id === routeId;
          const isDimmed = highlight.type && !isActive;

          return (
            <Polyline
              key={routeId}
              positions={[[route.s1_lat, route.s1_lng], [route.s2_lat, route.s2_lng]]}
              pathOptions={routeStyle(route.total_trips, isActive, isDimmed, isHovered)}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  onSelect('route', routeId);
                },
                mouseover: () => setHovered({ type: 'route', id: routeId }),
                mouseout: () => setHovered({ type: null, id: null }),
              }}
            >
              {isActive && (
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95} permanent>
                  <div style={{ minWidth: "180px" }}>
                    <strong>🚲 Route</strong>
                    <p>
                      <strong>Stations:</strong><br />
                      {route.s1_name} ↔ {route.s2_name}
                    </p>
                    <p>
                      <strong>Total Trips:</strong> {route.total_trips.toLocaleString()}<br />
                      <strong>Subscribers:</strong> {route.member_trips.toLocaleString()}<br />
                      <strong>Casual:</strong> {route.casual_trips.toLocaleString()}<br />
                      <strong>Avg Duration:</strong> {route.avg_duration_minutes.toFixed(1)} min
                    </p>
                  </div>
                </Tooltip>
              )}
            </Polyline>
          );
        })
      }

      {/* Stations */}
      {mapView !== "routes" &&
        stations.map(station => {
          const stationId = station.station_id;
          const isActive = highlight.type === 'station' && highlight.id === stationId;
          const isHovered = hovered.type === 'station' && hovered.id === stationId;
          const isDimmed = highlight.type && !isActive;

          return (
            <CircleMarker
              key={stationId}
              center={[station.latitude, station.longitude]}
              pathOptions={stationStyle(station.total_trips, isActive, isDimmed, isHovered)}
              eventHandlers={{
                click: (e) => {
                  onSelect('station', stationId);
                },
                mouseover: () => setHovered({ type: 'station', id: stationId }),
                mouseout: () => setHovered({ type: null, id: null }),
              }}
            >
              {isActive && (
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95} permanent>
                  <div style={{ minWidth: "160px" }}>
                    <strong>📍 Station</strong>
                    <p>
                      <strong>Name:</strong> {station.name}
                    </p>
                    <p>
                      <strong>Total Trips:</strong> {station.total_trips.toLocaleString()}<br />
                      <strong>Subscribers:</strong> {station.member_trips.toLocaleString()}<br />
                      <strong>Casual:</strong> {station.casual_trips.toLocaleString()}<br />
                      <strong>Round Trips:</strong> {station.round_trips.toLocaleString()}
                    </p>
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          );
        })
      }
    </MapContainer>
  );
}
