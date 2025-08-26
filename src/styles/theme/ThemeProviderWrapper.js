import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import defaultTheme from "./defaultTheme";
import { deepmerge } from "@mui/utils";

const ThemeProviderWrapper = ({ theme: userTheme, children }) => {
  const mergedOptions = userTheme ? deepmerge(defaultTheme, userTheme) : defaultTheme;
  const mergedTheme = createTheme(mergedOptions);

  return (
    <ThemeProvider theme={mergedTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeProviderWrapper;
