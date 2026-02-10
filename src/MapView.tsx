import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import ObservationsLayer from "./ObservationsLayer";
import { Slider } from "@mui/material";
import {
  MAP_VERSION_MARKS,
  MAP_VERSION_MAX,
  MAP_VERSION_MIN,
  mapVersionValueText,
} from "./mapView.constants";
import { mapVersionSliderSx } from "./mapView.styles";
import "./MapViewSlider.css";
import "./MapView.css";

type Meta = {
  minZoom: number;
  maxZoom: number; // native max zoom your tiles exist for
  tileUrlTemplate: string;
  bounds3857: { minX: number; minY: number; maxX: number; maxY: number };
};

const EXTRA_ZOOM = 2; // allow zoom beyond native tiles (scaled/blurry)

function MapVersionSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="map-version-slider-wrap">
      <Slider
        aria-label="Map Version"
        min={MAP_VERSION_MIN}
        max={MAP_VERSION_MAX}
        getAriaValueText={mapVersionValueText}
        step={null}
        valueLabelDisplay="auto"
        marks={MAP_VERSION_MARKS}
        sx={mapVersionSliderSx}
        value={value}
        onChange={(_, v) => onChange(v as number)}
      />
    </div>
  );
}

function EditButton({
  editMode,
  onClick,
}: {
  editMode: boolean;
  onClick: () => void;
}) {
  return (
    <button className="map-edit-button" onClick={onClick}>
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
      `/api/tiles/metadata?version=${encodeURIComponent(String(sliderValue))}`,
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
  const uiMaxZoom = meta.maxZoom + EXTRA_ZOOM;

  return (
    <div className="map-view-root">
      <div className="map-view-canvas">
        <MapContainer
          center={[0, 0]}
          zoom={1}
          minZoom={meta.minZoom}
          maxZoom={uiMaxZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <FitToMeta meta={meta} />
          <TileLayer
            url={meta.tileUrlTemplate}
            minZoom={meta.minZoom}
            maxNativeZoom={meta.maxZoom}
            maxZoom={uiMaxZoom}
            tms={true}
            noWrap
          />
          <ObservationsLayer editMode={editMode} />
        </MapContainer>
      </div>
      <div className="map-view-overlay">
        <div className="map-view-controls">
          <MapVersionSlider value={sliderValue} onChange={setSliderValue} />
          <EditButton
            editMode={editMode}
            onClick={() => setEditMode((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}
