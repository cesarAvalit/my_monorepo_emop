import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import Home from './pages/Home';
import Login from './pages/Login';
import AltaUsuarios from './pages/AltaUsuarios';
import GestionOT from './pages/GestionOT';
import AlertasVencimiento from './pages/AlertasVencimiento';
import Mantenimientos from './pages/Mantenimientos';
import Registros from './pages/Registros';
import ReportesDDJJ from './pages/ReportesDDJJ';
import AuditoriaModificaciones from './pages/AuditoriaModificaciones';
import DDJJRegistradas from './pages/DDJJRegistradas';
import NuevosDDJJ from './pages/NuevosDDJJ';
import TableroMantenimiento from './pages/TableroMantenimiento';
import Personal from './pages/Personal';
import AsignacionDDJJ from './pages/AsignacionDDJJ';
import ExploradorAuditorias from './pages/ExploradorAuditorias';
import Perfil from './pages/Perfil';
import Notificaciones from './pages/Notificaciones';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alta-usuarios" 
            element={
              <ProtectedRoute>
                <AltaUsuarios />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gestion-ot" 
            element={
              <ProtectedRoute>
                <GestionOT />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alertas-vencimiento" 
            element={
              <ProtectedRoute>
                <AlertasVencimiento />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mantenimientos" 
            element={
              <ProtectedRoute>
                <Mantenimientos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/registros" 
            element={
              <ProtectedRoute>
                <Registros />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reportes-ddjj" 
            element={
              <ProtectedRoute>
                <ReportesDDJJ />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/auditoria-modificaciones" 
            element={
              <ProtectedRoute>
                <AuditoriaModificaciones />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nuevos-ddjj" 
            element={
              <ProtectedRoute>
                <DDJJRegistradas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nuevos-ddjj-form" 
            element={
              <ProtectedRoute>
                <NuevosDDJJ />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tablero-mantenimiento" 
            element={
              <ProtectedRoute>
                <TableroMantenimiento />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/personal" 
            element={
              <ProtectedRoute>
                <Personal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/asignacion-ddjj" 
            element={
              <ProtectedRoute>
                <AsignacionDDJJ />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/explorador-auditorias" 
            element={
              <ProtectedRoute>
                <ExploradorAuditorias />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/perfil" 
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notificaciones" 
            element={
              <ProtectedRoute>
                <Notificaciones />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
