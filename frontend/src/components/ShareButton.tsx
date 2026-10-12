import { useState } from 'react';
import { trackEvent } from '../services/feedbackApi';
import { defineMessages, useMessages } from '../i18n';
import { common } from '../i18n/common';
import { ShareIcon } from './ui/LineIcons';

const messages = defineMessages({
  copied: '¡Enlace copiado!',
}, {
  copied: 'Link copied!',
});

// Botón secundario sobrio (borde fino). `tone="light"` lo deja como enlace de texto sin borde.
export const ShareButton = ({ title, text, className = '', tone = 'dark' }: { title: string; text?: string; className?: string; tone?: 'light' | 'dark' }) => {
  const [copied, setCopied] = useState(false);
  const m = useMessages(messages);
  const c = useMessages(common);

  const share = async () => {
    const url = window.location.href;
    trackEvent('compartir');
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} | XploraSG`, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // el usuario canceló el diálogo de compartir
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-live="polite"
      className={`btn ${tone === 'light' ? 'btn-ghost' : 'btn-secondary'} ${className}`}
    >
      <ShareIcon className="size-4" />
      {copied ? m.copied : c.share}
    </button>
  );
};
