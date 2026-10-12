import { useEffect } from 'react';

/** Título de la pestaña y descripción por página (mejora SEO y al compartir enlaces). */
export const usePageTitle = (title: string | null | undefined, description?: string | null) => {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} | XploraSG`;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description.slice(0, 160));
    }
  }, [title, description]);
};
