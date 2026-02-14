import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import ObservationsLayer from "./ObservationsLayer";
import {
  API_BASE_URL,
  MAP_VERSION_MIN,
  SHOW_EDIT_BUTTON,
} from "./mapView.constants";
import MapControls from "./MapControls";
import "./MapView.css";

type Meta = {
  minZoom: number;
  maxZoom: number; // native max zoom your tiles exist for
  tileUrlTemplate: string;
  bounds3857: { minX: number; minY: number; maxX: number; maxY: number };
};

const EXTRA_ZOOM = 1; // allow zoom beyond native tiles (scaled/blurry)

function apiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
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

    map.setMaxBounds(bounds);
    (map as any).options.maxBoundsViscosity = 1.0;
  }, [map, meta]);

  return null;
}

export function MapView() {
  const [meta, setMeta] = useState<Meta | null>(null);

  const [editMode, setEditMode] = useState(false);

  const [sliderValue, setSliderValue] = useState(MAP_VERSION_MIN);

  useEffect(() => {
    fetch(
      apiUrl(
        `/api/tiles/metadata?version=${encodeURIComponent(String(sliderValue))}`,
      ),
    )
      .then((r) => {
        if (!r.ok) throw new Error(`metadata failed: ${r.status}`);
        return r.json();
      })
      .then(setMeta)
      .catch(console.error);
  }, [sliderValue]);

  if (!meta) return null;

  if (!meta.tileUrlTemplate) {
    throw new Error("metadata missing tileUrlTemplate");
  }
  const tileUrlTemplate = meta.tileUrlTemplate.startsWith("/")
    ? apiUrl(meta.tileUrlTemplate)
    : meta.tileUrlTemplate;
  const uiMaxZoom = meta.maxZoom + EXTRA_ZOOM;

  return (
    <div className="map-view-root">
      <div className="map-view-canvas">
        <MapContainer
          center={[
            (meta.bounds3857.maxX - meta.bounds3857.minX) / 2,
            (meta.bounds3857.maxY - meta.bounds3857.minY) / 2,
          ]}
          zoom={meta.minZoom + 2}
          minZoom={meta.minZoom}
          maxZoom={uiMaxZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <FitToMeta meta={meta} />
          <TileLayer
            url={tileUrlTemplate}
            minZoom={meta.minZoom}
            maxNativeZoom={meta.maxZoom}
            maxZoom={uiMaxZoom}
            noWrap
          />
          <ObservationsLayer editMode={editMode} />
        </MapContainer>
      </div>
      <div className="map-view-overlay">
        <MapControls
          sliderValue={sliderValue}
          onSliderChange={setSliderValue}
          editMode={editMode}
          onToggleEdit={() => setEditMode((prev) => !prev)}
          showEditButton={SHOW_EDIT_BUTTON}
        />
      </div>
    </div>
  );
}
