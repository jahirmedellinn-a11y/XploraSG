import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { AppShell } from './layouts/AppShell';
import { Dashboard } from './pages/Dashboard';
import { ExplorePage } from './pages/ExplorePage';
import { Login } from './pages/Login';
import { PlaceDetailPage } from './pages/PlaceDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { AdminContentPage } from './pages/AdminContentPage';
import { AssistantPage } from './pages/AssistantPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AgendaPage } from './pages/AgendaPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';

const MapPage = lazy(() => import('./pages/MapPage').then((module) => ({ default: module.MapPage })));

const MapRoute = () => (
  <Suspense fallback={<div className="mx-auto max-w-4xl px-5 py-24 text-center font-bold text-stone-600">Preparando mapa…</div>}>
    <MapPage />
  </Suspense>
);

const MessagePage = ({ title, message }: { title: string; message: string }) => (
  <section className="mx-auto max-w-3xl px-5 py-24 text-center">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">XploraSG</p>
    <h1 className="mt-4 text-4xl font-black tracking-tight">{title}</h1>
    <p className="mt-4 text-stone-600">{message}</p>
    <Link to="/explorar" className="mt-7 inline-flex rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white">Volver a explorar</Link>
  </section>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<ExplorePage />} />
            <Route path="/explorar" element={<ExplorePage />} />
            <Route path="/mapa" element={<MapRoute />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/servicios/:slug" element={<ServiceDetailPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/asistente" element={<AssistantPage />} />
            <Route path="/lugares/:slug" element={<PlaceDetailPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<MessagePage title="Acceso denegado" message="Tu cuenta no tiene el rol necesario para abrir esta sección." />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/contenido" element={<AdminContentPage />} />
            </Route>

            <Route path="*" element={<MessagePage title="Página no encontrada" message="La dirección que abriste no existe o cambió de lugar." />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

