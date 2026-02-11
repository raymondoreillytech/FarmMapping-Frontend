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

const EXTRA_ZOOM = 1; // allow zoom beyond native tiles (scaled/blurry)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

function apiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function MapVersionSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const selectedMark = MAP_VERSION_MARKS.find((item) => item.value === value);
  const selectedLabel = selectedMark ? selectedMark.label : `Version ${value}`;
  const sliderMarks = MAP_VERSION_MARKS.map((item) => ({ value: item.value }));

  return (
    <div className="map-version-slider-wrap">
      <div className="map-version-slider-header">
        <span className="map-version-slider-title">Date</span>
        <span className="map-version-slider-value">{selectedLabel}</span>
      </div>
      <Slider
        className="map-version-slider"
        aria-label="Map Version"
        min={MAP_VERSION_MIN}
        max={MAP_VERSION_MAX}
        getAriaValueText={mapVersionValueText}
        step={null}
        valueLabelDisplay="off"
        marks={sliderMarks}
        sx={mapVersionSliderSx}
        value={value}
        onChange={(_, v) => onChange(v as number)}
      />
      <div className="map-version-ticks" aria-hidden="true">
        {MAP_VERSION_MARKS.map((item, index) => (
          <span
            key={item.value}
            className={`map-version-tick${
              index === 0
                ? " is-first"
                : index === MAP_VERSION_MARKS.length - 1
                  ? " is-last"
                  : " is-middle"
            }${item.value === value ? " is-active" : ""}`}
          >
            {item.label}
          </span>
        ))}
      </div>
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
    <button
      className={`map-edit-button${editMode ? " is-on" : ""}`}
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
            tms={true}
            noWrap
          />
          <ObservationsLayer editMode={editMode} />
        </MapContainer>
      </div>
      <div className="map-view-overlay">
        <div className="map-view-controls">
          <div className="map-slider-card">
            <MapVersionSlider value={sliderValue} onChange={setSliderValue} />
          </div>
          {false && (
            <EditButton
              editMode={editMode}
              onClick={() => setEditMode((prev) => !prev)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
