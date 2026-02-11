import type { SxProps, Theme } from "@mui/material/styles";

export const mapVersionSliderSx: SxProps<Theme> = {
  width: "100%",
  px: 0,
  py: 0,
  "& .MuiSlider-mark": {
    width: { xs: 3, sm: 4 },
    height: { xs: 3, sm: 4 },
    borderRadius: "50%",
  },
  "& .MuiSlider-rail, & .MuiSlider-track": {
    height: { xs: 3, sm: 5 },
    borderRadius: 999,
  },
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    width: { xs: 12, sm: 16 },
    height: { xs: 12, sm: 16 },
  },
};
