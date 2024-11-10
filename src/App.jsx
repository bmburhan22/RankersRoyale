import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './utils/auth';
import { ROUTES } from '../utils/routes';
import Home from './screens/Home';
import Casinos from './screens/Casinos';
import AdminHome from './screens/AdminHome';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './config/theme';
import { CssBaseline, Container } from '@mui/material';

function App() {

  return (
    <BrowserRouter >
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline>
          <Container sx={{ bgcolor: 'green', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',  alignItems: 'center' }} disableGutters maxWidth={false}>
            <Routes>
              <Route path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.CASINOS_PAGE} element={<Casinos />} />
              <Route path={ROUTES.ADMIN_HOME} element={<AdminHome />} />
            </Routes>
          </Container>
          </CssBaseline>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
