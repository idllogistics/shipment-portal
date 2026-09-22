"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LiveMap({
  lat,
  lng,
  accuracy,
  label,
  className,
}: {
  lat: number;
  lng: number;
  accuracy?: number | null;
  label?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const Lmod = leaflet.default;

      const map = Lmod.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([lat, lng], 14);

      Lmod.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const marker = Lmod.circleMarker([lat, lng], {
        radius: 9,
        color: "#0f172a",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 1,
      }).addTo(map);

      if (label) marker.bindTooltip(label, { permanent: false });

      mapRef.current = map;
      markerRef.current = marker;

      if (accuracy) {
        accuracyRef.current = Lmod.circle([lat, lng], {
          radius: accuracy,
          color: "#3b82f6",
          weight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
        }).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);
    if (accuracyRef.current) {
      accuracyRef.current.setLatLng([lat, lng]);
      if (accuracy) accuracyRef.current.setRadius(accuracy);
    }
  }, [lat, lng, accuracy]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-72 w-full rounded-lg"}
    />
  );
}
