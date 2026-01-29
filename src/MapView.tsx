import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import ObservationsLayer from "./ObservationsLayer";

type Meta = {
  minZoom: number;
  maxZoom: number; // native max zoom your tiles exist for
  tileUrlTemplate: string;
  bounds3857: { minX: number; minY: number; maxX: number; maxY: number };
};

const EXTRA_ZOOM = 2; // allow zoom beyond native tiles (scaled/blurry)

function EditButton({
  editMode,
  onClick,
}: {
  editMode: boolean;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        position: "absolute",
        height: 40,
        width: 100,
        top: 10,
        left: 50,
        zIndex: 1000,
      }}
      onClick={onClick}
    >
      Edit Map {editMode ? "ON" : "OFF"}
    </button>
  );
}

function FitToMeta({ meta }: { meta: Meta }) {
  const map = useMap();

  useEffect(() => {
    const b = meta.bounds3857;
    const sw = (L.Projection as any).SphericalMercator.unproject(
      L.point(b.minX, b.minY),
    );
    const ne = (L.Projection as any).SphericalMercator.unproject(
      L.point(b.maxX, b.maxY),
    );
    const bounds = L.latLngBounds(sw, ne);

    map.fitBounds(bounds, { maxZoom: meta.maxZoom });

    const onZoomEnd = () => console.log("zoom ->", map.getZoom());
    map.on("zoomend", onZoomEnd);

    map.setMaxBounds(bounds);
    (map as any).options.maxBoundsViscosity = 1.0;

    return () => map.off("zoomend", onZoomEnd);
  }, [map, meta]);

  return null;
}

export function MapView() {
  const [meta, setMeta] = useState<Meta | null>(null);

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetch("/api/tiles/metadata")
      .then((r) => {
        if (!r.ok) throw new Error(`metadata failed: ${r.status}`);
        return r.json();
      })
      .then(setMeta)
      .catch(console.error);
  }, []);

  if (!meta) return null;

  if (!meta.tileUrlTemplate) {
    throw new Error("metadata missing tileUrlTemplate");
  }

  const uiMaxZoom = meta.maxZoom + EXTRA_ZOOM;

  return (
    <MapContainer
      center={[0, 0]}
      zoom={1}
      minZoom={meta.minZoom}
      maxZoom={uiMaxZoom}
      style={{ height: "100vh", width: "100vw" }}
    >
      <FitToMeta meta={meta} />
      <TileLayer
        url={meta.tileUrlTemplate}
        minZoom={meta.minZoom}
        maxNativeZoom={meta.maxZoom}
        maxZoom={uiMaxZoom}
        noWrap
      />
      <EditButton
        editMode={editMode}
        onClick={() => setEditMode((prev) => !prev)}
      />
      <ObservationsLayer editMode={editMode} />
    </MapContainer>
  );
}
