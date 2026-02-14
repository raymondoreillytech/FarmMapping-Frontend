export const MAP_VERSION_MARKS = [
  { value: 2, label: "Aug 2025"},
  { value: 3, label: "Dec 2025"},
  { value: 4, label: "Jan 2026"},
];

export const MAP_VERSION_MIN = MAP_VERSION_MARKS[0].value;
export const MAP_VERSION_MAX =
  MAP_VERSION_MARKS[MAP_VERSION_MARKS.length - 1].value;

export const mapVersionValueText = (value: number) => {
  const mark = MAP_VERSION_MARKS.find((item) => item.value === value);
  return mark ? `Version ${value} (${mark.label})` : `Version ${value}`;
};

export const SHOW_EDIT_BUTTON =
  import.meta.env.VITE_SHOW_EDIT_BUTTON === "true";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.trim().replace(
  /\/+$/,
  "",
);
