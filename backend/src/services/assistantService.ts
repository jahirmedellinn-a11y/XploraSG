export type AssistantItemType = 'lugar' | 'servicio' | 'actividad';

export interface AssistantCatalogItem {
  tipo: AssistantItemType;
  id: number;
  nombre: string;
  slug: string | null;
  municipio: string;
  descripcion: string | null;
  detalle: string | null;
  latitud: string | number | null;
  longitud: string | number | null;
}

export interface AssistantReference {
  tipo: AssistantItemType;
  id: number;
  nombre: string;
  slug: string | null;
  municipio: string;
  resumen: string | null;
  distanciaKm: number | null;
  /** Lugar con coordenadas verificadas (se puede abrir en el mapa). */
  enMapa?: boolean;
  /** Contacto del servicio (para el botón Contactar). */
  contacto?: string | null;
  /** Precio (servicios) o qué hacer (lugares), para la tarjeta. */
  detalle?: string | null;
}

interface Coordinates {
  latitud: number;
  longitud: number;
}

const stopWords = new Set([
  'a', 'al', 'algo', 'con', 'de', 'del', 'donde', 'el', 'en', 'hay', 'la', 'las',
  'lo', 'los', 'me', 'para', 'por', 'puedo', 'que', 'qué', 'se', 'un', 'una', 'y',
]);

export const normalizeForSearch = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokensFor = (question: string): string[] => normalizeForSearch(question)
  .split(' ')
  .filter((token) => token.length > 2 && !stopWords.has(token));

const numberCoordinate = (value: string | number | null): number | null => {
  if (value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const radians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceKm = (origin: Coordinates, item: AssistantCatalogItem): number | null => {
  const latitude = numberCoordinate(item.latitud);
  const longitude = numberCoordinate(item.longitud);
  if (latitude === null || longitude === null) return null;
  const latitudeDelta = radians(latitude - origin.latitud);
  const longitudeDelta = radians(longitude - origin.longitud);
  const firstLatitude = radians(origin.latitud);
  const secondLatitude = radians(latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const itemText = (item: AssistantCatalogItem) => normalizeForSearch([
  item.nombre,
  item.municipio,
  item.descripcion || '',
  item.detalle || '',
].join(' '));

const intendedTypes = (normalizedQuestion: string): Set<AssistantItemType> | null => {
  if (/servicio|hotel|hosped|restaurante|comer|comida|tour/.test(normalizedQuestion)) {
    return new Set(['servicio']);
  }
  if (/actividad|sender|nadar|camp|aventura/.test(normalizedQuestion)) {
    return new Set(['actividad', 'lugar']);
  }
  if (/lugar|sitio|visitar|conocer|atraccion/.test(normalizedQuestion)) {
    return new Set(['lugar']);
  }
  return null;
};

export const selectGroundedItems = (
  question: string,
  items: AssistantCatalogItem[],
  origin?: Coordinates | null,
): AssistantReference[] => {
  const normalizedQuestion = normalizeForSearch(question);
  const tokens = tokensFor(question);
  const municipalities = [...new Set(items.map((item) => item.municipio))];
  const requestedMunicipality = municipalities.find((municipality) =>
    normalizedQuestion.includes(normalizeForSearch(municipality)));
  const types = intendedTypes(normalizedQuestion);
  const asksNearby = /cerca|cercan|proximo|proxima/.test(normalizedQuestion);

  let candidates = items.filter((item) => !requestedMunicipality || item.municipio === requestedMunicipality);
  if (types) candidates = candidates.filter((item) => types.has(item.tipo));

  const ranked = candidates.map((item) => {
    const normalizedName = normalizeForSearch(item.nombre);
    const normalizedMunicipality = normalizeForSearch(item.municipio);
    const haystack = itemText(item);
    const score = tokens.reduce((total, token) => total
      + (normalizedName.includes(token) ? 5 : 0)
      + (normalizedMunicipality.includes(token) ? 3 : 0)
      + (haystack.includes(token) ? 1 : 0), 0);
    return { item, score, distance: origin ? distanceKm(origin, item) : null };
  });

  ranked.sort((left, right) => {
    if (asksNearby && origin) {
      if (left.distance === null) return 1;
      if (right.distance === null) return -1;
      return left.distance - right.distance;
    }
    return right.score - left.score || left.item.nombre.localeCompare(right.item.nombre, 'es');
  });

  const hasContext = Boolean(requestedMunicipality || types || (asksNearby && origin));
  const selected = ranked.filter((entry) => hasContext || entry.score > 0).slice(0, 8);
  return selected.map(({ item, distance }) => ({
    tipo: item.tipo,
    id: item.id,
    nombre: item.nombre,
    slug: item.slug,
    municipio: item.municipio,
    resumen: item.descripcion || item.detalle,
    distanciaKm: distance === null ? null : Math.round(distance * 10) / 10,
  }));
};

const shortText = (value: string | null, length = 180): string => {
  if (!value) return 'Consulta la ficha para ver la información disponible.';
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > length ? `${compact.slice(0, length - 1).trim()}…` : compact;
};

export const buildCatalogAnswer = (references: AssistantReference[]): string => {
  if (!references.length) {
    return 'Ahora mismo no hay información publicada suficiente en XploraSG para responder esa pregunta sin inventar datos. Puedes consultar Explorar o cambiar el municipio o tipo de servicio en tu búsqueda.';
  }
  const lines = references.map((item) => {
    const distance = item.distanciaKm === null ? '' : ` · a ${item.distanciaKm} km de tu ubicación`;
    return `• ${item.nombre} (${item.municipio})${distance}: ${shortText(item.resumen)}`;
  });
  return `Con la información publicada y verificada de XploraSG encontré estas opciones:\n\n${lines.join('\n')}\n\nAbre las fichas relacionadas para confirmar acceso, horarios y recomendaciones antes de salir.`;
};

export const askConfiguredModel = async (
  question: string,
  references: AssistantReference[],
): Promise<string | null> => {
  const endpoint = process.env.AI_PROVIDER_URL?.trim();
  const apiKey = process.env.AI_PROVIDER_API_KEY?.trim();
  const model = process.env.AI_PROVIDER_MODEL?.trim();
  if (!endpoint || !apiKey || !model || !references.length) return null;

  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('AI_PROVIDER_URL debe utilizar HTTPS.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'Eres el asistente turístico de XploraSG. Responde en español únicamente con los registros suministrados. No inventes lugares, servicios, distancias, precios ni horarios. Si los datos no bastan, dilo claramente.',
          },
          {
            role: 'user',
            content: `Pregunta: ${question}\n\nRegistros publicados de XploraSG:\n${JSON.stringify(references)}`,
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`El proveedor de IA respondió ${response.status}.`);
    const payload = await response.json() as {
      output_text?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.output_text?.trim() || payload.choices?.[0]?.message?.content?.trim() || null;
  } finally {
    clearTimeout(timeout);
  }
};
