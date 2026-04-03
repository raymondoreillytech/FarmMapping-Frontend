import {
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

type LayerControlsProps = {
  editMode: boolean;
  onToggleEdit: () => void;
  showEditButton: boolean;
  showTrees: boolean;
  showZones: boolean;
  treesLoading: boolean;
  treesError: string | null;
  addTreeActive: boolean;
  panelOpen: boolean;
  onToggleTrees: (enabled: boolean) => void;
  onToggleZones: (enabled: boolean) => void;
  onAddTree: () => void;
};

export default function LayerControls({
  editMode,
  onToggleEdit,
  showEditButton,
  showTrees,
  showZones,
  treesLoading,
  treesError,
  addTreeActive,
  panelOpen,
  onToggleTrees,
  onToggleZones,
  onAddTree,
}: LayerControlsProps) {
  return (
    <div
      className={`map-view-layer-controls${panelOpen ? " is-shifted" : ""}`}
    >
      <div className="map-layer-stack">
        <Paper className="map-layer-card" elevation={0}>
          <Typography className="map-layer-card-title">Layers</Typography>
          <div className="map-layer-options">
            <FormControlLabel
              className="map-layer-option"
              control={
                <Checkbox
                  size="small"
                  checked={showTrees}
                  onChange={(event) => onToggleTrees(event.target.checked)}
                />
              }
              label="Trees"
            />
            <FormControlLabel
              className="map-layer-option"
              control={
                <Checkbox
                  size="small"
                  checked={showZones}
                  onChange={(event) => onToggleZones(event.target.checked)}
                />
              }
              label="Zones"
            />
          </div>
          {treesLoading ? (
            <Typography className="map-layer-helper">Loading trees...</Typography>
          ) : null}
          {treesError ? (
            <Typography className="map-layer-helper map-layer-helper-error">
              {treesError}
            </Typography>
          ) : null}
        </Paper>

        <Stack className="map-layer-actions" spacing={1}>
          {showEditButton ? (
            <Button
              variant={editMode ? "contained" : "outlined"}
              onClick={onToggleEdit}
              disabled={!showTrees}
              sx={{
                backgroundColor: editMode ? "primary.main" : "rgba(255,255,255,0.96)",
                color: editMode ? "primary.contrastText" : "text.primary",
                borderColor: "rgba(15, 23, 42, 0.22)",
                boxShadow: "0 6px 16px rgba(15, 23, 42, 0.14)",
                "&:hover": {
                  backgroundColor: editMode ? "primary.dark" : "rgba(255,255,255,1)",
                  borderColor: "rgba(15, 23, 42, 0.3)",
                },
              }}
            >
              Edit Map {editMode ? "ON" : "OFF"}
            </Button>
          ) : null}
          <Button
            variant={addTreeActive ? "contained" : "outlined"}
            onClick={onAddTree}
            sx={{
              backgroundColor: addTreeActive ? "primary.main" : "rgba(255,255,255,0.96)",
              color: addTreeActive ? "primary.contrastText" : "text.primary",
              borderColor: "rgba(15, 23, 42, 0.22)",
              boxShadow: "0 6px 16px rgba(15, 23, 42, 0.14)",
              "&:hover": {
                backgroundColor: addTreeActive ? "primary.dark" : "rgba(255,255,255,1)",
                borderColor: "rgba(15, 23, 42, 0.3)",
              },
            }}
          >
            Add Tree
          </Button>
        </Stack>
      </div>
    </div>
  );
}
