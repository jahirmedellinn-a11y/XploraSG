// Guacamaya verde: mascota de XploraSG (ave emblemática del Sótano del Barro).
// Ilustración propia en la paleta de la marca: verde, turquesa, dorado, azul y crema.

/** Guacamaya posada (asistente, avatar). */
export const MacawMark = ({ className = 'size-10', perch = false }: { className?: string; perch?: boolean }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
    <path d="M23.5 41C21 49 17 56 12 62.5c4.5-1 9-6.5 13.5-13.5 1-2 2-4.5 2.5-6.5Z" fill="var(--color-brand-teal)" />
    <path d="M27 42.5c-1 7.5-3.5 14.5-7 20.5 4-2 7.5-8 9.5-14 .7-2 1.1-4 1.3-6Z" fill="var(--color-brand-green)" />
    <path d="M21.5 40.5c-4-9.5-.5-21 9.5-25.5 7.5-3.4 15.5-.5 17.2 6.5 1.6 7-3.2 16-11.2 20.7-5.5 3.2-12 2.8-15.5-1.7Z" fill="var(--color-brand-green)" />
    <path d="M33 43c7.5-3 13.4-10 14.6-17.4 2 6.4-3 15.6-14.6 17.4Z" fill="#3B9461" />
    <path d="M21.4 39.6c-1-8.2 4.2-14.6 12.2-14.2 2 8.6-3.6 15.4-12.2 14.2Z" fill="var(--color-brand-teal)" />
    <path d="M23.5 37.4c.9-5.4 4.1-8.6 8.7-9M24.6 39c3-1.4 5.6-4 7-7.6" stroke="var(--color-brand-blue)" strokeOpacity=".22" strokeWidth="1.1" strokeLinecap="round" />
    <path d="M40.2 14.6c4.4-1.4 9.2 1 10.4 5.8-1.6 3.4-6.6 3.6-9.4 1-1.6-1.6-2-4.8-1-6.8Z" fill="var(--color-brand-light)" />
    <path d="M42.6 20.2l2.6.4M42.2 18.4l2.2.1" stroke="var(--color-brand-blue)" strokeOpacity=".35" strokeWidth=".7" strokeLinecap="round" />
    <path d="M37.6 21.6c3-1.4 6.8 0 8 3.2-2.4 2.6-6.6 2.4-8.6-.2Z" fill="var(--color-brand-gold)" />
    <circle cx="44.6" cy="17.4" r="1.9" fill="var(--color-brand-blue)" />
    <circle cx="45.1" cy="16.9" r=".55" fill="#fff" />
    <path d="M49 14.6c5.6-1 9.4 3.2 8.6 8.8-.4 3.2-2.8 4.8-4.8 4 1.6-2.2 1.8-6-2-7-.8-1.8-1.2-3.8-1.8-5.8Z" fill="var(--color-brand-blue)" />
    <path d="M50.6 21c1.8.8 2.2 3.4 1 4.8-1.6-.6-2.2-3-1-4.8Z" fill="var(--color-brand-blue)" opacity=".75" />
    <path d="M29 44.6v3.2M33.4 43.8v3.6" stroke="var(--color-brand-gold)" strokeWidth="1.9" strokeLinecap="round" />
    {perch && <path d="M24 47.6h15" stroke="var(--color-brand-blue)" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" />}
  </svg>
);
