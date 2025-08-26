import React from 'react';
import "@fontsource/inter";
import { createRoot } from 'react-dom/client';
import App from './app.jsx';
import ThemeProviderWrapper from './styles/theme/ThemeProviderWrapper.js';
import theme from "./styles/theme/customTheme.js";
import { AppProvider } from './context/appcontext.js';

createRoot(document.getElementById('root')).render(
    <AppProvider>
        <ThemeProviderWrapper theme={theme}>
            <App />
        </ThemeProviderWrapper>
    </AppProvider>
);


