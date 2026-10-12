// Proveedores de IA opcionales para el asistente.
// Se activan sólo si existen sus variables de entorno; si no, el asistente usa el motor local.
//   OpenAI (o compatible):  OPENAI_API_KEY + OPENAI_MODEL  [+ OPENAI_BASE_URL]
//                           (o las variables heredadas AI_PROVIDER_URL / AI_PROVIDER_API_KEY / AI_PROVIDER_MODEL)
//   Anthropic:              ANTHROPIC_API_KEY + ANTHROPIC_MODEL

export type AiProvider = 'openai' | 'anthropic';

const SYSTEM_PROMPT = [
  'Eres Chatboot, la guía de XploraSG: una guía local de campo que conoce la Sierra Gorda de Querétaro.',
  'Responde en el idioma indicado en "idiomaDeRespuesta" del contexto (español si no se indica).',
  'Tono sobrio, directo y cercano, como alguien que conoce el terreno. Máximo 150 palabras; viñetas sólo al enumerar lugares.',
  'Sin emojis, sin frases de relleno ("¡Claro!", "¡Excelente pregunta!", "¿En qué más puedo ayudarte?") y sin mencionar que eres una IA o un modelo.',
  'Usa ÚNICAMENTE los datos del contexto (catálogo verificado, clima y agenda). No inventes lugares, precios, horarios, distancias ni cobertura celular.',
  'Si algo no está en el contexto, dilo en una frase y propone qué sí puedes ofrecer. Si un lugar está cerrado, adviértelo.',
  'Si llueve, desaconseja ríos, cañones y cascadas por seguridad.',
].join(' ');

interface ProviderConfig { provider: AiProvider; apiKey: string; model: string; url: string }

export const configuredProvider = (): ProviderConfig | null => {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const anthropicModel = process.env.ANTHROPIC_MODEL?.trim();
  if (anthropicKey && anthropicModel) {
    return { provider: 'anthropic', apiKey: anthropicKey, model: anthropicModel, url: 'https://api.anthropic.com/v1/messages' };
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || process.env.AI_PROVIDER_API_KEY?.trim();
  const openaiModel = process.env.OPENAI_MODEL?.trim() || process.env.AI_PROVIDER_MODEL?.trim();
  const openaiUrl = process.env.AI_PROVIDER_URL?.trim()
    || `${(process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`;
  if (openaiKey && openaiModel) {
    return { provider: 'openai', apiKey: openaiKey, model: openaiModel, url: openaiUrl };
  }
  return null;
};

export const askAiProvider = async (question: string, context: unknown): Promise<{ text: string; provider: AiProvider } | null> => {
  const config = configuredProvider();
  if (!config) return null;
  const url = new URL(config.url);
  if (url.protocol !== 'https:') throw new Error('La URL del proveedor de IA debe usar HTTPS.');

  const userContent = `Pregunta del turista: ${question}\n\nContexto verificado de XploraSG (JSON):\n${JSON.stringify(context).slice(0, 12_000)}`;
  const signal = AbortSignal.timeout(15_000);

  if (config.provider === 'anthropic') {
    const response = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: config.model, max_tokens: 600, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userContent }] }),
    });
    if (!response.ok) throw new Error(`Anthropic respondió ${response.status}.`);
    const payload = await response.json() as { content?: Array<{ type: string; text?: string }> };
    const text = payload.content?.filter((block) => block.type === 'text').map((block) => block.text).join('\n').trim();
    return text ? { text, provider: 'anthropic' } : null;
  }

  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.3,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
    }),
  });
  if (!response.ok) throw new Error(`El proveedor de IA respondió ${response.status}.`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text ? { text, provider: 'openai' } : null;
};
