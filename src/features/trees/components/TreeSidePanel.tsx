import { useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type {
  CreateTreeLocationSource,
  SpeciesLookup,
  Tree,
  TreeFormState,
  TreeIdentificationPrediction,
  TreePhoto,
  TreeStatusLookup,
} from "../types";

type TreeSidePanelProps = {
  open: boolean;
  mode: "create" | "details";
  editMode: boolean;
  tree: Tree | null;
  formState: TreeFormState;
  speciesOptions: SpeciesLookup[];
  statusOptions: TreeStatusLookup[];
  lookupsLoading: boolean;
  lookupError: string | null;
  panelError: string | null;
  photoError: string | null;
  photoValidationError: string | null;
  prediction: TreeIdentificationPrediction | null;
  photoFile: File | null;
  latestPhoto: TreePhoto | null;
  latestPhotoLoading: boolean;
  latestPhotoError: string | null;
  locationSource: CreateTreeLocationSource;
  setLocationMode: boolean;
  resolvingPhotoLocation: boolean;
  predicting: boolean;
  savingTree: boolean;
  uploadingPhoto: boolean;
  deletingTree: boolean;
  canSave: boolean;
  onClose: () => void;
  onCancel: () => void;
  onToggleSetLocationMode: () => void;
  onPhotoSelected: (file: File | null) => void;
  onUsePhotoLocation: () => void;
  onPredict: () => void;
  onFieldChange: (
    field: "confirmedSpeciesCode" | "statusCode" | "notes",
    value: string,
  ) => void;
  onSave: () => void;
  onDelete: () => void;
};

function formatCoordinate(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return value.toFixed(6);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function FieldValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: "text.secondary",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function TreeSidePanel({
  open,
  mode,
  editMode,
  tree,
  formState,
  speciesOptions,
  statusOptions,
  lookupsLoading,
  lookupError,
  panelError,
  photoError,
  photoValidationError,
  prediction,
  photoFile,
  latestPhoto,
  latestPhotoLoading,
  latestPhotoError,
  locationSource,
  setLocationMode,
  resolvingPhotoLocation,
  predicting,
  savingTree,
  uploadingPhoto,
  deletingTree,
  canSave,
  onClose,
  onCancel,
  onToggleSetLocationMode,
  onPhotoSelected,
  onUsePhotoLocation,
  onPredict,
  onFieldChange,
  onSave,
  onDelete,
}: TreeSidePanelProps) {
  const isDesktop = useMediaQuery("(min-width:960px)");
  const allowEditing = mode === "create" || editMode;
  const previewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const busyStates = [
    predicting ? "Predicting" : null,
    resolvingPhotoLocation ? "Reading photo location" : null,
    savingTree ? "Saving tree" : null,
    uploadingPhoto ? "Uploading photo" : null,
    deletingTree ? "Deleting tree" : null,
  ].filter((value): value is string => Boolean(value));

  const drawerTitle = mode === "create" ? "Add Tree" : tree ? `Tree #${tree.id}` : "Tree";
  const drawerSubtitle =
    mode === "create"
      ? "Select a location, optionally identify from a photo, then save."
      : editMode
        ? "Edit details here and drag the marker on the map to move it."
        : "Read-only view. Enable edit mode to modify details or move the marker.";

  return (
    <Drawer
      variant="persistent"
      anchor={isDesktop ? "right" : "bottom"}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isDesktop ? 420 : "100%",
          maxHeight: isDesktop ? "100%" : "82vh",
          borderTopLeftRadius: isDesktop ? 0 : 20,
          borderTopRightRadius: isDesktop ? 0 : 20,
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 2.5,
          overflowY: "auto",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {drawerTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {drawerSubtitle}
          </Typography>
        </Box>

        {busyStates.length ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {busyStates.map((label) => (
              <Chip key={label} size="small" label={label} color="primary" />
            ))}
          </Stack>
        ) : null}

        {lookupError ? <Alert severity="error">{lookupError}</Alert> : null}
        {panelError ? <Alert severity="error">{panelError}</Alert> : null}
        {photoError ? <Alert severity="warning">{photoError}</Alert> : null}

        {mode === "create" ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Photo
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button component="label" variant="outlined">
                Choose Photo
                <input
                  hidden
                  accept="image/jpeg,image/png"
                  type="file"
                  onChange={(event) => {
                    onPhotoSelected(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
              </Button>
              {photoFile ? (
                <Button variant="text" color="inherit" onClick={() => onPhotoSelected(null)}>
                  Remove
                </Button>
              ) : null}
            </Stack>
            <Button
              sx={{ mt: 1.5 }}
              variant="outlined"
              onClick={onUsePhotoLocation}
              disabled={
                !photoFile ||
                Boolean(photoValidationError) ||
                resolvingPhotoLocation
              }
            >
              Use Photo Location
            </Button>

            {photoFile ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {photoFile.name}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                JPG or PNG, up to 20MB.
              </Typography>
            )}

            {photoValidationError ? (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {photoValidationError}
              </Alert>
            ) : null}

            {previewUrl ? (
              <Box
                component="img"
                src={previewUrl}
                alt="Selected tree preview"
                sx={{
                  mt: 1.5,
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "cover",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            ) : null}

            <Button
              sx={{ mt: 1.5 }}
              variant="contained"
              onClick={onPredict}
              disabled={!photoFile || Boolean(photoValidationError) || predicting}
            >
              Identify Tree
            </Button>

            {prediction ? (
              <Box sx={{ mt: 2 }}>
                <Alert severity={prediction.isUnknown ? "warning" : "success"}>
                  {prediction.isUnknown
                    ? "The model marked this image as unknown. Review the top matches and confirm manually if needed."
                    : `Top prediction: ${prediction.topPrediction}`}
                </Alert>
                <List dense sx={{ mt: 1 }}>
                  {prediction.predictions.slice(0, 3).map((item, index) => (
                    <ListItem key={`${item.label}-${index}`} disableGutters>
                      <ListItemText
                        primary={item.label}
                        secondary={`${(item.confidence * 100).toFixed(1)}% confidence`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : null}
          </Box>
        ) : null}

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "grey.50",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Location
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
            <FieldValue label="Latitude" value={formatCoordinate(formState.lat)} />
            <FieldValue label="Longitude" value={formatCoordinate(formState.lon)} />
          </Stack>
          {mode === "create" ? (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {locationSource === "photo"
                  ? "Using location from the selected photo."
                  : locationSource === "map"
                    ? "Using location selected from the map."
                    : "Choose a location from the photo or the map before saving."}
              </Typography>
              <Button
                sx={{ mt: 1.5 }}
                variant={setLocationMode ? "contained" : "outlined"}
                onClick={onToggleSetLocationMode}
              >
                Set Location On Map
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {setLocationMode
                  ? "Click the map to place or move the pending tree location."
                  : "Turn on location mode, then click the map to set the tree location."}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {editMode
                ? "Drag the marker on the map to update this location."
                : "Enable edit mode to move this tree on the map."}
            </Typography>
          )}
        </Box>

        <Divider />

        {lookupsLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading tree options...
          </Typography>
        ) : allowEditing ? (
          <Stack spacing={2}>
            <TextField
              select
              label="Species"
              value={formState.confirmedSpeciesCode}
              onChange={(event) =>
                onFieldChange("confirmedSpeciesCode", event.target.value)
              }
              fullWidth
            >
              {speciesOptions.map((species) => (
                <MenuItem key={species.code} value={species.code}>
                  {species.displayName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={formState.statusCode}
              onChange={(event) => onFieldChange("statusCode", event.target.value)}
              fullWidth
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.code} value={status.code}>
                  {status.displayName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Notes"
              value={formState.notes}
              onChange={(event) => onFieldChange("notes", event.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <FieldValue
              label="Species"
              value={tree?.confirmedSpeciesDisplayName ?? formState.confirmedSpeciesCode}
            />
            <FieldValue
              label="Status"
              value={tree?.statusDisplayName ?? formState.statusCode}
            />
            <FieldValue label="Notes" value={formState.notes || "No notes"} />
          </Stack>
        )}

        {mode === "details" && tree ? (
          <>
            <Divider />
            <Stack spacing={1}>
              <FieldValue label="Created" value={formatTimestamp(tree.createdAt)} />
              <FieldValue label="Updated" value={formatTimestamp(tree.updatedAt)} />
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Latest Photo
              </Typography>
              {latestPhotoLoading ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Loading latest photo...
                </Typography>
              ) : latestPhotoError ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {latestPhotoError}
                </Alert>
              ) : latestPhoto?.downloadUrl ? (
                <Box sx={{ mt: 1.5 }}>
                  <Box
                    component="img"
                    src={latestPhoto.downloadUrl}
                    alt={
                      latestPhoto.originalFilename ??
                      `${tree.confirmedSpeciesDisplayName} tree photo`
                    }
                    sx={{
                      width: "100%",
                      maxHeight: 240,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {latestPhoto.originalFilename ?? "Latest uploaded photo"}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No photo uploaded for this tree yet.
                </Typography>
              )}
            </Box>
          </>
        ) : null}

        <Box sx={{ mt: "auto", pt: 1 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {mode === "create" ? (
              <>
                <Button variant="contained" onClick={onSave} disabled={!canSave}>
                  Save Tree
                </Button>
                <Button variant="text" color="inherit" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            ) : editMode ? (
              <>
                <Button variant="contained" onClick={onSave} disabled={!canSave}>
                  Save Changes
                </Button>
                <Button variant="text" color="inherit" onClick={onCancel}>
                  Cancel
                </Button>
                <Button variant="outlined" color="error" onClick={onDelete}>
                  Delete Tree
                </Button>
              </>
            ) : (
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
