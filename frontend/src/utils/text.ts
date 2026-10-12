// Convierte la frase de actividades de una ficha en etiquetas cortas.
// "Senderismo, fotografía y observación de aves." → ["Senderismo", "Fotografía", "Observación de aves"]
export const activityTags = (value: string | null | undefined, max = 3): string[] => {
  if (!value) return [];
  const parts = value
    .replace(/\.$/, '')
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts.pop();
  if (last) {
    const match = last.match(/ (y|and) /);
    const index = match?.index ?? -1;
    if (match && index > 0) parts.push(last.slice(0, index), last.slice(index + match[0].length));
    else parts.push(last);
  }
  return parts
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
    .filter((part) => part.length > 2 && part.length < 48)
    .slice(0, max);
};

export const isClosedNotice = (value: string | null | undefined): boolean => /\b(cerrad[oa]|closed)\b/i.test(value ?? '');
