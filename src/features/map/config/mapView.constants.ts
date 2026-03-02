export type MapVersionMark = {
  value: number;
  label: string;
  messageKey: string;
};

export const MAP_VERSION_MARKS: MapVersionMark[] = [
  { value: 0, label: "Jul", messageKey: "composite" },
  { value: 1, label: "Aug", messageKey: "composite" },
  { value: 2, label: "Sep", messageKey: "composite" },
  { value: 3, label: "Oct", messageKey: "" },
  { value: 4, label: "Dec", messageKey: "" },
  { value: 5, label: "Jan", messageKey: "" },
  { value: 6, label: "Feb", messageKey: "" },
  
];

const MAP_VERSION_MESSAGES: Record<string, string> = {
  composite:
    "This version of the map is a composite of multiple sources. It may contain unusual artifacts, seam, and alignment issues.",
  historic:
    "This version is historic and may not reflect current conditions.",
};

export const MAP_VERSION_MIN = MAP_VERSION_MARKS[0].value;
export const MAP_VERSION_MAX =
  MAP_VERSION_MARKS[MAP_VERSION_MARKS.length - 1].value;

export const mapVersionValueText = (value: number) => {
  const mark = MAP_VERSION_MARKS.find((item) => item.value === value);
  return mark ? `Version ${value} (${mark.label})` : `Version ${value}`;
};

export const getMapVersionMessage = (messageKey: string) =>
  MAP_VERSION_MESSAGES[messageKey] ?? "";

export const SHOW_EDIT_BUTTON =
  import.meta.env.VITE_SHOW_EDIT_BUTTON === "true";

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").toString();

export const API_BASE_URL = rawApiBaseUrl.trim().replace(/\/+$/, "");
