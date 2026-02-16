import { useMemo } from "react";
import L from "leaflet";
import { Polygon, Tooltip } from "react-leaflet";

type Bounds3857 = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Zone = {
  id: string;
  label: string;
  fillColor: string;
  strokeColor: string;
  positions: L.LatLng[];
};

function toLatLng(x: number, y: number) {
  return (L.Projection as any).SphericalMercator.unproject(L.point(x, y));
}

function rectangleZone(
  id: string,
  label: string,
  fillColor: string,
  strokeColor: string,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Zone {
  return {
    id,
    label,
    fillColor,
    strokeColor,
    positions: [
      toLatLng(minX, minY),
      toLatLng(maxX, minY),
      toLatLng(maxX, maxY),
      toLatLng(minX, maxY),
    ],
  };
}

function createZones(bounds3857: Bounds3857): Zone[] {
  const spanX = bounds3857.maxX - bounds3857.minX;
  const spanY = bounds3857.maxY - bounds3857.minY;

  return [
    rectangleZone(
      "zone-a",
      "Willow Plantation",
      "#86efac",
      "#15803d",
      bounds3857.minX + spanX * 0.78,
      bounds3857.minY + spanY * 0.856,
      bounds3857.minX + spanX * 0.82,
      bounds3857.minY + spanY * 0.90,
    ),
    rectangleZone(
      "zone-b",
      "Food Forest",
      "#93c5fd",
      "#1d4ed8",
      bounds3857.minX + spanX * 0.616,
      bounds3857.minY + spanY * 0.70,
      bounds3857.minX + spanX * 0.672,
      bounds3857.minY + spanY * 0.76,
    ),
  ];
}

export default function ZonesLayer({ bounds3857 }: { bounds3857: Bounds3857 }) {
  const zones = useMemo(() => createZones(bounds3857), [bounds3857]);

  return (
    <>
      {zones.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.positions}
          pathOptions={{
            color: zone.strokeColor,
            fillColor: zone.fillColor,
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="center" className="zone-label-tooltip">
            {zone.label}
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
