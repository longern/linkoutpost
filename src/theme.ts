export const brandThemes = {
  dark: {
    accent: "#81021F",
    accentHover: "#A30A32",
    border: "#343434",
    borderStrong: "#4A4A4A",
    pageBackground: "#101010",
    raisedBackground: "#181818",
    rowBackground: "#1D1D1D",
    text: "#F2F2F2",
    tintBackground: "#151515",
  },
  light: {
    accent: "#81021F",
    accentHover: "#650218",
    border: "#E7D2C7",
    borderStrong: "#E0C8BC",
    pageBackground: "whitesmoke",
    raisedBackground: "#FFFFFF",
    rowBackground: "#FFFDFC",
    text: "#172033",
    tintBackground: "#F7E7DD",
  },
} as const;

export const brandTheme = brandThemes.dark;
