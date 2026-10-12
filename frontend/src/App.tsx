import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useMessages } from './i18n';
import { common } from './i18n/common';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { AppShell } from './layouts/AppShell';
import { Dashboard } from './pages/Dashboard';
import { ExplorePage } from './pages/ExplorePage';
import { Login } from './pages/Login';
import { PlaceDetailPage } from './pages/PlaceDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { AssistantPage } from './pages/AssistantPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AgendaPage } from './pages/AgendaPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { SurveyPage } from './pages/SurveyPage';
import { AboutUs } from './pages/AboutUs';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import { AuthConfirmPage, ResetPasswordPage } from './pages/AuthCallbackPages';
import { ArrowRightIcon, MapIcon } from './components/brand/icons';

// Paneles internos: se descargan sólo cuando un administrador o prestador los abre.
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage').then((module) => ({ default: module.AdminPanelPage })));
const AdminContentPage = lazy(() => import('./pages/AdminContentPage').then((module) => ({ default: module.AdminContentPage })));
const AdminAgendaPage = lazy(() => import('./pages/AdminAgendaPage').then((module) => ({ default: module.AdminAgendaPage })));
const ProviderPage = lazy(() => import('./pages/ProviderPage').then((module) => ({ default: module.ProviderPage })));

const PanelFallback = () => (
  <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20" role="status" aria-busy="true">
    <div className="h-3 w-32 animate-pulse rounded-full bg-brand-sand" />
    <div className="mt-5 h-10 w-72 max-w-full animate-pulse rounded-lg bg-brand-sand/70" />
    <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-brand-sand bg-brand-sand sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse bg-white" />)}
    </div>
  </div>
);
const panel = (element: ReactNode) => <Suspense fallback={<PanelFallback />}>{element}</Suspense>;

const MapPage = lazy(() => import('./pages/MapPage').then((module) => ({ default: module.MapPage })));

const MapRoute = () => {
  const m = useMessages(common);
  return (
    <Suspense
      fallback={(
        <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 lg:px-8 lg:pt-14" role="status" aria-live="polite">
          <div className="border-b border-brand-sand pb-7 lg:pb-10">
            <div className="h-3 w-40 animate-pulse rounded-full bg-brand-sand" />
            <div className="mt-5 h-12 w-96 max-w-full animate-pulse rounded-lg bg-brand-sand/70" />
          </div>
          <div className="mt-6 grid h-[56vh] min-h-[380px] place-items-center rounded-xl border border-brand-blue/10 bg-brand-light lg:mt-8 lg:h-[calc(100svh-150px)] lg:min-h-[620px] lg:max-h-[880px]">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-brand-sand bg-white px-4 py-2 text-sm text-brand-blue">
              <span className="size-4 animate-spin rounded-full border-2 border-brand-blue/15 border-t-brand-green" aria-hidden="true" />
              {m.loadingMap}
            </span>
          </div>
        </div>
      )}
    >
      <MapPage />
    </Suspense>
  );
};

const NotFoundPage = () => {
  const m = useMessages(common);
  return <MessagePage title={m.notFoundTitle} message={m.notFoundMessage} action={m.backToExplore} secondary={m.map} />;
};

// Página de aviso (404): composición editorial sobria, sin ilustraciones ni degradados.
const MessagePage = ({ title, message, action, secondary }: { title: string; message: string; action: string; secondary: string }) => (
  <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
    <div className="grid gap-10 border-t border-brand-sand pt-10 md:grid-cols-12 md:gap-8 lg:pt-14">
      <p className="font-display text-[5.5rem] font-normal italic leading-none text-brand-gold md:col-span-4 lg:text-[8rem]" aria-hidden="true">404</p>
      <div className="max-w-xl md:col-span-8 md:pt-3">
        <h1 className="text-[2.25rem] leading-[1.08] text-brand-blue sm:text-5xl">{title}</h1>
        <p className="mt-5 text-[15px] leading-7 text-brand-blue/75">{message}</p>
        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link to="/explorar" className="btn btn-accent min-h-12 px-7">{action}<ArrowRightIcon className="size-4" /></Link>
          <Link to="/mapa" className="group inline-flex items-center gap-2 border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green">
            <MapIcon className="size-4" />{secondary}
          </Link>
        </div>
      </div>
    </div>
  </section>
);

function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <FavoritesProvider>
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
            <Route path="/encuesta" element={<SurveyPage />} />
            <Route path="/nosotros" element={<AboutUs />} />
            <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
            <Route path="/auth/confirm" element={<AuthConfirmPage />} />
            <Route path="/privacidad" element={<PrivacyPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['prestador']} />}>
              <Route path="/mi-negocio" element={panel(<ProviderPage />)} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="/admin" element={panel(<AdminPanelPage />)} />
              <Route path="/admin/contenido" element={panel(<AdminContentPage />)} />
              <Route path="/admin/agenda" element={panel(<AdminAgendaPage />)} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </FavoritesProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

