import { Link } from 'react-router-dom';

export const AgendaPage = () => {
  return (
    <section className="mx-auto max-w-5xl px-5 py-24 text-center lg:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-6xl" aria-hidden="true">📅</p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Eventos y promociones</h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          Próximamente podrás consultar aquí el calendario de eventos culturales, festividades y promociones especiales en la Sierra Gorda.
        </p>
        <Link to="/explorar" className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-950 px-6 py-3 text-sm font-black text-white hover:bg-emerald-900 transition-colors">
          Explorar lugares mientras tanto
        </Link>
      </div>
    </section>
  );
};
