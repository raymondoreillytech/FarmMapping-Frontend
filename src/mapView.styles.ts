import type { SxProps, Theme } from "@mui/material/styles";

export const mapVersionSliderSx: SxProps<Theme> = {
  width: "100%",
  px: 1.5,
  py: 1,
  bgcolor: "rgba(255, 255, 255, 0.92)",
  borderRadius: 1.5,
  boxShadow: 1,
  "& .MuiSlider-markLabel": {
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  "& .MuiSlider-rail, & .MuiSlider-track": {
    height: 6,
    borderRadius: 999,
  },
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    width: 18,
    height: 18,
  },
};
