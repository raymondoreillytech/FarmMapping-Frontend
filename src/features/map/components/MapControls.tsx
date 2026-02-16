import MapVersionSlider from "./MapVersionSlider";

type MapControlsProps = {
  sliderValue: number;
  onSliderChange: (value: number) => void;
};

export default function MapControls({
  sliderValue,
  onSliderChange,
}: MapControlsProps) {
  return (
    <div className="map-view-controls">
      <div className="map-slider-card">
        <MapVersionSlider value={sliderValue} onChange={onSliderChange} />
      </div>
    </div>
  );
}
