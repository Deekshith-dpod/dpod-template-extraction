import React from "react";
import "@fontsource/inter";
import ThemeProviderWrapper from './styles/theme/ThemeProviderWrapper.js';
import ExtractionHome from './containers/ExtractionHome.js';
import { AppProvider } from "./context/appcontext.js";

export default function AmeyaExtraction({ theme, ...props }) {
    return (
        <AppProvider>
            <ThemeProviderWrapper theme={theme}>
                <ExtractionHome {...props} />
            </ThemeProviderWrapper>
        </AppProvider>
    );
}