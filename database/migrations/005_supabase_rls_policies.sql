-- 005_supabase_rls_policies.sql
-- Migración exclusiva para Supabase.
-- Habilita RLS, reduce privilegios y define el acceso inicial por actor.
-- Debe ejecutarse después de 001, 002, 003 y 004 en el proyecto remoto.

-- Funciones auxiliares. SECURITY DEFINER evita recursión al consultar usuarios
-- desde las políticas, con search_path fijo para impedir secuestro de objetos.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.nombre
  FROM public.usuarios AS u
  JOIN public.roles AS r ON r.id = u.rol_id
  WHERE u.id = (SELECT auth.uid())
    AND u.deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'administrador', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.owns_prestador(target_prestador_id INT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.prestadores AS p
    WHERE p.id = target_prestador_id
      AND p.usuario_id = (SELECT auth.uid())
      AND p.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_prestador(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_prestador(INT) TO authenticated;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lugares_turisticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lugar_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividad_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promocion_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestador_multimedia ENABLE ROW LEVEL SECURITY;

-- Los grants y las políticas trabajan juntos. anon solo recibe lectura pública.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.municipios,
  public.categorias,
  public.lugares_turisticos,
  public.prestadores,
  public.servicios,
  public.actividades,
  public.eventos,
  public.promociones,
  public.multimedia,
  public.lugar_multimedia,
  public.servicio_multimedia,
  public.actividad_multimedia,
  public.evento_multimedia,
  public.promocion_multimedia,
  public.prestador_multimedia
TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Un usuario solo puede editar campos de perfil no privilegiados mediante Data API.
REVOKE UPDATE ON TABLE public.usuarios FROM authenticated;
GRANT UPDATE (nombre, apellido) ON TABLE public.usuarios TO authenticated;

-- Políticas administrativas comunes. Las operaciones privilegiadas deben pasar
-- además por los grants de columna o por el backend de confianza.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'roles', 'usuarios', 'municipios', 'categorias', 'lugares_turisticos',
    'prestadores', 'servicios', 'actividades', 'eventos', 'promociones',
    'favoritos', 'multimedia', 'lugar_multimedia', 'servicio_multimedia',
    'actividad_multimedia', 'evento_multimedia', 'promocion_multimedia',
    'prestador_multimedia'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS administradores_acceso_total ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY administradores_acceso_total ON public.%I '
      'FOR ALL TO authenticated '
      'USING (public.is_admin()) '
      'WITH CHECK (public.is_admin())',
      table_name
    );
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS roles_lectura_autenticada ON public.roles;
CREATE POLICY roles_lectura_autenticada
ON public.roles FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS usuarios_perfil_propio_lectura ON public.usuarios;
CREATE POLICY usuarios_perfil_propio_lectura
ON public.usuarios FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND id = (SELECT auth.uid()));

DROP POLICY IF EXISTS usuarios_perfil_propio_actualizacion ON public.usuarios;
CREATE POLICY usuarios_perfil_propio_actualizacion
ON public.usuarios FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND id = (SELECT auth.uid()))
WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND id = (SELECT auth.uid()));

DROP POLICY IF EXISTS municipios_lectura_publica ON public.municipios;
CREATE POLICY municipios_lectura_publica
ON public.municipios FOR SELECT TO anon, authenticated
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS categorias_lectura_publica ON public.categorias;
CREATE POLICY categorias_lectura_publica
ON public.categorias FOR SELECT TO anon, authenticated
USING (TRUE);

DROP POLICY IF EXISTS lugares_lectura_publica ON public.lugares_turisticos;
CREATE POLICY lugares_lectura_publica
ON public.lugares_turisticos FOR SELECT TO anon, authenticated
USING (estado_aprobacion = 'aprobado' AND deleted_at IS NULL);

DROP POLICY IF EXISTS prestadores_lectura_publica ON public.prestadores;
CREATE POLICY prestadores_lectura_publica
ON public.prestadores FOR SELECT TO anon, authenticated
USING (estado_aprobacion = 'aprobado' AND deleted_at IS NULL);

DROP POLICY IF EXISTS prestadores_propios_lectura ON public.prestadores;
CREATE POLICY prestadores_propios_lectura
ON public.prestadores FOR SELECT TO authenticated
USING (usuario_id = (SELECT auth.uid()) AND deleted_at IS NULL);

