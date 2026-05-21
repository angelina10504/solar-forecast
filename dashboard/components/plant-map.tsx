"use client";

import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Bhadla Solar Park coordinates
const BHADLA = { lat: 27.5, lon: 71.9 };

export function PlantMap() {
  return (
    <div className="h-[400px] w-full rounded-b-md overflow-hidden">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: BHADLA.lon,
          latitude: BHADLA.lat,
          zoom: 5.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <Marker
          longitude={BHADLA.lon}
          latitude={BHADLA.lat}
          anchor="bottom"
        >
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute w-10 h-10 rounded-full bg-orange-400/30 animate-ping" />
            {/* Solid dot */}
            <div className="relative w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-lg" />
          </div>
        </Marker>
      </Map>
    </div>
  );
}
