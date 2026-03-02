import { useEffect, useState } from "react";
import MapVersionSlider from "./MapVersionSlider";
import {
  getMapVersionMessage,
  MAP_VERSION_MARKS,
} from "../config/mapView.constants";

type MapControlsProps = {
  sliderValue: number;
  onSliderChange: (value: number) => void;
};

export default function MapControls({
  sliderValue,
  onSliderChange,
}: MapControlsProps) {
  const selectedMark = MAP_VERSION_MARKS.find((mark) => mark.value === sliderValue);
  const versionMessageKey = selectedMark?.messageKey ?? "";
  const versionMessage = selectedMark
    ? getMapVersionMessage(versionMessageKey)
    : "";
  const [dismissedMessageKey, setDismissedMessageKey] = useState("");

  useEffect(() => {
    if (!versionMessageKey) {
      setDismissedMessageKey("");
    }
  }, [versionMessageKey]);

  const showVersionMessage =
    Boolean(versionMessage) && dismissedMessageKey !== versionMessageKey;

  return (
    <div className="map-view-controls">
      <div className="map-slider-card">
        <MapVersionSlider value={sliderValue} onChange={onSliderChange} />
      </div>
      {showVersionMessage && (
        <div className="map-version-message-card">
          <button
            type="button"
            className="map-version-message-close"
            aria-label="Dismiss map version message"
            onClick={() => setDismissedMessageKey(versionMessageKey)}
          >
            x
          </button>
          <p className="map-version-message-text">{versionMessage}</p>
        </div>
      )}
    </div>
  );
}
