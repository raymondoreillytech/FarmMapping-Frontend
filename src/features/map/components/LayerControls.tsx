import EditButton from "./EditButton";

type LayerControlsProps = {
  editMode: boolean;
  onToggleEdit: () => void;
  showEditButton: boolean;
  showObservations: boolean;
  showZones: boolean;
  onToggleObservations: (enabled: boolean) => void;
  onToggleZones: (enabled: boolean) => void;
};

export default function LayerControls({
  editMode,
  onToggleEdit,
  showEditButton,
  showObservations,
  showZones,
  onToggleObservations,
  onToggleZones,
}: LayerControlsProps) {
  return (
    <div className="map-view-layer-controls">
      <div className="map-layer-stack">
        <div className="map-layer-card">
          <div className="map-layer-card-title">Layers</div>
          <div className="map-layer-options">
            <label className="map-layer-option">
              <input
                type="checkbox"
                checked={showObservations}
                onChange={(event) => onToggleObservations(event.target.checked)}
              />
              <span>Trees</span>
            </label>
            <label className="map-layer-option">
              <input
                type="checkbox"
                checked={showZones}
                onChange={(event) => onToggleZones(event.target.checked)}
              />
              <span>Zones</span>
            </label>
          </div>
        </div>
        {showEditButton && (
          <div
            className={`map-layer-edit-below${showObservations ? "" : " is-hidden"}`}
            aria-hidden={!showObservations}
          >
            <EditButton
              editMode={editMode}
              onClick={onToggleEdit}
              disabled={!showObservations}
            />
          </div>
        )}
      </div>
    </div>
  );
}
