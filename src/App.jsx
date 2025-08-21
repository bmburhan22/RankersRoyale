import { Container } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import Home from "./screens/Home";
import AdminHome from "./screens/AdminHome";

const App = () => <Container sx={{ bgcolor: 'green', height: '100vh', width: '100vw' }} disableGutters maxWidth={false}>
    <BrowserRouter >
        <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.ADMIN_HOME} element={<AdminHome />} />
        </Routes>
    </BrowserRouter>
</Container>
export default App;