// Logotipo oficial de XploraSG (extraído del archivo de marca "png Logo.pdf").
// No se redibuja: siempre se usan las imágenes oficiales de /public/brand.
interface BrandLogoProps {
  /** horizontal: isotipo + palabra (encabezados) · stacked: logo completo con "Turismo inteligente" · mark: sólo isotipo */
  variant?: 'horizontal' | 'stacked' | 'mark';
  /** dark = para fondos claros · light = para fondos oscuros */
  tone?: 'dark' | 'light';
  className?: string;
  /** Muestra la línea "Turismo inteligente" junto a la versión horizontal. */
  tagline?: boolean;
}

export const BrandLogo = ({ variant = 'horizontal', tone = 'dark', className = '', tagline = true }: BrandLogoProps) => {
  const suffix = tone === 'light' ? '-light' : '';
  if (variant === 'stacked') {
    return <img src={`/brand/xplorasg-logo${suffix}.webp`} alt="XploraSG · Turismo inteligente" className={className} width={523} height={480} decoding="async" />;
  }
  if (variant === 'mark') {
    return <img src={`/brand/xplorasg-mark${suffix}.webp`} alt="XploraSG" className={className} width={315} height={240} decoding="async" />;
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src={`/brand/xplorasg-mark${suffix}.webp`} alt="" aria-hidden="true" className="h-10 w-auto sm:h-11" width={315} height={240} />
      <span className="flex flex-col">
        <img src={`/brand/xplorasg-wordmark${suffix}.webp`} alt="XploraSG" className="h-5 w-auto sm:h-[22px]" width={572} height={120} />
        {tagline && (
          <span className={`brand-tagline mt-1 flex items-center gap-1.5 text-[8px] font-medium uppercase tracking-[0.32em] ${tone === 'light' ? 'text-brand-light/80' : 'text-brand-blue/80'}`}>
            <i className="h-px w-2.5 bg-brand-gold" aria-hidden="true" />
            Turismo inteligente
          </span>
        )}
      </span>
    </span>
  );
};
