import { Marker } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

type Observation = {
  id: number;
  lat: number;
  lon: number;
  iconKey?: string;
  label?: string;
};

function markerDragEnd(
  e: L.LeafletEvent,
  observationId: number,
  setObservations: React.Dispatch<React.SetStateAction<Observation[] | null>>,
) {
  return () => {
    const marker = e.target as L.Marker;
    const position = marker.getLatLng();
    console.log(`Observation ${observationId} moved to`, position);

    fetch(`/api/observations/${observationId}/location`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat: position.lat, lon: position.lng }),
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `Failed to update observation location: ${res.status}`,
          );
        setObservations((prev) =>
          prev
            ? prev.map((o) =>
                o.id === observationId
                  ? { ...o, lat: position.lat, lon: position.lng }
                  : o,
              )
            : prev,
        );
      })
      .catch((err) => {
        console.error("Failed to update observation location:", err);
        throw err;
      });
  };
}

export function ObservationsLayer({ editMode }: { editMode: boolean }) {
  const [observations, setObservations] = useState<Observation[] | null>(null);

  useEffect(() => {
    fetch("/api/observations")
      .then((r) => {
        if (!r.ok) throw new Error(`observation fetch failed: ${r.status}`);
        return r.json();
      })
      .then(setObservations)
      .catch(console.error);
  }, []);

  if (!observations) return null;

  return (
    <>
      {observations.map((observation) => (
        <Marker
          position={[observation.lat, observation.lon]}
          icon={L.icon({
            iconUrl: "/icons/" + observation.iconKey + ".png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })}
          key={observation.id + "" + editMode}
          title={observation.label || ""}
          draggable={editMode}
          eventHandlers={{
            dragend: (e) => markerDragEnd(e, observation.id, setObservations)(),
          }}
        ></Marker>
      ))}
    </>
  );
}

export default ObservationsLayer;
