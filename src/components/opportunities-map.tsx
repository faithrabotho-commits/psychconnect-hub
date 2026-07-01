import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Pin = { id: string; lat: number; lng: number; title: string; subtitle?: string };

// Fix default marker icons for bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function OpportunitiesMap({ pins, onSelect }: { pins: Pin[]; onSelect?: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView([-29.5, 24.5], 5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers: L.Marker[] = [];
    pins.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`<strong>${p.title}</strong>${p.subtitle ? `<br/><span style="color:#64748b">${p.subtitle}</span>` : ""}`);
      if (onSelect) m.on("click", () => onSelect(p.id));
      layers.push(m);
    });
    if (pins.length > 0) {
      map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [30, 30] });
    }
    return () => layers.forEach((l) => l.remove());
  }, [pins, onSelect]);

  return <div ref={ref} className="h-96 w-full" aria-label="Map of opportunities" />;
}
