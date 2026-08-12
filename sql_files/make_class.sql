-- make_class.sql
-- Create relational tables for campuses and classes, and backfill from academic_structure JSONB.

-- Create campuses table
CREATE TABLE IF NOT EXISTS campuses (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id text PRIMARY KEY,
  campus_id text NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Robust backfill: detect where the campuses array lives and backfill campuses and classes
DO $$
DECLARE
  var_json jsonb;
  campuses_json jsonb := NULL;
  campus jsonb;
  cls jsonb;
  campus_id text;
  campus_name text;
  cls_id text;
  cls_name text;
  col_rec record;
BEGIN
  -- If a direct column named campuses exists, use it.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'academic_structure' AND column_name = 'campuses'
  ) THEN
    BEGIN
      SELECT campuses::jsonb INTO campuses_json FROM academic_structure WHERE id = 'global' LIMIT 1;
    EXCEPTION WHEN undefined_column THEN
      campuses_json := NULL;
    END;
  ELSE
    -- Otherwise search for any json/jsonb column that contains a top-level 'campuses' key.
    FOR col_rec IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'academic_structure' AND data_type IN ('json','jsonb')
    LOOP
      BEGIN
        EXECUTE format('SELECT %I FROM academic_structure WHERE id = %L', col_rec.column_name, 'global') INTO var_json;
      EXCEPTION WHEN others THEN
        var_json := NULL;
      END;
      IF var_json IS NOT NULL THEN
        campuses_json := var_json -> 'campuses';
        IF campuses_json IS NOT NULL AND jsonb_typeof(campuses_json) = 'array' THEN
          EXIT;
        ELSE
          campuses_json := NULL;
        END IF;
      END IF;
    END LOOP;
  END IF;

  IF campuses_json IS NULL THEN
    campuses_json := '[]'::jsonb;
  END IF;

  -- Insert or update campuses and any nested classes
  FOR campus IN SELECT jsonb_array_elements(coalesce(campuses_json, '[]'::jsonb)) LOOP
    campus_id := campus->> 'id';
    campus_name := campus->> 'name';
    IF campus_name IS NULL OR trim(campus_name) = '' THEN
      CONTINUE;
    END IF;
    IF campus_id IS NULL OR trim(campus_id) = '' THEN
      campus_id := 'campus-' || regexp_replace(lower(campus_name), '\\s+', '-', 'g');
    END IF;
    INSERT INTO campuses(id, name, created_at, updated_at)
    VALUES (campus_id, campus_name, now(), now())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

    -- backfill classes nested inside this campus element, if any
    FOR cls IN SELECT jsonb_array_elements(coalesce(campus->'classes', '[]'::jsonb)) LOOP
      cls_name := cls->> 'name';
      IF cls_name IS NULL OR trim(cls_name) = '' THEN
        CONTINUE;
      END IF;
      cls_id := cls->> 'id';
      IF cls_id IS NULL OR trim(cls_id) = '' THEN
        cls_id := 'class-' || substr(md5(campus_id || '::' || cls_name), 1, 12);
      END IF;
      INSERT INTO classes(id, campus_id, name, created_at, updated_at)
      VALUES (cls_id, campus_id, cls_name, now(), now())
      ON CONFLICT (id) DO UPDATE SET campus_id = EXCLUDED.campus_id, name = EXCLUDED.name, updated_at = now();
    END LOOP;
  END LOOP;
END$$;

-- Optional: index for faster lookup
CREATE INDEX IF NOT EXISTS idx_classes_campus_id ON classes(campus_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campuses' AND column_name = 'name'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_campuses_name ON campuses(lower(name))';
  END IF;
END$$;

-- End of migration
