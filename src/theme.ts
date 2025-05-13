// theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
  },
  typography: {
    fontFamily: "var(--font-pretendard), sans-serif",
    button: {
      textTransform: "none",
    },
  },
});

export default theme;
