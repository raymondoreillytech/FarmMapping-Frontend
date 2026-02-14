import EditButton from "./EditButton";
import MapVersionSlider from "./MapVersionSlider";

type MapControlsProps = {
  sliderValue: number;
  onSliderChange: (value: number) => void;
  editMode: boolean;
  onToggleEdit: () => void;
  showEditButton?: boolean;
};

export default function MapControls({
  sliderValue,
  onSliderChange,
  editMode,
  onToggleEdit,
  showEditButton = false,
}: MapControlsProps) {
  return (
    <div className="map-view-controls">
      <div className="map-slider-card">
        <MapVersionSlider value={sliderValue} onChange={onSliderChange} />
      </div>
      {showEditButton && <EditButton editMode={editMode} onClick={onToggleEdit} />}
    </div>
  );
}
