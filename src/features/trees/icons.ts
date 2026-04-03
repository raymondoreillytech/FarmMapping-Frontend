import L from "leaflet";
import { buildApiUrl } from "../../lib/api";

const availableImageIcons = new Set([
  "OakIcon",
  "PineIcon",
  "PlaneIcon",
  "PricklyPearCactusIcon",
]);

const markerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
  <path fill="#122032" d="M16 1C8.82 1 3 6.82 3 14c0 10.56 13 33 13 33s13-22.44 13-33C29 6.82 23.18 1 16 1z"/>
  <circle cx="16" cy="14" r="10" fill="#f8fafc"/>
  <text x="16" y="19" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#122032">?</text>
</svg>
`;

const genericMarkerIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  tooltipAnchor: [0, -34],
});

const iconCache = new Map<string, L.Icon>();

function createImageIcon(iconKey: string) {
  return L.icon({
    iconUrl: buildApiUrl(`/icons/${iconKey}.png`),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    tooltipAnchor: [0, -32],
  });
}

export function getTreeMarkerIcon(iconKey?: string) {
  if (
    !iconKey ||
    iconKey === "UnknownTreeIcon" ||
    !availableImageIcons.has(iconKey)
  ) {
    return genericMarkerIcon;
  }

  const cachedIcon = iconCache.get(iconKey);

  if (cachedIcon) {
    return cachedIcon;
  }

  const nextIcon = createImageIcon(iconKey);
  iconCache.set(iconKey, nextIcon);
  return nextIcon;
}
