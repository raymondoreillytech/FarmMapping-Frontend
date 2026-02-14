import { Slider } from "@mui/material";
import {
  MAP_VERSION_MARKS,
  MAP_VERSION_MAX,
  MAP_VERSION_MIN,
  mapVersionValueText,
} from "../config/mapView.constants";
import { mapVersionSliderSx } from "../config/mapView.styles";
import "../styles/MapViewSlider.css";

type MapVersionSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export default function MapVersionSlider({
  value,
  onChange,
}: MapVersionSliderProps) {
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
