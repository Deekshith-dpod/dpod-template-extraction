# template_extraction
Handling the template extraction

Your Custom Library
A React library with customizable theming using Material-UI, featuring ExtractionConfig and TemplateExtraction components.
Installation
npm install your-custom-lib @mui/material @emotion/react @emotion/styled

Usage
Wrap your app with ExtractionConfig or TemplateExtraction and pass a custom theme to customize styling.
import { createTheme } from '@mui/material/styles';
import { ExtractionConfig, TemplateExtraction } from 'your-custom-lib';
import { useState } from 'react';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#6200ea',
    },
    secondary: {
      main: '#03dac6',
    },
    background: {
      default: '#e8eaf6',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: '"Poppins", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
    },
  },
});

function App() {
  const [theme, setTheme] = useState(customTheme);

  const handleSubmit = (data) => {
    console.log('Submitted:', data);
  };

  return (
    <div>
      <ExtractionConfig theme={theme} onSubmit={handleSubmit} />
      <TemplateExtraction theme={theme} onSubmit={handleSubmit} />
    </div>
  );
}

export default App;

Theme Customization

Pass a theme prop to ExtractionConfig or TemplateExtraction to customize styles.
Use MUI's createTheme to define your theme, overriding palette, typography, etc.
Example:const customTheme = createTheme({
  palette: {
    primary: { main: '#ff5722' },
  },
});



Dynamic Theme Switching
Use the toggleThemeMode utility to switch between light and dark modes:
import { toggleThemeMode } from 'your-custom-lib';

const handleToggleTheme = () => {
  setTheme(toggleThemeMode(theme));
};

Notes

Ensure @mui/material, @emotion/react, and @emotion/styled are installed as peer dependencies.
Components use the Inter font by default but respect your theme's typography.fontFamily.
