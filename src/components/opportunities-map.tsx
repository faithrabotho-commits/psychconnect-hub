import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Pin = { id: string; lat: number; lng: number; title: string; subtitle?: string };

export function OpportunitiesMap({ pins, onSelect }: { pins: Pin[]; onSelect?: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = icon;
      const map = L.map(containerRef.current).setView([-29.5, 24.5], 5);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO", maxZoom: 18,
      }).addTo(map);
      mapRef.current = map;
      renderPins();
    })();
    return () => { cancelled = true; mapRef.current?.remove?.(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    renderPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  function renderPins() {
    const L = LRef.current, map = mapRef.current;
    if (!L || !map) return;
    map.eachLayer((layer: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((layer as any) instanceof L.Marker) map.removeLayer(layer);
    });
    pins.forEach((p) => {
      const m = L.marker([p.lat, p.lng]).addTo(map)
        .bindPopup(`<strong>${p.title}</strong>${p.subtitle ? `<br/><span style="color:#64748b">${p.subtitle}</span>` : ""}`);
      if (onSelect) m.on("click", () => onSelect(p.id));
    });
    if (pins.length) map.fitBounds(L.latLngBounds(pins.map((p: Pin) => [p.lat, p.lng])), { padding: [30, 30] });
  }

  return <div ref={containerRef} className="h-96 w-full" aria-label="Map of opportunities" />;
}