DROP POLICY IF EXISTS prestadores_propios_insercion ON public.prestadores;
CREATE POLICY prestadores_propios_insercion
ON public.prestadores FOR INSERT TO authenticated
WITH CHECK (
  usuario_id = (SELECT auth.uid())
  AND estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS prestadores_propios_actualizacion ON public.prestadores;
CREATE POLICY prestadores_propios_actualizacion
ON public.prestadores FOR UPDATE TO authenticated
USING (usuario_id = (SELECT auth.uid()) AND deleted_at IS NULL)
WITH CHECK (
  usuario_id = (SELECT auth.uid())
  AND estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS servicios_lectura_publica ON public.servicios;
CREATE POLICY servicios_lectura_publica
ON public.servicios FOR SELECT TO anon, authenticated
USING (
  estado_aprobacion = 'aprobado'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.prestadores AS p
    WHERE p.id = servicios.prestador_id
      AND p.estado_aprobacion = 'aprobado'
      AND p.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS servicios_propios_lectura ON public.servicios;
CREATE POLICY servicios_propios_lectura
ON public.servicios FOR SELECT TO authenticated
USING (public.owns_prestador(prestador_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS servicios_propios_insercion ON public.servicios;
CREATE POLICY servicios_propios_insercion
ON public.servicios FOR INSERT TO authenticated
WITH CHECK (
  public.owns_prestador(prestador_id)
  AND estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS servicios_propios_actualizacion ON public.servicios;
CREATE POLICY servicios_propios_actualizacion
ON public.servicios FOR UPDATE TO authenticated
USING (public.owns_prestador(prestador_id) AND deleted_at IS NULL)
WITH CHECK (
  public.owns_prestador(prestador_id)
  AND estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS actividades_lectura_publica ON public.actividades;
CREATE POLICY actividades_lectura_publica
ON public.actividades FOR SELECT TO anon, authenticated
USING (estado_aprobacion = 'aprobado' AND deleted_at IS NULL);

DROP POLICY IF EXISTS eventos_lectura_publica ON public.eventos;
CREATE POLICY eventos_lectura_publica
ON public.eventos FOR SELECT TO anon, authenticated
USING (estado_aprobacion = 'aprobado' AND deleted_at IS NULL);

DROP POLICY IF EXISTS eventos_propios_lectura ON public.eventos;
CREATE POLICY eventos_propios_lectura
ON public.eventos FOR SELECT TO authenticated
USING (
  prestador_id IS NOT NULL
  AND public.owns_prestador(prestador_id)
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS eventos_propios_insercion ON public.eventos;
CREATE POLICY eventos_propios_insercion
ON public.eventos FOR INSERT TO authenticated
WITH CHECK (
  prestador_id IS NOT NULL
  AND public.owns_prestador(prestador_id)
  AND estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS eventos_propios_actualizacion ON public.eventos;
CREATE POLICY eventos_propios_actualizacion
ON public.eventos FOR UPDATE TO authenticated
USING (
  prestador_id IS NOT NULL
  AND public.owns_prestador(prestador_id)
  AND deleted_at IS NULL
)
WITH CHECK (
  prestador_id IS NOT NULL
  AND public.owns_prestador(prestador_id)
  AND estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS promociones_lectura_publica ON public.promociones;
CREATE POLICY promociones_lectura_publica
ON public.promociones FOR SELECT TO anon, authenticated
USING (estado_aprobacion = 'aprobado' AND deleted_at IS NULL);

DROP POLICY IF EXISTS promociones_propias_lectura ON public.promociones;
CREATE POLICY promociones_propias_lectura
ON public.promociones FOR SELECT TO authenticated
USING (
  (
    prestador_id IS NOT NULL
    AND public.owns_prestador(prestador_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.servicios AS s
    WHERE s.id = promociones.servicio_id
      AND public.owns_prestador(s.prestador_id)
  )
);

DROP POLICY IF EXISTS promociones_propias_insercion ON public.promociones;
CREATE POLICY promociones_propias_insercion
ON public.promociones FOR INSERT TO authenticated
WITH CHECK (
  estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
  AND (
    (
      prestador_id IS NOT NULL
      AND public.owns_prestador(prestador_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.servicios AS s
      WHERE s.id = promociones.servicio_id
        AND public.owns_prestador(s.prestador_id)
    )
  )
);

DROP POLICY IF EXISTS promociones_propias_actualizacion ON public.promociones;
CREATE POLICY promociones_propias_actualizacion
ON public.promociones FOR UPDATE TO authenticated
USING (
  (
    prestador_id IS NOT NULL
    AND public.owns_prestador(prestador_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.servicios AS s
    WHERE s.id = promociones.servicio_id
      AND public.owns_prestador(s.prestador_id)
  )
)
WITH CHECK (
  estado_aprobacion IN ('borrador', 'en_revision')
  AND deleted_at IS NULL
  AND (
    (
      prestador_id IS NOT NULL
      AND public.owns_prestador(prestador_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.servicios AS s
      WHERE s.id = promociones.servicio_id
        AND public.owns_prestador(s.prestador_id)
    )
  )
);

DROP POLICY IF EXISTS favoritos_propios ON public.favoritos;
CREATE POLICY favoritos_propios
ON public.favoritos FOR ALL TO authenticated
USING (usuario_id = (SELECT auth.uid()))
WITH CHECK (usuario_id = (SELECT auth.uid()));

-- Multimedia queda de solo lectura en 4A. Las escrituras y Storage se habilitarán
-- en 4B cuando exista propiedad explícita del recurso y política de buckets.
DROP POLICY IF EXISTS multimedia_lectura_publicada ON public.multimedia;
CREATE POLICY multimedia_lectura_publicada
ON public.multimedia FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lugar_multimedia AS lm
    JOIN public.lugares_turisticos AS l ON l.id = lm.lugar_id
    WHERE lm.multimedia_id = multimedia.id
      AND l.estado_aprobacion = 'aprobado'
      AND l.deleted_at IS NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.servicio_multimedia AS sm
    JOIN public.servicios AS s ON s.id = sm.servicio_id
    WHERE sm.multimedia_id = multimedia.id
      AND s.estado_aprobacion = 'aprobado'
      AND s.deleted_at IS NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.actividad_multimedia AS am
    JOIN public.actividades AS a ON a.id = am.actividad_id
    WHERE am.multimedia_id = multimedia.id
      AND a.estado_aprobacion = 'aprobado'
      AND a.deleted_at IS NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.evento_multimedia AS em
    JOIN public.eventos AS e ON e.id = em.evento_id
    WHERE em.multimedia_id = multimedia.id
      AND e.estado_aprobacion = 'aprobado'
      AND e.deleted_at IS NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.promocion_multimedia AS pm
    JOIN public.promociones AS p ON p.id = pm.promocion_id
    WHERE pm.multimedia_id = multimedia.id
      AND p.estado_aprobacion = 'aprobado'
      AND p.deleted_at IS NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.prestador_multimedia AS prm
    JOIN public.prestadores AS p ON p.id = prm.prestador_id
    WHERE prm.multimedia_id = multimedia.id
      AND p.estado_aprobacion = 'aprobado'
      AND p.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS lugar_multimedia_lectura_publica ON public.lugar_multimedia;
CREATE POLICY lugar_multimedia_lectura_publica
ON public.lugar_multimedia FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lugares_turisticos AS l
    WHERE l.id = lugar_multimedia.lugar_id
      AND l.estado_aprobacion = 'aprobado'
      AND l.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS servicio_multimedia_lectura_publica ON public.servicio_multimedia;
CREATE POLICY servicio_multimedia_lectura_publica
ON public.servicio_multimedia FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.servicios AS s
    WHERE s.id = servicio_multimedia.servicio_id
      AND s.estado_aprobacion = 'aprobado'
      AND s.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS actividad_multimedia_lectura_publica ON public.actividad_multimedia;
CREATE POLICY actividad_multimedia_lectura_publica
ON public.actividad_multimedia FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actividades AS a
    WHERE a.id = actividad_multimedia.actividad_id
      AND a.estado_aprobacion = 'aprobado'
      AND a.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS evento_multimedia_lectura_publica ON public.evento_multimedia;
CREATE POLICY evento_multimedia_lectura_publica
ON public.evento_multimedia FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.eventos AS e
    WHERE e.id = evento_multimedia.evento_id
      AND e.estado_aprobacion = 'aprobado'
      AND e.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS promocion_multimedia_lectura_publica ON public.promocion_multimedia;
CREATE POLICY promocion_multimedia_lectura_publica
ON public.promocion_multimedia FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.promociones AS p
    WHERE p.id = promocion_multimedia.promocion_id
      AND p.estado_aprobacion = 'aprobado'
      AND p.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS prestador_multimedia_lectura_publica ON public.prestador_multimedia;
CREATE POLICY prestador_multimedia_lectura_publica
ON public.prestador_multimedia FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.prestadores AS p
    WHERE p.id = prestador_multimedia.prestador_id
      AND p.estado_aprobacion = 'aprobado'
      AND p.deleted_at IS NULL
  )
);

