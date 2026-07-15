"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Business, MatchCandidate } from "@/lib/api";

function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
        background: ${color}; transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid #FFFDF9;
      ">
        <span style="transform: rotate(45deg); color: #FFFDF9; font-size: 13px; font-weight: 600;">
          ${label}
        </span>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

export function MatchMap({ center, matches }: { center: Business; matches: MatchCandidate[] }) {
  return (
    <div className="rounded-xl overflow-hidden border border-line" style={{ height: 360 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[center.lat, center.lng]} icon={pinIcon("#1C1A17", "Y")}>
          <Popup>
            <strong>{center.name}</strong>
            <br />
            You
          </Popup>
        </Marker>
        {matches.map((m) => (
          <Marker
            key={m.business.id}
            position={[m.business.lat, m.business.lng]}
            icon={pinIcon("#C75D3A", Math.round(m.overall_score).toString())}
          >
            <Popup>
              <strong>{m.business.name}</strong>
              <br />
              {m.business.category.replace("_", " ")} · {m.distance_km} km
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}