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

type Point3857 = {
  x: number;
  y: number;
};

function toLatLng(x: number, y: number) {
  return L.Projection.SphericalMercator.unproject(L.point(x, y));
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

function polygonZone(
  id: string,
  label: string,
  fillColor: string,
  strokeColor: string,
  points: Point3857[],
): Zone {
  return {
    id,
    label,
    fillColor,
    strokeColor,
    positions: points.map((point) => toLatLng(point.x, point.y)),
  };
}

function rotatePoint(point: Point3857, angleRadians: number): Point3857 {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function createZones(bounds3857: Bounds3857): Zone[] {
  const spanX = bounds3857.maxX - bounds3857.minX;
  const spanY = bounds3857.maxY - bounds3857.minY;
  const willowMinX = bounds3857.minX + spanX * 0.78;
  const willowMinY = bounds3857.minY + spanY * 0.856;
  const willowMaxX = bounds3857.minX + spanX * 0.82;
  const willowMaxY = bounds3857.minY + spanY * 0.9;
  const willowWidth = willowMaxX - willowMinX;
  const willowHeight = willowMaxY - willowMinY;
  const willowBaseCenterX = (willowMinX + willowMaxX) / 2;
  const willowBaseCenterY = (willowMinY + willowMaxY) / 2;
  const willowAdjustedWidth = willowWidth * 2;
  const willowAdjustedHeight = willowHeight * 0.3;
  const willowCenterX = willowBaseCenterX - willowAdjustedWidth * 0.25;
  const willowCenterY =
    willowBaseCenterY + willowHeight * 0.5 + willowAdjustedHeight * 0.25;
  const willowAdjustedMinX = willowCenterX - willowAdjustedWidth / 2;
  const willowAdjustedMaxX = willowCenterX + willowAdjustedWidth / 2;
  const willowFinalMinX = willowAdjustedMinX + willowAdjustedWidth * 0.4;
  const willowFinalMaxX = willowAdjustedMaxX - willowAdjustedWidth * 0.1;
  const willowFinalWidth = willowFinalMaxX - willowFinalMinX;
  const willowShiftLeftX = willowFinalWidth * 0.7;
  const willowShiftRightX = willowFinalWidth * 0.1;
  const willowShiftUpY = willowAdjustedHeight * 0.15;
  const willowAdjustedMinY = willowCenterY - willowAdjustedHeight / 2;
  const willowAdjustedMaxY = willowCenterY + willowAdjustedHeight / 2;
  const willowAdditionalUpY = willowAdjustedHeight * 0.05;
  const willowTopY = willowAdjustedMaxY + willowShiftUpY + willowAdditionalUpY;
  const willowBottomYBeforeHeightTrim =
    willowAdjustedMinY + willowShiftUpY + willowAdditionalUpY;
  const willowBottomY =
    willowBottomYBeforeHeightTrim +
    (willowTopY - willowBottomYBeforeHeightTrim) * 0.4;

  const foodForestMinX = bounds3857.minX + spanX * 0.616;
  const foodForestMaxX = bounds3857.minX + spanX * 0.672;
  const foodForestBottomY = bounds3857.minY + spanY * 0.7;
  const foodForestTopY = bounds3857.minY + spanY * 0.76;
  const foodForestWidth = foodForestMaxX - foodForestMinX;
  const foodForestHeight = (foodForestTopY - foodForestBottomY) * 1.4;
  const foodForestBottomCenterX = (foodForestMinX + foodForestMaxX) / 2;
  const foodForestRotation = (12 * Math.PI) / 180;
  const foodForestLeftX = -foodForestWidth / 2 + foodForestWidth * 0.3;
  const foodForestRightX = foodForestWidth / 2 + foodForestWidth * 0.2;
  const foodForestCurrentWidth = foodForestRightX - foodForestLeftX;
  const foodForestAdjustedRightX =
    foodForestLeftX + foodForestCurrentWidth * 0.7;
  const foodForestShiftX = foodForestCurrentWidth * 0.3;
  const foodForestBottomEdgeY = -foodForestHeight * 0.1;

  const foodForestCorners = [
    { x: foodForestLeftX + foodForestShiftX, y: foodForestBottomEdgeY },
    {
      x: foodForestAdjustedRightX + foodForestShiftX,
      y: foodForestBottomEdgeY,
    },
    { x: foodForestAdjustedRightX + foodForestShiftX, y: foodForestHeight },
    { x: foodForestLeftX + foodForestShiftX, y: foodForestHeight },
  ].map((point) => {
    const rotated = rotatePoint(point, foodForestRotation);
    return {
      x: rotated.x + foodForestBottomCenterX,
      y: rotated.y + foodForestBottomY,
    };
  });

  return [
    rectangleZone(
      "zone-a",
      "Willows",
      "#86efac",
      "#15803d",
      willowFinalMinX - willowShiftLeftX + willowShiftRightX,
      willowBottomY,
      willowFinalMaxX - willowShiftLeftX + willowShiftRightX,
      willowTopY,
    ),
    polygonZone(
      "zone-b",
      "Food Forest",
      "#93c5fd",
      "#1d4ed8",
      foodForestCorners,
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
