import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";
import { getTreeMarkerIcon } from "../../trees/icons";
import type { Tree } from "../../trees/types";

type PendingTreeLocation = {
  lat: number;
  lon: number;
};

type TreesLayerProps = {
  trees: Tree[];
  editMode: boolean;
  selectedTreeId: number | null;
  pendingTreeLocation: PendingTreeLocation | null;
  onSelectTree: (treeId: number) => void;
  onMoveTree: (tree: Tree, lat: number, lon: number) => void;
  onMovePendingTree: (lat: number, lon: number) => void;
};

export default function TreesLayer({
  trees,
  editMode,
  selectedTreeId,
  pendingTreeLocation,
  onSelectTree,
  onMoveTree,
  onMovePendingTree,
}: TreesLayerProps) {
  return (
    <>
      {trees.map((tree) => {
        const markerLabel = `${tree.confirmedSpeciesDisplayName} - ${tree.statusDisplayName}`;

        return (
          <Marker
            position={[tree.lat, tree.lon]}
            icon={getTreeMarkerIcon(tree.iconKey)}
            key={`${tree.id}-${editMode}`}
            title={markerLabel}
            draggable={editMode}
            zIndexOffset={selectedTreeId === tree.id ? 1000 : 0}
            eventHandlers={{
              click: () => onSelectTree(tree.id),
              dragend: (event: L.LeafletEvent) => {
                const marker = event.target as L.Marker;
                const position = marker.getLatLng();
                onMoveTree(tree, position.lat, position.lng);
              },
            }}
          >
            <Tooltip>{markerLabel}</Tooltip>
          </Marker>
        );
      })}

      {pendingTreeLocation ? (
        <Marker
          position={[pendingTreeLocation.lat, pendingTreeLocation.lon]}
          icon={getTreeMarkerIcon("UnknownTreeIcon")}
          draggable
          zIndexOffset={1500}
          eventHandlers={{
            dragend: (event: L.LeafletEvent) => {
              const marker = event.target as L.Marker;
              const position = marker.getLatLng();
              onMovePendingTree(position.lat, position.lng);
            },
          }}
        >
          <Tooltip>Pending tree location</Tooltip>
        </Marker>
      ) : null}
    </>
  );
}
