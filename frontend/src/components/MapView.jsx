import React, { useState } from "react";
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Polyline,
  Popup
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ mapView, stations, routes }) {


  const sfCenter = [37.7749, -122.4194];

  const stationMin = Math.min(...stations.map(s => s.total_trips));
  const stationMax = Math.max(...stations.map(s => s.total_trips));

  const routeMin = Math.min(...routes.map(r => r.total_trips));
  const routeMax = Math.max(...routes.map(r => r.total_trips));

  const stationColor = (trips) => {
    const t = Math.min(1, Math.max(0, (trips - stationMin) / (stationMax - stationMin)));
    return `rgba(236, 72, 153, ${0.3 + 0.7 * t})`;
  };

  const routeColor = (trips) => {
    const t = Math.min(1, Math.max(0, (trips - routeMin) / (routeMax - routeMin)));
    return `rgba(59, 130, 246, ${0.3 + 0.7 * t})`;
  };

  return (
    <MapContainer center={sfCenter} zoom={13} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {mapView !== "stations" && 
          routes.map(route => {
          const routeId = `${route.s1_id}-${route.s2_id}`;
          return (
            <Polyline
              key={routeId}
              positions={[[route.s1_lat, route.s1_lng], [route.s2_lat, route.s2_lng]]}
              color={routeColor(route.total_trips)}
              weight={4}  
              opacity={0.7}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold mb-1">{route.s1_name} ↔ {route.s2_name}</div>
                  <div>Total Trips: {route.total_trips.toLocaleString()}</div>
                  <div>Member: {route.member_trips.toLocaleString()}</div>
                  <div>Casual: {route.casual_trips.toLocaleString()}</div>
                  <div>Avg Duration: {route.avg_duration_minutes.toFixed(1)} min</div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

      {mapView !== "routes" &&
        stations.map((station) => {
          return (
            <CircleMarker
              key={station.station_id}
              center={[station.latitude, station.longitude]}
              radius={6}
              color={stationColor(station.total_trips)}
              fillOpacity={0.7}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-lg mb-1">{station.name}</div>
                  <div className="flex justify-between"><span>Total Trips:</span><span>{station.total_trips.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Member:</span><span>{station.member_trips.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Casual:</span><span>{station.casual_trips.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Round Trips:</span><span>{station.round_trips.toLocaleString()}</span></div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}

    </MapContainer>
  )


}