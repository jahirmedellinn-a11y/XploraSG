import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { dashboardMessages, roleLabel } from '../i18n/auth';
import { common } from '../i18n/common';
import {
  ArrowRightIcon, CalendarIcon, HeartIcon, MapIcon, ShieldIcon, SparkleIcon,
} from '../components/brand/icons';
import { ItalicTail } from '../components/home/HomeUi';

const extraMessages = defineMessages({
  quickTitle: 'Accesos rápidos',
  favoritesHint: 'Lugares que guardaste',
  mapHint: 'Ubícate y traza rutas',
  agendaHint: 'Fiestas y promociones',
  rateHint: 'Encuesta de 2 minutos',
}, {
  quickTitle: 'Quick links',
  favoritesHint: 'Places you saved',
  mapHint: 'Find yourself and plan routes',
  agendaHint: 'Festivals and deals',
  rateHint: '2-minute survey',
});

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const m = useMessages(dashboardMessages);
  const x = useMessages(extraMessages);
  const c = useMessages(common);
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const firstName = user?.nombre?.split(' ')[0] || m.travelerFallback;
  const quickLinks = [
    { to: '/favoritos', label: c.favorites, hint: x.favoritesHint, Icon: HeartIcon },
    { to: '/mapa', label: c.map, hint: x.mapHint, Icon: MapIcon },
    { to: '/agenda', label: c.agenda, hint: x.agendaHint, Icon: CalendarIcon },
    { to: '/encuesta', label: c.rateUs, hint: x.rateHint, Icon: SparkleIcon },
  ];
  const label = 'label-quiet';

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      {/* Encabezado */}
      <div className="flex flex-col gap-6 border-b border-brand-sand pb-10 sm:flex-row sm:items-end lg:pb-12">
        <span className="font-display grid size-20 shrink-0 place-items-center rounded-full bg-brand-light text-4xl text-brand-blue" aria-hidden="true">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="eyebrow">{m.eyebrow}</p>
          <h1 className="mt-4 break-words text-[2.5rem] leading-[1.05] text-brand-blue sm:text-5xl"><ItalicTail text={m.greeting(firstName)} words={1} /></h1>
          <p className="mt-3 text-[15px] leading-7 text-brand-blue/75">{m.intro}</p>
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Perfil */}
        <div className="lg:col-span-7 lg:pr-8">
          <h2 className="text-2xl text-brand-blue sm:text-[1.75rem]">{m.profileTitle}</h2>
          <dl className="mt-6 border-b border-brand-sand text-sm">
            {[
              { key: 'name', label: m.name, value: user?.nombre || m.noName },
              { key: 'email', label: m.email, value: user?.email },
            ].map((row) => (
              <div key={row.key} className="grid gap-1 border-t border-brand-sand py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
                <dt className={label}>{row.label}</dt>
                <dd className="truncate text-[15px] text-brand-blue">{row.value}</dd>
              </div>
            ))}
            <div className="grid gap-1 border-t border-brand-sand py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
              <dt className={label}>{m.role}</dt>
              <dd className="text-[15px] capitalize text-brand-green">{roleLabel(user?.rol, lang)}</dd>
            </div>
          </dl>
          <button type="button" onClick={handleLogout} className="btn btn-secondary mt-7 px-6">
            {m.logout}
          </button>
        </div>

        {/* Estado de la cuenta */}
        <div className="rounded-xl bg-brand-light p-7 sm:p-9 lg:col-span-5 lg:self-start">
          <p className="eyebrow">{m.statusEyebrow}</p>
          <h2 className="mt-5 flex items-center gap-3 text-2xl text-brand-blue sm:text-[1.75rem]">
            <ShieldIcon className="size-5 shrink-0 text-brand-green" />
            {m.statusTitle}
          </h2>
          <p className="mt-4 text-sm leading-7 text-brand-blue/75">{m.statusText}</p>
          {user?.rol === 'administrador' && (
            <div className="mt-7 border-t border-brand-sand pt-6 text-sm leading-6 text-brand-blue/75">
              <p>{m.adminText}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link to="/admin" className="btn btn-primary min-h-11 px-5">{m.openAdmin}<ArrowRightIcon className="size-4" /></Link>
                <Link to="/admin/contenido" className="border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green">{m.contentReview}</Link>
              </div>
            </div>
          )}
          {user?.rol === 'prestador' && (
            <div className="mt-7 border-t border-brand-sand pt-6 text-sm leading-6 text-brand-blue/75">
              <p>{m.providerText}</p>
              <Link to="/mi-negocio" className="btn btn-primary mt-5 min-h-11 px-5">{m.goToBusiness}<ArrowRightIcon className="size-4" /></Link>
            </div>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      <h2 className="mt-16 text-2xl text-brand-blue sm:text-[1.75rem] lg:mt-20">{x.quickTitle}</h2>
      <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ to, label: linkLabel, hint, Icon }) => (
          <li key={to} className="border-t border-brand-sand">
            <Link to={to} className="group flex items-start gap-4 py-5">
              <Icon className="mt-1 size-5 shrink-0 text-brand-teal" />
              <span className="min-w-0 flex-1">
                <span className="font-display block text-lg text-brand-blue transition-colors duration-300 group-hover:text-brand-green">{linkLabel}</span>
                <span className="mt-0.5 block text-xs text-brand-blue/70">{hint}</span>
              </span>
              <ArrowRightIcon className="mt-1.5 size-4 shrink-0 text-brand-blue/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-green" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
