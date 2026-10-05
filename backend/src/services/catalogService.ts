export interface MediaRecord {
  id: number;
  tipo: string;
  url: string | null;
  bucket_id: string | null;
  object_path: string | null;
  alt_text: string | null;
  titulo: string | null;
}

export const parsePage = (value: unknown): number => {
  const parsed = Number.parseInt(String(value ?? '1'), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export const parseLimit = (value: unknown): number => {
  const parsed = Number.parseInt(String(value ?? '20'), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }
  return Math.min(parsed, 100);
};

export const resolvePublicMediaUrl = (media: MediaRecord): string | null => {
  if (media.url) {
    return media.url;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  if (!supabaseUrl || media.bucket_id !== 'xplorasg-public' || !media.object_path) {
    return null;
  }

  const safePath = media.object_path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${supabaseUrl}/storage/v1/object/public/${media.bucket_id}/${safePath}`;
};

export const serializeMedia = (media: MediaRecord | null) => {
  if (!media) {
    return null;
  }

  return {
    id: media.id,
    tipo: media.tipo,
    url: resolvePublicMediaUrl(media),
    altText: media.alt_text,
    titulo: media.titulo,
  };
};
