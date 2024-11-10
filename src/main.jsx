import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './utils/auth';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './config/theme';
import { CssBaseline } from '@mui/material';
import Extension from './extension/Extension';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline>
        <AuthProvider>
          {BUILDEXT ? <Extension /> : <App />}
        </AuthProvider>
      </CssBaseline>
    </ThemeProvider>
  </StrictMode>,
)
