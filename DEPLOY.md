# Despliegue de XploraSG en producción (HTTPS)

Arquitectura gratuita recomendada:

| Pieza | Servicio | Qué aporta |
|---|---|---|
| Base de datos + Auth | **Supabase** (ya existe) | PostgreSQL cifrado, Auth, RLS |
| API (backend) | **Render** (Web Service, plan Free) | Node 22, HTTPS automático |
| Web/PWA (frontend) | **Vercel** (plan Hobby) | CDN global, HTTPS automático |

> El plan gratuito de Render "duerme" el servicio tras ~15 min sin uso; la primera petición tarda ~50 s.
> Antes de una presentación abre `https://<tu-api>.onrender.com/api/health` para despertarlo.

---

## 0. Antes de empezar
1. Sube el proyecto a GitHub (el `.env` **no** se sube: está en `.gitignore`).
2. En Supabase → SQL Editor, aplica en orden las migraciones que falten
   (al menos `012_promociones_revision.sql` y `013_validacion_y_analitica.sql`).

## 1. Backend en Render
1. Render → **New → Blueprint** → elige tu repositorio. Render lee `render.yaml` y crea `xplorasg-api`.
   (Alternativa manual: *New → Web Service*, Root Directory `backend`,
   Build `npm ci --include=dev && npm run build`, Start `npm start`.)
2. En **Environment** captura (copiándolos de tu `.env` local, sin compartirlos con nadie):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Cadena del **pooler** de Supabase (Project Settings → Database → Connection string) |
| `SUPABASE_URL` | `https://<tu-proyecto>.supabase.co` |
| `CORS_ORIGINS` | `https://<tu-app>.vercel.app` (la URL que te dará Vercel en el paso 2) |
| `OPEN_ROUTE_SERVICE_API_KEY` | Tu clave de OpenRouteService |
| `NODE_ENV` | `production` (ya viene en el blueprint) |
| `TRUST_PROXY` | `1` (ya viene) |
| `AUTH_MODE` | `supabase` (ya viene) |
| *(opcional)* `OPENAI_API_KEY` + `OPENAI_MODEL` o `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` | Para que el asistente redacte con IA |

3. Deploy. Comprueba `https://<tu-api>.onrender.com/api/health` → `{"status":"ok"}`.

## 2. Frontend en Vercel
1. Vercel → **Add New → Project** → importa el repositorio.
2. **Root Directory:** `frontend` (Vercel detecta Vite; `vercel.json` ya define build, salida y cabeceras de seguridad).
3. **Environment Variables:**

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://<tu-api>.onrender.com` |
| `VITE_SUPABASE_URL` | `https://<tu-proyecto>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave **publishable/anon** (nunca la `service_role`) |
| `VITE_WHATSAPP_RESERVAS` | WhatsApp de respaldo, p. ej. `52441XXXXXXX` |
| `VITE_CONTACTO_PRIVACIDAD` | Correo para el Aviso de privacidad |
| `VITE_IDLE_TIMEOUT_MIN` | `15` |

4. Deploy. Copia la URL final (`https://<tu-app>.vercel.app`) y ponla en `CORS_ORIGINS` de Render (redeploy).

## 3. Supabase Auth
Authentication → **URL Configuration**:
- **Site URL:** `https://<tu-app>.vercel.app`
- **Redirect URLs:** `https://<tu-app>.vercel.app/**` y `http://localhost:5173/**` (para seguir desarrollando).

Recomendado: activar *Confirm email* y *Leaked password protection*.

**Cuenta administradora:** el panel `/admin` se maneja con el correo oficial `xplora.sg8@gmail.com`.
1. Regístrate en la app con ese correo y tu contraseña (la contraseña no se guarda en ningún archivo del proyecto). Si ya estaba registrado como turista, sáltate este paso.
2. Confirma la cuenta desde el correo que llega a esa bandeja.
3. Supabase → SQL Editor → ejecuta `database/migrations/015_supabase_administrador_xplorasg.sql`. La cuenta anterior (`hermelindarojasrubio@gmail.com`) deja de ser administradora y queda como turista.

## 4. Verificación final
- [ ] La app abre con candado 🔒 (HTTPS) en el celular.
- [ ] Explorar muestra los 20 lugares y los prestadores.
- [ ] "Usar mi ubicación" pide permiso y funciona (sólo funciona con HTTPS).
- [ ] "Trazar ruta" dibuja la línea (o muestra el respaldo de Google Maps).
- [ ] Registro e inicio de sesión funcionan; `/admin` sólo abre con la cuenta administradora.
- [ ] La PWA se puede instalar ("Agregar a pantalla de inicio").
- [ ] `/encuesta` guarda respuestas y aparecen en el panel de administración.

## Desarrollo local
Sigue igual: `docker compose up --build` y abre `http://localhost:5173`.
Pruebas: `cd frontend && npm test && npm run test:e2e` · `cd backend && npm test`.
