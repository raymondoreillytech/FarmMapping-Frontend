import { MapContainer, TileLayer } from "react-leaflet";

export function MapView() {
  return (
    <MapContainer
      center={[40.2, -7.5]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
