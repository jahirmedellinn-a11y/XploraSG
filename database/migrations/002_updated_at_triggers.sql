-- 002_updated_at_triggers.sql
-- Creación de función y triggers para actualización automática de updated_at

-- 1. Función reutilizable
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Asignación de Triggers a las tablas auditadas
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_municipios_updated_at 
    BEFORE UPDATE ON municipios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lugares_turisticos_updated_at 
    BEFORE UPDATE ON lugares_turisticos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_prestadores_updated_at 
    BEFORE UPDATE ON prestadores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at 
    BEFORE UPDATE ON servicios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_actividades_updated_at 
    BEFORE UPDATE ON actividades FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at 
    BEFORE UPDATE ON eventos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_promociones_updated_at 
    BEFORE UPDATE ON promociones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
