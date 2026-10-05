export const reviewStates = [
  'borrador',
  'en_revision',
  'aprobado',
  'rechazado',
  'suspendido',
] as const;

export type ReviewState = typeof reviewStates[number];
export type ReviewContentKind = 'lugar' | 'servicio';

export interface ReviewReadiness {
  has_description: boolean;
  has_location: boolean;
  has_source: boolean;
  has_contact: boolean;
  has_provider: boolean;
  has_public_media: boolean;
}

export const parseReviewState = (value: unknown): ReviewState | null => {
  if (typeof value !== 'string') return null;
  return reviewStates.includes(value as ReviewState) ? value as ReviewState : null;
};

export const parseReviewContentKind = (value: unknown): ReviewContentKind | null => {
  if (value === 'lugar' || value === 'servicio') return value;
  return null;
};

export const approvalRequirements = (
  kind: ReviewContentKind,
  readiness: ReviewReadiness,
): string[] => {
  const missing: string[] = [];
  if (!readiness.has_description) missing.push('descripción');
  if (!readiness.has_location) missing.push(kind === 'lugar' ? 'coordenadas verificadas' : 'municipio');
  if (!readiness.has_source) missing.push('fuente de verificación');
  if (kind === 'servicio' && !readiness.has_contact) missing.push('contacto público');
  if (kind === 'servicio' && !readiness.has_provider) missing.push('prestador identificado');
  if (!readiness.has_public_media) missing.push('multimedia pública autorizada');
  return missing;
};

