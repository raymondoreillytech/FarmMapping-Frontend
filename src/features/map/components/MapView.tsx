import { useEffect, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { gps as readPhotoGps } from "exifr";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import TreeSidePanel from "../../trees/components/TreeSidePanel";
import {
  createTree,
  deleteTree,
  getSpecies,
  getTreePhotos,
  getTrees,
  getTreeStatuses,
  predictTreeSpecies,
  updateTree,
  uploadTreePhoto,
} from "../../trees/api";
import type {
  CreateTreeLocationSource,
  SpeciesLookup,
  Tree,
  TreeFormState,
  TreeIdentificationPrediction,
  TreePhoto,
  TreePhotoUploadMetadata,
  TreeStatusLookup,
} from "../../trees/types";
import {
  ALLOWED_IMAGE_TYPES,
  GUEST_USER_KEY,
  MAX_IMAGE_UPLOAD_BYTES,
} from "../../trees/types";
import { buildApiUrl } from "../../../lib/api";
import ZonesLayer from "../layers/ZonesLayer";
import TreesLayer from "../layers/TreesLayer";
import {
  MAP_VERSION_MAX,
  SHOW_EDIT_BUTTON,
} from "../config/mapView.constants";
import MapControls from "./MapControls";
import LayerControls from "./LayerControls";
import "../styles/MapView.css";

type Meta = {
  minZoom: number;
  maxZoom: number;
  tileUrlTemplate: string;
  bounds3857: { minX: number; minY: number; maxX: number; maxY: number };
};

const EXTRA_ZOOM = 0;
const DESKTOP_INITIAL_ZOOM_OFFSET = 2;
const INITIAL_CENTER_VERTICAL_RATIO = 0.6;

type CreateTreeDraft = TreeFormState & {
  photoFile: File | null;
  prediction: TreeIdentificationPrediction | null;
  locationSource: CreateTreeLocationSource;
  setLocationMode: boolean;
};

function FitToMeta({ meta }: { meta: Meta }) {
  const map = useMap();

  useEffect(() => {
    const b = meta.bounds3857;
    const sw = L.Projection.SphericalMercator.unproject(L.point(b.minX, b.minY));
    const ne = L.Projection.SphericalMercator.unproject(L.point(b.maxX, b.maxY));
    const bounds = L.latLngBounds(sw, ne);

    map.setMaxBounds(bounds);
  }, [map, meta]);

  return null;
}

function TreeLocationPicker({
  enabled,
  onPickLocation,
}: {
  enabled: boolean;
  onPickLocation: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) {
        return;
      }

      onPickLocation(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function toLatLng(x: number, y: number) {
  return L.Projection.SphericalMercator.unproject(L.point(x, y));
}

function getInitialCenter(meta: Meta) {
  const midX = (meta.bounds3857.minX + meta.bounds3857.maxX) / 2;
  const initialY =
    meta.bounds3857.minY +
    (meta.bounds3857.maxY - meta.bounds3857.minY) *
      INITIAL_CENTER_VERTICAL_RATIO;
  return toLatLng(midX, initialY);
}

function createDefaultDraft(): CreateTreeDraft {
  return {
    lat: null,
    lon: null,
    confirmedSpeciesCode: "unknown",
    statusCode: "active",
    notes: "",
    photoFile: null,
    prediction: null,
    locationSource: "none",
    setLocationMode: false,
  };
}

function createEmptyFormState(): TreeFormState {
  return {
    lat: null,
    lon: null,
    confirmedSpeciesCode: "unknown",
    statusCode: "active",
    notes: "",
  };
}

function applyPhotoSelection(
  current: CreateTreeDraft,
  file: File | null,
): CreateTreeDraft {
  const shouldClearPhotoLocation = current.locationSource === "photo";

  return {
    ...current,
    photoFile: file,
    prediction: null,
    lat: shouldClearPhotoLocation ? null : current.lat,
    lon: shouldClearPhotoLocation ? null : current.lon,
    locationSource: shouldClearPhotoLocation ? "none" : current.locationSource,
  };
}

function toTreeFormState(tree: Tree): TreeFormState {
  return {
    lat: tree.lat,
    lon: tree.lon,
    confirmedSpeciesCode: tree.confirmedSpeciesCode,
    statusCode: tree.statusCode,
    notes: tree.notes ?? "",
  };
}

function normalizeNotes(notes: string) {
  const trimmed = notes.trim();
  return trimmed ? trimmed : null;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function validatePhotoFile(file: File) {
  const looksLikeAllowedExtension = /\.(jpe?g|png)$/i.test(file.name);
  const isAllowedType =
    ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]) ||
    looksLikeAllowedExtension;

  if (!isAllowedType) {
    return "Only JPG and PNG images are allowed.";
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Images must be 20MB or smaller.";
  }

  return null;
}

function buildPhotoMetadata(
  prediction: TreeIdentificationPrediction | null,
): TreePhotoUploadMetadata {
  const baseMetadata: TreePhotoUploadMetadata = {
    uploadedByUserKey: GUEST_USER_KEY,
    isPrimary: true,
  };

  if (!prediction) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    rawTopSpeciesCode: prediction.rawTopPrediction,
    rawTopConfidence: prediction.topConfidence,
    finalPredictedSpeciesCode: prediction.topPrediction,
    finalPredictionConfidence: prediction.topConfidence,
    unknownPrediction: prediction.isUnknown,
    modelVersion: prediction.modelVersion,
    topPredictionsJson: prediction.predictions.map((item) => ({
      speciesCode: item.label,
      confidence: item.confidence,
    })),
  };
}

export function MapView() {
  const isDesktop = useMediaQuery("(min-width:960px)");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showTreesLayer, setShowTreesLayer] = useState(false);
  const [showZonesLayer, setShowZonesLayer] = useState(false);
  const [sliderValue, setSliderValue] = useState(MAP_VERSION_MAX);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [treesLoaded, setTreesLoaded] = useState(false);
  const [treesLoading, setTreesLoading] = useState(false);
  const [treesError, setTreesError] = useState<string | null>(null);
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesLookup[]>([]);
  const [statusOptions, setStatusOptions] = useState<TreeStatusLookup[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"closed" | "create" | "details">(
    "closed",
  );
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);
  const [detailForm, setDetailForm] = useState<TreeFormState | null>(null);
  const [createDraft, setCreateDraft] = useState<CreateTreeDraft>(
    createDefaultDraft(),
  );
  const [panelError, setPanelError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(
    null,
  );
  const [predicting, setPredicting] = useState(false);
  const [savingTree, setSavingTree] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingTree, setDeletingTree] = useState(false);
  const [resolvingPhotoLocation, setResolvingPhotoLocation] = useState(false);
  const [latestPhoto, setLatestPhoto] = useState<TreePhoto | null>(null);
  const [latestPhotoLoading, setLatestPhotoLoading] = useState(false);
  const [latestPhotoError, setLatestPhotoError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      buildApiUrl(
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

  useEffect(() => {
    let cancelled = false;
    setLookupsLoading(true);

    Promise.all([getSpecies(), getTreeStatuses()])
      .then(([species, statuses]) => {
        if (cancelled) {
          return;
        }

        setSpeciesOptions(species);
        setStatusOptions(statuses);
        setLookupError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setLookupError(
          getErrorMessage(error, "Failed to load tree species and statuses."),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLookupsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showTreesLayer || treesLoaded) {
      return;
    }

    let cancelled = false;
    setTreesLoading(true);
    setTreesError(null);

    getTrees()
      .then((nextTrees) => {
        if (cancelled) {
          return;
        }

        setTrees(nextTrees);
        setTreesLoaded(true);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setTreesError(getErrorMessage(error, "Failed to load trees."));
      })
      .finally(() => {
        if (!cancelled) {
          setTreesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showTreesLayer, treesLoaded]);

  useEffect(() => {
    if (panelMode !== "details" || selectedTreeId === null) {
      setLatestPhoto(null);
      setLatestPhotoError(null);
      setLatestPhotoLoading(false);
      return;
    }

    let cancelled = false;
    setLatestPhotoLoading(true);
    setLatestPhotoError(null);

    getTreePhotos(selectedTreeId)
      .then((photos) => {
        if (cancelled) {
          return;
        }

        setLatestPhoto(photos.at(-1) ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setLatestPhoto(null);
        setLatestPhotoError(
          getErrorMessage(error, "Failed to load the latest tree photo."),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLatestPhotoLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [panelMode, selectedTreeId]);

  if (!meta) return null;

  if (!meta.tileUrlTemplate) {
    throw new Error("metadata missing tileUrlTemplate");
  }
  const tileUrlTemplate = meta.tileUrlTemplate.startsWith("/")
    ? buildApiUrl(meta.tileUrlTemplate)
    : meta.tileUrlTemplate;
  const uiMaxZoom = meta.maxZoom + EXTRA_ZOOM;
  const initialZoom = Math.min(
    meta.minZoom + (isDesktop ? DESKTOP_INITIAL_ZOOM_OFFSET : 0),
    uiMaxZoom,
  );
  const selectedTree =
    selectedTreeId === null
      ? null
      : trees.find((tree) => tree.id === selectedTreeId) ?? null;
  const fallbackDetailForm = selectedTree ? toTreeFormState(selectedTree) : null;
  const formState =
    panelMode === "create"
      ? createDraft
      : detailForm ?? fallbackDetailForm ?? createEmptyFormState();
  const pendingTreeLocation =
    panelMode === "create" &&
    createDraft.lat !== null &&
    createDraft.lon !== null
      ? { lat: createDraft.lat, lon: createDraft.lon }
      : null;
  const detailDirty = Boolean(
    selectedTree &&
      detailForm &&
      (detailForm.confirmedSpeciesCode !== selectedTree.confirmedSpeciesCode ||
        detailForm.statusCode !== selectedTree.statusCode ||
        normalizeNotes(detailForm.notes) !==
          (selectedTree.notes?.trim() ? selectedTree.notes.trim() : null)),
  );
  const createCanSave =
    createDraft.locationSource !== "none" &&
    createDraft.lat !== null &&
    createDraft.lon !== null &&
    !lookupsLoading &&
    !resolvingPhotoLocation &&
    !savingTree &&
    !uploadingPhoto;
  const detailCanSave =
    editMode && Boolean(selectedTree && detailForm && detailDirty) && !savingTree;
  const hidePanelForMobileLocationPick =
    !isDesktop && panelMode === "create" && createDraft.setLocationMode;
  const sidePanelOpen =
    isDesktop &&
    !hidePanelForMobileLocationPick &&
    panelMode !== "closed" &&
    (panelMode !== "details" || Boolean(selectedTree));

  function resetCreateDraft() {
    setCreateDraft(createDefaultDraft());
    setPhotoValidationError(null);
  }

  function closePanel() {
    setPanelMode("closed");
    setSelectedTreeId(null);
    setDetailForm(null);
    resetCreateDraft();
    setPanelError(null);
    setPhotoError(null);
    setLatestPhoto(null);
    setLatestPhotoError(null);
    setLatestPhotoLoading(false);
  }

  function openTreeDetails(treeId: number) {
    const tree = trees.find((item) => item.id === treeId);

    if (!tree) {
      return;
    }

    resetCreateDraft();
    setSelectedTreeId(treeId);
    setDetailForm(toTreeFormState(tree));
    setPanelMode("details");
    setPanelError(null);
    setPhotoError(null);
    setLatestPhoto(null);
    setLatestPhotoError(null);
  }

  function getSpeciesOption(code: string) {
    return speciesOptions.find((species) => species.code === code) ?? null;
  }

  function getStatusOption(code: string) {
    return statusOptions.find((status) => status.code === code) ?? null;
  }

  function handleToggleEdit() {
    if (editMode && selectedTree) {
      setDetailForm(toTreeFormState(selectedTree));
    }

    setPanelError(null);
    setEditMode((current) => !current);
  }

  function handleToggleTrees(enabled: boolean) {
    setShowTreesLayer(enabled);

    if (!enabled) {
      setEditMode(false);
      closePanel();
    }
  }

  function handleAddTree() {
    if (!showTreesLayer) {
      setShowTreesLayer(true);
    }

    setPanelMode("create");
    setSelectedTreeId(null);
    setDetailForm(null);
    resetCreateDraft();
    setPanelError(null);
    setPhotoError(null);
  }

  function handlePanelFieldChange(
    field: "confirmedSpeciesCode" | "statusCode" | "notes",
    value: string,
  ) {
    setPanelError(null);

    if (panelMode === "create") {
      setCreateDraft((current) => ({
        ...current,
        [field]: value,
      }));
      return;
    }

    setDetailForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  function handlePhotoSelected(file: File | null) {
    if (panelMode !== "create") {
      return;
    }

    setPanelError(null);
    setPhotoError(null);

    if (!file) {
      setPhotoValidationError(null);
      setCreateDraft((current) => applyPhotoSelection(current, null));
      return;
    }

    const validationError = validatePhotoFile(file);
    if (validationError) {
      setPhotoValidationError(validationError);
      setCreateDraft((current) => applyPhotoSelection(current, null));
      return;
    }

    setPhotoValidationError(null);
    setCreateDraft((current) => applyPhotoSelection(current, file));
  }

  async function handleUsePhotoLocation() {
    if (panelMode !== "create") {
      return;
    }

    if (!createDraft.photoFile) {
      setPanelError("Choose a photo before trying to use its location.");
      return;
    }

    setResolvingPhotoLocation(true);
    setPanelError(null);

    try {
      const gps = await readPhotoGps(createDraft.photoFile);

      if (
        !gps ||
        typeof gps.latitude !== "number" ||
        typeof gps.longitude !== "number"
      ) {
        throw new Error("The selected photo does not contain GPS location data.");
      }

      setCreateDraft((current) => ({
        ...current,
        lat: gps.latitude,
        lon: gps.longitude,
        locationSource: "photo",
        setLocationMode: false,
      }));
    } catch (error: unknown) {
      setPanelError(
        getErrorMessage(
          error,
          "Could not read GPS data from the selected photo.",
        ),
      );
    } finally {
      setResolvingPhotoLocation(false);
    }
  }

  async function handlePredictTree() {
    if (panelMode !== "create") {
      return;
    }

    if (!createDraft.photoFile) {
      setPanelError("Choose a JPG or PNG photo before running prediction.");
      return;
    }

    setPredicting(true);
    setPanelError(null);

    try {
      const prediction = await predictTreeSpecies(createDraft.photoFile, 3);
      setCreateDraft((current) => ({
        ...current,
        prediction,
        confirmedSpeciesCode: prediction.topPrediction,
      }));
    } catch (error: unknown) {
      setPanelError(getErrorMessage(error, "Tree prediction failed."));
    } finally {
      setPredicting(false);
    }
  }

  async function handleSaveCreateTree() {
    const draft = createDraft;

    if (draft.lat === null || draft.lon === null) {
      setPanelError("Set a tree location before saving.");
      return;
    }

    setSavingTree(true);
    setPanelError(null);
    setPhotoError(null);

    try {
      const createdTree = await createTree({
        lat: draft.lat,
        lon: draft.lon,
        confirmedSpeciesCode: draft.confirmedSpeciesCode,
        statusCode: draft.statusCode,
        notes: normalizeNotes(draft.notes),
        createdByUserKey: GUEST_USER_KEY,
      });

      setTrees((current) => {
        const withoutMatch = current.filter((tree) => tree.id !== createdTree.id);
        return [...withoutMatch, createdTree];
      });
      setSelectedTreeId(createdTree.id);
      setDetailForm(toTreeFormState(createdTree));
      setPanelMode("details");
      resetCreateDraft();

      if (draft.photoFile) {
        setUploadingPhoto(true);

        try {
          const uploadedPhoto = await uploadTreePhoto(
            createdTree.id,
            draft.photoFile,
            buildPhotoMetadata(draft.prediction),
          );
          setLatestPhoto(uploadedPhoto);
          setLatestPhotoError(null);
          setPhotoError(null);
        } catch (error: unknown) {
          setPhotoError(
            getErrorMessage(error, "Tree saved, but the photo upload failed."),
          );
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error: unknown) {
      setPanelError(getErrorMessage(error, "Failed to save the new tree."));
    } finally {
      setSavingTree(false);
    }
  }

  async function handleSaveTreeDetails() {
    if (!selectedTree || !detailForm) {
      return;
    }

    const previousTree = selectedTree;
    const optimisticTree: Tree = {
      ...previousTree,
      confirmedSpeciesCode: detailForm.confirmedSpeciesCode,
      confirmedSpeciesDisplayName:
        getSpeciesOption(detailForm.confirmedSpeciesCode)?.displayName ??
        previousTree.confirmedSpeciesDisplayName,
      iconKey:
        getSpeciesOption(detailForm.confirmedSpeciesCode)?.iconKey ??
        previousTree.iconKey,
      statusCode: detailForm.statusCode,
      statusDisplayName:
        getStatusOption(detailForm.statusCode)?.displayName ??
        previousTree.statusDisplayName,
      notes: normalizeNotes(detailForm.notes),
    };

    setSavingTree(true);
    setPanelError(null);
    setTrees((current) =>
      current.map((tree) => (tree.id === previousTree.id ? optimisticTree : tree)),
    );

    try {
      const updatedTree = await updateTree(previousTree.id, {
        confirmedSpeciesCode: detailForm.confirmedSpeciesCode,
        statusCode: detailForm.statusCode,
        notes: normalizeNotes(detailForm.notes),
        updatedByUserKey: GUEST_USER_KEY,
      });

      setTrees((current) =>
        current.map((tree) => (tree.id === updatedTree.id ? updatedTree : tree)),
      );
      setDetailForm(toTreeFormState(updatedTree));
    } catch (error: unknown) {
      setTrees((current) =>
        current.map((tree) => (tree.id === previousTree.id ? previousTree : tree)),
      );
      setDetailForm((current) =>
        current
          ? {
              ...current,
              confirmedSpeciesCode: previousTree.confirmedSpeciesCode,
              statusCode: previousTree.statusCode,
              notes: previousTree.notes ?? "",
            }
          : current,
      );
      setPanelError(getErrorMessage(error, "Failed to save tree updates."));
    } finally {
      setSavingTree(false);
    }
  }

  async function handleDeleteSelectedTree() {
    if (!selectedTree) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedTree.confirmedSpeciesDisplayName}?`,
    );

    if (!confirmed) {
      return;
    }

    const previousTrees = trees;

    setDeletingTree(true);
    setPanelError(null);
    setTrees((current) => current.filter((tree) => tree.id !== selectedTree.id));
    setSelectedTreeId(null);
    setDetailForm(null);
    setPanelMode("closed");

    try {
      await deleteTree(selectedTree.id);
    } catch (error: unknown) {
      setTrees(previousTrees);
      setSelectedTreeId(selectedTree.id);
      setDetailForm(toTreeFormState(selectedTree));
      setPanelMode("details");
      setPanelError(getErrorMessage(error, "Failed to delete tree."));
      setLatestPhoto(null);
    } finally {
      setDeletingTree(false);
    }
  }

  async function handleMoveTree(tree: Tree, lat: number, lon: number) {
    const previousTree = tree;
    const optimisticTree = {
      ...tree,
      lat,
      lon,
    };

    setPanelError(null);
    setTrees((current) =>
      current.map((item) => (item.id === tree.id ? optimisticTree : item)),
    );

    if (selectedTreeId === tree.id) {
      setDetailForm((current) =>
        current
          ? {
              ...current,
              lat,
              lon,
            }
          : current,
      );
    }

    try {
      const updatedTree = await updateTree(tree.id, {
        lat,
        lon,
        updatedByUserKey: GUEST_USER_KEY,
      });

      setTrees((current) =>
        current.map((item) => (item.id === tree.id ? updatedTree : item)),
      );

      if (selectedTreeId === tree.id) {
        setDetailForm((current) =>
          current
            ? {
                ...current,
                lat: updatedTree.lat,
                lon: updatedTree.lon,
              }
            : current,
        );
      }
    } catch (error: unknown) {
      setTrees((current) =>
        current.map((item) => (item.id === tree.id ? previousTree : item)),
      );

      if (selectedTreeId === tree.id) {
        setDetailForm((current) =>
          current
            ? {
                ...current,
                lat: previousTree.lat,
                lon: previousTree.lon,
              }
            : current,
        );
      }

      setPanelError(getErrorMessage(error, "Failed to update tree location."));
    }
  }

  function handleMovePendingTree(lat: number, lon: number) {
    setPanelError(null);
    setCreateDraft((current) => ({
      ...current,
      lat,
      lon,
      locationSource: "map",
      setLocationMode: isDesktop ? current.setLocationMode : false,
    }));
  }

  function handleSave() {
    if (panelMode === "create") {
      void handleSaveCreateTree();
      return;
    }

    void handleSaveTreeDetails();
  }

  function handlePanelCancel() {
    setPanelError(null);
    setPhotoError(null);

    if (panelMode === "create") {
      closePanel();
      return;
    }

    if (selectedTree) {
      setDetailForm(toTreeFormState(selectedTree));
    }

    setEditMode(false);
  }

  return (
    <div className={`map-view-root${sidePanelOpen ? " has-side-panel" : ""}`}>
      <div className="map-view-canvas">
        <MapContainer
          center={getInitialCenter(meta)}
          zoom={initialZoom}
          minZoom={meta.minZoom}
          maxZoom={uiMaxZoom}
          maxBoundsViscosity={1}
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
          <TreeLocationPicker
            enabled={panelMode === "create" && createDraft.setLocationMode}
            onPickLocation={(lat, lon) => {
              setPanelError(null);
              setCreateDraft((current) => ({
                ...current,
                lat,
                lon,
                locationSource: "map",
                setLocationMode: isDesktop ? current.setLocationMode : false,
              }));
            }}
          />
          {showZonesLayer && <ZonesLayer bounds3857={meta.bounds3857} />}
          {showTreesLayer && (
            <TreesLayer
              trees={trees}
              editMode={editMode}
              selectedTreeId={selectedTreeId}
              pendingTreeLocation={pendingTreeLocation}
              onSelectTree={openTreeDetails}
              onMoveTree={handleMoveTree}
              onMovePendingTree={handleMovePendingTree}
            />
          )}
        </MapContainer>
      </div>
      <div className="map-view-overlay">
        <MapControls
          sliderValue={sliderValue}
          onSliderChange={setSliderValue}
        />
        <LayerControls
          editMode={editMode}
          onToggleEdit={handleToggleEdit}
          showEditButton={SHOW_EDIT_BUTTON}
          showTrees={showTreesLayer}
          showZones={showZonesLayer}
          treesLoading={treesLoading}
          treesError={treesError}
          addTreeActive={panelMode === "create"}
          panelOpen={sidePanelOpen}
          onToggleTrees={handleToggleTrees}
          onToggleZones={setShowZonesLayer}
          onAddTree={handleAddTree}
        />
        {hidePanelForMobileLocationPick ? (
          <div className="map-location-pick-banner">
            Tap the map to set the tree location
          </div>
        ) : null}
      </div>
      <TreeSidePanel
        open={sidePanelOpen || (!isDesktop && !hidePanelForMobileLocationPick && panelMode !== "closed" && (panelMode !== "details" || Boolean(selectedTree)))}
        mode={panelMode === "create" ? "create" : "details"}
        editMode={editMode}
        tree={selectedTree}
        formState={formState}
        speciesOptions={speciesOptions}
        statusOptions={statusOptions}
        lookupsLoading={lookupsLoading}
        lookupError={lookupError}
        panelError={panelError}
        photoError={photoError}
        photoValidationError={photoValidationError}
        prediction={panelMode === "create" ? createDraft.prediction : null}
        photoFile={panelMode === "create" ? createDraft.photoFile : null}
        latestPhoto={latestPhoto}
        latestPhotoLoading={latestPhotoLoading}
        latestPhotoError={latestPhotoError}
        locationSource={panelMode === "create" ? createDraft.locationSource : "map"}
        setLocationMode={panelMode === "create" && createDraft.setLocationMode}
        resolvingPhotoLocation={resolvingPhotoLocation}
        predicting={predicting}
        savingTree={savingTree}
        uploadingPhoto={uploadingPhoto}
        deletingTree={deletingTree}
        canSave={panelMode === "create" ? createCanSave : detailCanSave}
        onClose={closePanel}
        onCancel={handlePanelCancel}
        onToggleSetLocationMode={() =>
          setCreateDraft((current) => ({
            ...current,
            setLocationMode: !current.setLocationMode,
          }))
        }
        onPhotoSelected={handlePhotoSelected}
        onUsePhotoLocation={() => {
          void handleUsePhotoLocation();
        }}
        onPredict={() => {
          void handlePredictTree();
        }}
        onFieldChange={handlePanelFieldChange}
        onSave={handleSave}
        onDelete={() => {
          void handleDeleteSelectedTree();
        }}
      />
    </div>
  );
}
