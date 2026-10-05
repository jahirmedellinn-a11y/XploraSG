# Políticas RLS de XploraSG

## Alcance de la migración 005

`005_supabase_rls_policies.sql` habilita RLS en las 18 tablas y define una primera matriz de acceso.

### Visitante anónimo

Puede consultar municipios, categorías y contenido aprobado que no esté eliminado. La multimedia sólo es visible cuando está vinculada a contenido publicado.

### Turista autenticado

Además de la lectura pública, puede:

- Consultar y editar los campos no privilegiados de su perfil.
- Crear, consultar y eliminar sus propios favoritos.

No puede modificar `rol_id`, correo, UUID ni estado de eliminación mediante Data API.

### Prestador autenticado

Puede consultar, crear y actualizar su perfil de prestador, servicios, eventos y promociones propios mientras permanezcan en estado `borrador` o `en_revision`. No puede aprobar su propio contenido.

Lugares y actividades todavía no contienen una columna de propiedad del prestador. Por seguridad, sus escrituras quedan reservadas al flujo administrativo hasta que el modelo defina esa relación.

### Administrador

Las políticas reconocen al administrador a partir del rol guardado en `public.usuarios`. Las operaciones de columnas privilegiadas, como cambiar roles, deben realizarse mediante el backend de confianza o una conexión administrativa; no se conceden al cliente únicamente por mostrar un panel administrativo.

## Multimedia y Storage

Durante 4A, las tablas de multimedia son de lectura publicada. Las escrituras y las políticas de buckets pertenecen a 4B, porque el esquema todavía no registra de forma explícita quién cargó cada recurso.

## Matriz mínima de pruebas

Ejecutar estas pruebas en el proyecto remoto antes de cerrar 4A:

| Actor | Operación | Resultado esperado |
|---|---|---|
| anon | Leer municipio o categoría | Permitido |
| anon | Leer contenido en borrador | Denegado o fila invisible |
| turista | Leer su perfil | Permitido |
| turista | Leer otro perfil | Denegado o fila invisible |
| turista | Cambiar su rol | Denegado |
| turista | Crear favorito para su UUID | Permitido |
| turista | Crear favorito para otro UUID | Denegado |
| prestador | Crear servicio propio en borrador | Permitido |
| prestador | Aprobar su servicio | Denegado |
| prestador | Editar servicio ajeno | Denegado |
| administrador | Revisar contenido | Permitido mediante el canal administrativo |

La migración no debe ejecutarse en PostgreSQL local independiente porque utiliza `auth.uid()` y los roles `anon` y `authenticated` de Supabase.
