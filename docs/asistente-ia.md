# Asistente turístico fundamentado

## Estado

La Fase 4F cuenta con un flujo funcional `frontend → Express → catálogo
aprobado → respuesta`. La ruta pública es `POST /api/asistente/consulta` y la
interfaz está disponible en `/asistente`.

El backend sólo recupera lugares, servicios, prestadores y actividades con
estado `aprobado`. Cada respuesta devuelve las referencias que la sustentan. Si
no existen registros suficientes, responde que no hay información publicada y
no completa la respuesta con conocimiento externo.

## Proveedor de modelo opcional

Sin proveedor configurado, el backend genera una respuesta determinista a
partir de las mismas referencias; esto permite probar todo el flujo sin exponer
una clave. Para habilitar un proveedor compatible con mensajes se requieren:

- `AI_PROVIDER_URL`: endpoint HTTPS completo.
- `AI_PROVIDER_MODEL`: identificador del modelo elegido.
- `AI_PROVIDER_API_KEY`: clave sólo del backend.

La petición al modelo incluye únicamente la pregunta y un máximo de ocho
referencias publicadas. Si el proveedor falla o supera 12 segundos, la API
regresa la respuesta segura de catálogo. La clave nunca usa prefijo `VITE_`.

## Controles

- Preguntas entre 3 y 500 caracteres.
- Máximo de 20 consultas por dirección IP en diez minutos por proceso.
- Coordenadas opcionales validadas en backend para ordenar lugares cercanos.
- El asistente se deshabilita sin conexión; el catálogo sincronizado sigue
  disponible de forma offline.
- No se consultan borradores ni contenido rechazado o suspendido.
