--
-- PostgreSQL database dump
--

\restrict gbZ2vQkVZkurhFVC6A8nYdoe4c4GGQPJe6GBPU0flpEV1k25IpG1oopFdeobG4S

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enrollment_status AS ENUM (
    'pending',
    'pendingSupervisorApproval',
    'pendingAdvisorApproval',
    'pending_approval',
    'active',
    'waitlisted',
    'completed',
    'cancelled',
    'rejected',
    'dropped',
    'failed'
);


ALTER TYPE public.enrollment_status OWNER TO postgres;

--
-- Name: expense_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expense_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.expense_status OWNER TO postgres;

--
-- Name: feedback_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.feedback_priority AS ENUM (
    'low',
    'normal',
    'high'
);


ALTER TYPE public.feedback_priority OWNER TO postgres;

--
-- Name: feedback_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.feedback_status AS ENUM (
    'new',
    'reviewed',
    'resolved'
);


ALTER TYPE public.feedback_status OWNER TO postgres;

--
-- Name: feedback_target_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.feedback_target_role AS ENUM (
    'admin',
    'supervisor'
);


ALTER TYPE public.feedback_target_role OWNER TO postgres;

--
-- Name: feedback_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.feedback_type AS ENUM (
    'course',
    'facility',
    'professor',
    'general'
);


ALTER TYPE public.feedback_type OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'card',
    'transfer',
    'internal'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: professor_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.professor_status AS ENUM (
    'active',
    'on-leave',
    'retired'
);


ALTER TYPE public.professor_status OWNER TO postgres;

--
-- Name: question_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.question_status AS ENUM (
    'open',
    'answered'
);


ALTER TYPE public.question_status OWNER TO postgres;

--
-- Name: student_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.student_status AS ENUM (
    'active',
    'inactive',
    'graduated'
);


ALTER TYPE public.student_status OWNER TO postgres;

--
-- Name: transaction_source; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_source AS ENUM (
    'payment',
    'enrollment',
    'adjustment'
);


ALTER TYPE public.transaction_source OWNER TO postgres;

--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_type AS ENUM (
    'credit',
    'debit'
);


ALTER TYPE public.transaction_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'supervisor',
    'user',
    'student',
    'professor',
    'advisor',
    'super-admin',
    'teaching-assistant',
    'registrar',
    'admissions',
    'finance',
    'it-admin',
    'dean',
    'hod',
    'librarian',
    'student-affairs',
    'hr',
    'security',
    'facilities',
    'research-office'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.user_status OWNER TO postgres;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_realtime_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_realtime_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_realtime_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_realtime_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_realtime_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_realtime_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_realtime_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_realtime_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_realtime_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) OWNER TO supabase_realtime_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_realtime_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_realtime_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_realtime_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_realtime_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


ALTER FUNCTION realtime.wal2json_escape_identifier(name text) OWNER TO supabase_realtime_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: academic_structure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_structure (
    id text NOT NULL,
    enrollment_open boolean DEFAULT true NOT NULL,
    enrollment_message text,
    departments jsonb DEFAULT '[]'::jsonb NOT NULL,
    majors jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    campuses jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.academic_structure OWNER TO postgres;

--
-- Name: academic_terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_terms (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.academic_terms OWNER TO postgres;

--
-- Name: accreditation_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accreditation_reports (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.accreditation_reports OWNER TO postgres;

--
-- Name: admissions_scholarships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admissions_scholarships (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admissions_scholarships OWNER TO postgres;

--
-- Name: advising_appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advising_appointments (
    id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    advisor_id text NOT NULL,
    advisor_name text NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30 NOT NULL,
    status text DEFAULT 'requested'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advising_appointments OWNER TO postgres;

--
-- Name: advising_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advising_messages (
    id text NOT NULL,
    student_id text NOT NULL,
    advisor_id text NOT NULL,
    sender_role text NOT NULL,
    sender_name text NOT NULL,
    body text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advising_messages OWNER TO postgres;

--
-- Name: advisor_meetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advisor_meetings (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advisor_meetings OWNER TO postgres;

--
-- Name: advisor_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advisor_notes (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advisor_notes OWNER TO postgres;

--
-- Name: advisor_risk_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advisor_risk_alerts (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advisor_risk_alerts OWNER TO postgres;

--
-- Name: advisor_student_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advisor_student_assignments (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advisor_student_assignments OWNER TO postgres;

--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_conversations (
    id text NOT NULL,
    user_id text NOT NULL,
    user_role text NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_conversations OWNER TO postgres;

--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_messages (
    id text NOT NULL,
    conversation_id text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    tool_calls jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_messages OWNER TO postgres;

--
-- Name: ai_pending_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_pending_actions (
    id text NOT NULL,
    conversation_id text NOT NULL,
    tool_name text NOT NULL,
    input jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    executed_at timestamp with time zone,
    result_summary text,
    result_entity_id text
);


ALTER TABLE public.ai_pending_actions OWNER TO postgres;

--
-- Name: api_clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_clients (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_clients OWNER TO postgres;

--
-- Name: application_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_documents (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.application_documents OWNER TO postgres;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_submissions (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assignment_submissions OWNER TO postgres;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_records (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attendance_records OWNER TO postgres;

--
-- Name: attendance_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_sessions (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attendance_sessions OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id text,
    actor_username text,
    entity_type text,
    entity_id text,
    details jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: backup_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_jobs (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.backup_jobs OWNER TO postgres;

--
-- Name: backup_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_snapshots (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.backup_snapshots OWNER TO postgres;

--
-- Name: book_copies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_copies (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_copies OWNER TO postgres;

--
-- Name: book_loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_loans (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_loans OWNER TO postgres;

--
-- Name: book_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_reservations (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_reservations OWNER TO postgres;

--
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.books OWNER TO postgres;

--
-- Name: branding_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branding_settings (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.branding_settings OWNER TO postgres;

--
-- Name: campus_event_rsvps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campus_event_rsvps (
    id text NOT NULL,
    event_id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.campus_event_rsvps OWNER TO postgres;

--
-- Name: campus_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campus_events (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'other'::text NOT NULL,
    location text NOT NULL,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone,
    capacity integer,
    rsvp_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.campus_events OWNER TO postgres;

--
-- Name: campuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campuses (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text
);


ALTER TABLE public.campuses OWNER TO postgres;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id text NOT NULL,
    campus_id text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: classroom_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classroom_schedules (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classroom_schedules OWNER TO postgres;

--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classrooms (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classrooms OWNER TO postgres;

--
-- Name: club_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.club_memberships (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.club_memberships OWNER TO postgres;

--
-- Name: clubs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clubs (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clubs OWNER TO postgres;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    code text NOT NULL,
    percent numeric(5,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coupons_percent_check CHECK (((percent > (0)::numeric) AND (percent <= (100)::numeric)))
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: course_approval_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_approval_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.course_approval_requests OWNER TO postgres;

--
-- Name: course_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_materials (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.course_materials OWNER TO postgres;

--
-- Name: course_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_reviews (
    id text NOT NULL,
    course_id text NOT NULL,
    course_title text NOT NULL,
    professor_id text,
    professor_name text,
    student_id text NOT NULL,
    rating integer NOT NULL,
    difficulty integer,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.course_reviews OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id text NOT NULL,
    display_id text NOT NULL,
    title text NOT NULL,
    code text NOT NULL,
    professor_id text NOT NULL,
    professor_name text NOT NULL,
    section_id text,
    capacity integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    price numeric(12,2) NOT NULL,
    department text,
    branch text,
    location text,
    schedule jsonb,
    eligible_programs text[],
    eligible_faculties text[],
    eligible_semesters text[],
    enrollment_open boolean DEFAULT true NOT NULL,
    enrollment_opens_at timestamp with time zone,
    enrollment_closes_at timestamp with time zone,
    enrollment_open_at timestamp with time zone,
    enrollment_close_at timestamp with time zone,
    enrollment_status_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    prerequisite_course_ids jsonb,
    credit_hours numeric,
    semester_id text,
    CONSTRAINT courses_capacity_check CHECK ((capacity >= 0)),
    CONSTRAINT courses_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: custom_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    base_role text NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    access_profile jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.custom_roles OWNER TO postgres;

--
-- Name: deleted_courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deleted_courses (
    id text NOT NULL,
    course jsonb NOT NULL,
    enrollments jsonb DEFAULT '[]'::jsonb NOT NULL,
    deleted_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_by_user_id text,
    deleted_by_name text
);


ALTER TABLE public.deleted_courses OWNER TO postgres;

--
-- Name: department_comparisons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_comparisons (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.department_comparisons OWNER TO postgres;

--
-- Name: department_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_reports (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.department_reports OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: device_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_logs (
    id text NOT NULL,
    device_name text NOT NULL,
    ip_address text,
    event_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id text,
    details text
);


ALTER TABLE public.device_logs OWNER TO postgres;

--
-- Name: discipline_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discipline_cases (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.discipline_cases OWNER TO postgres;

--
-- Name: ebooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ebooks (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ebooks OWNER TO postgres;

--
-- Name: email_sms_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_sms_configs (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_sms_configs OWNER TO postgres;

--
-- Name: employee_leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_leave_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employee_leave_requests OWNER TO postgres;

--
-- Name: enrollment_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollment_overrides (
    id text NOT NULL,
    student_id text NOT NULL,
    course_id text NOT NULL,
    reason text,
    approved_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text NOT NULL
);


ALTER TABLE public.enrollment_overrides OWNER TO postgres;

--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id text NOT NULL,
    display_id text NOT NULL,
    student_id text NOT NULL,
    course_id text NOT NULL,
    course_title text NOT NULL,
    professor_id text NOT NULL,
    professor_name text NOT NULL,
    status public.enrollment_status NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    price numeric(12,2) NOT NULL,
    base_price numeric(12,2),
    coupon_code text,
    discount_percent numeric(7,4),
    discount_amount numeric(12,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    grade text,
    grade_midterm numeric(6,2),
    grade_final numeric(6,2),
    grade_project numeric(6,2),
    grade_participation numeric(6,2),
    grade_total numeric(6,2),
    letter_grade text,
    semester text,
    tuition_charged boolean DEFAULT false NOT NULL,
    charged_at timestamp with time zone,
    payment_verified boolean DEFAULT false NOT NULL,
    approved_by_user_id text,
    approved_by_name text,
    approved_by_role public.user_role,
    approved_at timestamp with time zone,
    rejected_by_user_id text,
    rejected_by_name text,
    rejected_by_role public.user_role,
    rejected_at timestamp with time zone,
    course_schedule jsonb,
    course_code text,
    course_branch text,
    auto_assigned_base_course boolean,
    updated_by_user_id text,
    updated_by_name text,
    updated_by_role text,
    deleted_at timestamp with time zone,
    campus text,
    is_finalized boolean DEFAULT false NOT NULL,
    grade_updated_at timestamp with time zone,
    grades_finalized_at timestamp with time zone,
    grades_finalized_by text,
    payment_status text,
    latest_advisor_message text,
    latest_advisor_message_at timestamp with time zone,
    student jsonb,
    semester_id text,
    CONSTRAINT enrollments_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: TABLE enrollments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.enrollments IS 'Travel buffer policy: 10 minutes minimum gap between classes on the same campus, 20 minutes minimum gap between Main and East campus classes.';


--
-- Name: entrance_exam_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entrance_exam_results (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.entrance_exam_results OWNER TO postgres;

--
-- Name: equipment_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.equipment_requests OWNER TO postgres;

--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_registrations (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_registrations OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: exam_timetables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_timetables (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.exam_timetables OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    date timestamp with time zone NOT NULL,
    approved_by text DEFAULT 'Admin'::text NOT NULL,
    status public.expense_status DEFAULT 'pending'::public.expense_status NOT NULL,
    CONSTRAINT expenses_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: faculty_budget_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faculty_budget_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.faculty_budget_requests OWNER TO postgres;

--
-- Name: fee_invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_invoice_items (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fee_invoice_items OWNER TO postgres;

--
-- Name: fee_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_invoices (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fee_invoices OWNER TO postgres;

--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id text NOT NULL,
    student_id text,
    student_name text NOT NULL,
    professor_id text,
    professor_name text,
    type public.feedback_type NOT NULL,
    rating integer,
    comment text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    status public.feedback_status DEFAULT 'new'::public.feedback_status NOT NULL,
    subject text,
    category text,
    course_id text,
    priority public.feedback_priority,
    context text,
    source text,
    target_role public.feedback_target_role,
    attachment text,
    attachment_name text,
    CONSTRAINT feedback_rating_check CHECK (((rating IS NULL) OR ((rating >= 1) AND (rating <= 5))))
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: finance_installment_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finance_installment_plans (
    id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    title text NOT NULL,
    total_amount numeric NOT NULL,
    installment_count integer NOT NULL,
    amount_per_installment numeric NOT NULL,
    paid_amount numeric DEFAULT 0 NOT NULL,
    remaining_balance numeric NOT NULL,
    start_date text NOT NULL,
    next_due_date text NOT NULL,
    status text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.finance_installment_plans OWNER TO postgres;

--
-- Name: finance_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finance_invoices (
    id text NOT NULL,
    invoice_number text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    student_display_id text,
    title text NOT NULL,
    semester text,
    issue_date text NOT NULL,
    due_date text NOT NULL,
    status text NOT NULL,
    subtotal numeric NOT NULL,
    total numeric NOT NULL,
    paid_amount numeric DEFAULT 0 NOT NULL,
    balance_due numeric NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    notes text,
    line_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    semester_id text
);


ALTER TABLE public.finance_invoices OWNER TO postgres;

--
-- Name: finance_refund_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finance_refund_requests (
    id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    invoice_id text,
    invoice_number text,
    amount numeric NOT NULL,
    reason text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    approved_at timestamp with time zone,
    approved_by text,
    notes text
);


ALTER TABLE public.finance_refund_requests OWNER TO postgres;

--
-- Name: finance_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finance_requests (
    id text NOT NULL,
    request_number text NOT NULL,
    requester_id text NOT NULL,
    requester_name text NOT NULL,
    requester_role text NOT NULL,
    department text,
    request_type text NOT NULL,
    title text NOT NULL,
    item_name text NOT NULL,
    amount numeric NOT NULL,
    urgency text NOT NULL,
    justification text NOT NULL,
    vendor_name text,
    notes text,
    status text NOT NULL,
    handled_at timestamp with time zone,
    handled_by text,
    finance_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.finance_requests OWNER TO postgres;

--
-- Name: finance_sponsorships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finance_sponsorships (
    id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    sponsor_name text NOT NULL,
    sponsor_type text NOT NULL,
    coverage_type text NOT NULL,
    coverage_value numeric NOT NULL,
    applied_amount numeric DEFAULT 0 NOT NULL,
    status text NOT NULL,
    start_date text NOT NULL,
    end_date text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.finance_sponsorships OWNER TO postgres;

--
-- Name: financial_holds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_holds (
    id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    student_display_id text,
    reason text NOT NULL,
    balance_at_hold numeric NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    released_at timestamp with time zone,
    released_by text
);


ALTER TABLE public.financial_holds OWNER TO postgres;

--
-- Name: financial_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_ledger (
    id text NOT NULL,
    student_id text NOT NULL,
    amount numeric NOT NULL,
    entry_type text NOT NULL,
    source text NOT NULL,
    note text,
    payment_id text,
    enrollment_id text,
    invoice_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_user_id text,
    created_by_name text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.financial_ledger OWNER TO postgres;

--
-- Name: financial_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_reports (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.financial_reports OWNER TO postgres;

--
-- Name: global_announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.global_announcements (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.global_announcements OWNER TO postgres;

--
-- Name: grade_change_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_change_audit (
    id text NOT NULL,
    enrollment_id text NOT NULL,
    student_id text NOT NULL,
    course_id text NOT NULL,
    actor_user_id text,
    actor_username text,
    before_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    after_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.grade_change_audit OWNER TO postgres;

--
-- Name: gradebook_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gradebook_entries (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gradebook_entries OWNER TO postgres;

--
-- Name: graduation_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.graduation_approvals (
    id text NOT NULL,
    student_id text NOT NULL,
    program text NOT NULL,
    approved_by text,
    approved_at timestamp with time zone,
    status text NOT NULL,
    remarks text
);


ALTER TABLE public.graduation_approvals OWNER TO postgres;

--
-- Name: graduation_eligibility_checks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.graduation_eligibility_checks (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.graduation_eligibility_checks OWNER TO postgres;

--
-- Name: homework_grading_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.homework_grading_tasks (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.homework_grading_tasks OWNER TO postgres;

--
-- Name: housing_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.housing_assignments (
    id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    building_name text NOT NULL,
    room_number text NOT NULL,
    bed_number text,
    status text DEFAULT 'active'::text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.housing_assignments OWNER TO postgres;

--
-- Name: id_card_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.id_card_access (
    id text NOT NULL,
    holder_name text NOT NULL,
    holder_type text NOT NULL,
    card_number text NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    status text NOT NULL,
    notes text
);


ALTER TABLE public.id_card_access OWNER TO postgres;

--
-- Name: incident_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incident_reports (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.incident_reports OWNER TO postgres;

--
-- Name: income; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.income (
    id text NOT NULL,
    source text NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    date timestamp with time zone NOT NULL,
    student_id text,
    CONSTRAINT income_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.income OWNER TO postgres;

--
-- Name: installment_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.installment_payments (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.installment_payments OWNER TO postgres;

--
-- Name: installment_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.installment_plans (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.installment_plans OWNER TO postgres;

--
-- Name: integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integrations (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.integrations OWNER TO postgres;

--
-- Name: interview_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_schedules (
    id text NOT NULL,
    applicant_name text NOT NULL,
    program text NOT NULL,
    interviewer text,
    scheduled_at timestamp with time zone,
    status text NOT NULL,
    notes text
);


ALTER TABLE public.interview_schedules OWNER TO postgres;

--
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interviews (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.interviews OWNER TO postgres;

--
-- Name: journals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journals (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journals OWNER TO postgres;

--
-- Name: lab_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lab_materials (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lab_materials OWNER TO postgres;

--
-- Name: late_penalties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.late_penalties (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.late_penalties OWNER TO postgres;

--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: library_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.library_books (
    id text NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    isbn text,
    category text,
    total_copies integer DEFAULT 1 NOT NULL,
    available_copies integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.library_books OWNER TO postgres;

--
-- Name: library_fines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.library_fines (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.library_fines OWNER TO postgres;

--
-- Name: library_loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.library_loans (
    id text NOT NULL,
    book_id text NOT NULL,
    book_title text NOT NULL,
    borrower_name text NOT NULL,
    borrower_type text DEFAULT 'student'::text NOT NULL,
    borrowed_at timestamp with time zone DEFAULT now() NOT NULL,
    due_at timestamp with time zone NOT NULL,
    returned_at timestamp with time zone,
    status text DEFAULT 'borrowed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.library_loans OWNER TO postgres;

--
-- Name: login_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_devices (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_devices OWNER TO postgres;

--
-- Name: maintenance_mode; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_mode (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.maintenance_mode OWNER TO postgres;

--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.maintenance_requests OWNER TO postgres;

--
-- Name: maintenance_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_state (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    message text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


ALTER TABLE public.maintenance_state OWNER TO postgres;

--
-- Name: maintenance_windows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_windows (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.maintenance_windows OWNER TO postgres;

--
-- Name: meal_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meal_plans (
    id text NOT NULL,
    student_id text NOT NULL,
    student_name text NOT NULL,
    plan_name text NOT NULL,
    balance numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.meal_plans OWNER TO postgres;

--
-- Name: module_toggles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.module_toggles (
    id text NOT NULL,
    passphrase_hash text,
    disabled_modules jsonb DEFAULT '[]'::jsonb NOT NULL,
    disabled_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text,
    module_states jsonb DEFAULT '{}'::jsonb NOT NULL,
    feature_states jsonb DEFAULT '{}'::jsonb NOT NULL,
    lock_message text
);


ALTER TABLE public.module_toggles OWNER TO postgres;

--
-- Name: multilingual_strings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.multilingual_strings (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.multilingual_strings OWNER TO postgres;

--
-- Name: news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news (
    id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text NOT NULL,
    expires_at timestamp with time zone,
    image_url text
);


ALTER TABLE public.news OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false NOT NULL,
    actor text,
    image_url text
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: offer_letters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offer_letters (
    id text NOT NULL,
    applicant_name text NOT NULL,
    program text NOT NULL,
    issued_at timestamp with time zone,
    status text NOT NULL,
    expiration_date timestamp with time zone,
    notes text
);


ALTER TABLE public.offer_letters OWNER TO postgres;

--
-- Name: password_reset_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_audit (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_audit OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    display_id text NOT NULL,
    student_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    method public.payment_method NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    type public.transaction_type NOT NULL,
    source public.transaction_source NOT NULL,
    reference_id text,
    enrollment_id text,
    course_id text,
    course_title text,
    balance_after numeric(12,2),
    invoice_id text,
    finance_status text,
    confirmed_at timestamp with time zone,
    confirmed_by text,
    confirmation_note text,
    deleted_at timestamp with time zone,
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payroll_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_entries (
    id text NOT NULL,
    staff_id text NOT NULL,
    staff_name text NOT NULL,
    pay_period text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payroll_entries OWNER TO postgres;

--
-- Name: payroll_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_items (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payroll_items OWNER TO postgres;

--
-- Name: payroll_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_runs (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payroll_runs OWNER TO postgres;

--
-- Name: professor_workspaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.professor_workspaces (
    id text NOT NULL,
    professor_id text NOT NULL,
    course_id text NOT NULL,
    materials jsonb DEFAULT '[]'::jsonb NOT NULL,
    assignments jsonb DEFAULT '[]'::jsonb NOT NULL,
    quizzes jsonb DEFAULT '[]'::jsonb NOT NULL,
    attendance_sessions jsonb DEFAULT '[]'::jsonb NOT NULL,
    messages jsonb DEFAULT '[]'::jsonb NOT NULL,
    announcements jsonb DEFAULT '[]'::jsonb NOT NULL,
    office_hours jsonb DEFAULT '[]'::jsonb NOT NULL,
    mark_publications jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.professor_workspaces OWNER TO postgres;

--
-- Name: professors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.professors (
    id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    photo text DEFAULT '/placeholder-user.jpg'::text NOT NULL,
    department text DEFAULT 'General'::text NOT NULL,
    salary numeric(12,2) DEFAULT 0 NOT NULL,
    hire_date timestamp with time zone DEFAULT now() NOT NULL,
    specialization text DEFAULT ''::text NOT NULL,
    status public.professor_status DEFAULT 'active'::public.professor_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.professors OWNER TO postgres;

--
-- Name: publications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publications (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.publications OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id text NOT NULL,
    course_id text NOT NULL,
    professor_id text NOT NULL,
    student_id text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.question_status DEFAULT 'open'::public.question_status NOT NULL,
    reply text,
    replied_at timestamp with time zone
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: quiz_attempt_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_attempt_answers (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quiz_attempt_answers OWNER TO postgres;

--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_attempts (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quiz_attempts OWNER TO postgres;

--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_questions (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quiz_questions OWNER TO postgres;

--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quizzes (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quizzes OWNER TO postgres;

--
-- Name: refund_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refund_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refund_requests OWNER TO postgres;

--
-- Name: registration_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_state (
    id text NOT NULL,
    is_open boolean DEFAULT false NOT NULL,
    blocked_reason text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


ALTER TABLE public.registration_state OWNER TO postgres;

--
-- Name: research_database_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_database_access (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.research_database_access OWNER TO postgres;

--
-- Name: research_grants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_grants (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.research_grants OWNER TO postgres;

--
-- Name: research_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.research_requests OWNER TO postgres;

--
-- Name: revoked_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revoked_tokens (
    jti text NOT NULL,
    revoked_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_by text,
    reason text
);


ALTER TABLE public.revoked_tokens OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: room_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_bookings (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.room_bookings OWNER TO postgres;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id text NOT NULL,
    name text NOT NULL,
    campus text,
    capacity integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    id text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: scholarship_awards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scholarship_awards (
    id text NOT NULL,
    student_id text NOT NULL,
    scholarship_name text NOT NULL,
    amount numeric(12,2) NOT NULL,
    awarded_by text,
    awarded_at timestamp with time zone,
    status text NOT NULL,
    notes text
);


ALTER TABLE public.scholarship_awards OWNER TO postgres;

--
-- Name: security_incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_incidents (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.security_incidents OWNER TO postgres;

--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_logs (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.security_logs OWNER TO postgres;

--
-- Name: semesters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.semesters (
    id text NOT NULL,
    label text NOT NULL,
    academic_year text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'upcoming'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.semesters OWNER TO postgres;

--
-- Name: site_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_content (
    id text NOT NULL,
    hero jsonb NOT NULL,
    stats jsonb NOT NULL,
    highlights jsonb,
    about jsonb NOT NULL,
    admissions jsonb NOT NULL,
    metrics jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.site_content OWNER TO postgres;

--
-- Name: sponsorships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sponsorships (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sponsorships OWNER TO postgres;

--
-- Name: sso_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sso_config (
    id text NOT NULL,
    provider text NOT NULL,
    client_id text NOT NULL,
    issuer_url text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sso_config OWNER TO postgres;

--
-- Name: sso_providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sso_providers (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sso_providers OWNER TO postgres;

--
-- Name: staff_contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_contracts (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.staff_contracts OWNER TO postgres;

--
-- Name: staff_performance_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_performance_reviews (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.staff_performance_reviews OWNER TO postgres;

--
-- Name: staff_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_records (
    id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    department text,
    "position" text,
    employment_status text DEFAULT 'active'::text NOT NULL,
    hire_date timestamp with time zone,
    salary numeric,
    phone text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.staff_records OWNER TO postgres;

--
-- Name: student_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_documents (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_documents OWNER TO postgres;

--
-- Name: student_profiles_extra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_profiles_extra (
    student_id text NOT NULL,
    year_level text NOT NULL,
    advisor_id text,
    advisor_name text,
    professor_id text,
    professor_name text,
    scholarship_status text DEFAULT 'none'::text NOT NULL,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    registration_hold boolean DEFAULT false NOT NULL,
    tuition_balance numeric(12,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_profiles_extra OWNER TO postgres;

--
-- Name: student_record_changes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_record_changes (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_record_changes OWNER TO postgres;

--
-- Name: student_scholarships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_scholarships (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_scholarships OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id text NOT NULL,
    display_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    photo text DEFAULT '/placeholder-user.jpg'::text NOT NULL,
    enrollment_date timestamp with time zone DEFAULT now() NOT NULL,
    program text DEFAULT ''::text NOT NULL,
    program_id text,
    faculty text,
    faculty_id text,
    current_semester text,
    status public.student_status DEFAULT 'active'::public.student_status NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    date_of_birth date,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    supervisor_id text,
    supervisor_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    year_level integer,
    advisor_id text,
    advisor_name text,
    professor_id text,
    professor_name text,
    scholarship_status text,
    payment_status text,
    registration_hold boolean DEFAULT false,
    tuition_balance numeric(12,2) DEFAULT 0,
    middle_name text,
    major text,
    gender text,
    nationality text,
    national_id text,
    passport_number text,
    blood_type text,
    city text,
    postal_code text,
    emergency_contact_name text,
    emergency_contact_phone text,
    mother_name text,
    father_name text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: support_desk_replies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_desk_replies (
    id text NOT NULL,
    ticket_id text NOT NULL,
    author_id text NOT NULL,
    author_name text NOT NULL,
    author_role text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_desk_replies OWNER TO postgres;

--
-- Name: support_desk_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_desk_tickets (
    id text NOT NULL,
    ticket_number text NOT NULL,
    requester_id text NOT NULL,
    requester_name text NOT NULL,
    requester_role text NOT NULL,
    department text NOT NULL,
    category text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    last_reply_at timestamp with time zone,
    last_reply_by_role text
);


ALTER TABLE public.support_desk_tickets OWNER TO postgres;

--
-- Name: support_ticket_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_ticket_messages (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_ticket_messages OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: ta_student_support_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ta_student_support_sessions (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ta_student_support_sessions OWNER TO postgres;

--
-- Name: teaching_assistant_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teaching_assistant_assignments (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teaching_assistant_assignments OWNER TO postgres;

--
-- Name: teaching_loads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teaching_loads (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teaching_loads OWNER TO postgres;

--
-- Name: transcript_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transcript_requests (
    id text NOT NULL,
    student_id text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    delivery_method text NOT NULL,
    status text NOT NULL,
    notes text
);


ALTER TABLE public.transcript_requests OWNER TO postgres;

--
-- Name: transfer_credits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transfer_credits (
    id text NOT NULL,
    student_id text NOT NULL,
    source_institution text NOT NULL,
    course_title text NOT NULL,
    credit_hours integer NOT NULL,
    evaluated_by text,
    evaluated_at timestamp with time zone,
    status text NOT NULL
);


ALTER TABLE public.transfer_credits OWNER TO postgres;

--
-- Name: user_feature_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_feature_overrides (
    id text NOT NULL,
    user_id text NOT NULL,
    module_key text NOT NULL,
    feature_key text NOT NULL,
    state text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text
);


ALTER TABLE public.user_feature_overrides OWNER TO postgres;

--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id bigint NOT NULL,
    user_id text NOT NULL,
    permission_key text NOT NULL,
    allowed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: user_role_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_role_history (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_role_history OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    normalized_username text NOT NULL,
    email text NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login timestamp with time zone DEFAULT now() NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    avatar_url text,
    password text NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    student_id text,
    professor_id text,
    full_name text,
    phone text,
    department text,
    year_level text,
    advisor_id text,
    advisor_name text,
    professor_name text,
    custom_role_id text,
    custom_role_name text,
    access_profile jsonb DEFAULT '{}'::jsonb NOT NULL,
    secondary_roles jsonb DEFAULT '[]'::jsonb NOT NULL,
    deleted_at timestamp with time zone,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_secret text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: visitor_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visitor_logs (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visitor_logs OWNER TO postgres;

--
-- Name: welfare_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.welfare_requests (
    id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.welfare_requests OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_realtime_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: academic_structure; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_structure (id, enrollment_open, enrollment_message, departments, majors, updated_at, campuses) FROM stdin;
global	f	\N	[{"id": "dept-biz", "name": "Business Administration"}, {"id": "dept-cs", "name": "Computer Science"}, {"id": "dept-ds", "name": "Data Science"}]	[{"id": "major-ba", "name": "Digital Business", "years": 3, "subjects": ["Accounting", "Marketing", "Business Analytics"], "courseIds": ["COURSE-SEED-0005", "COURSE-SEED-0006"], "departmentId": "dept-biz", "baseCourseIds": []}, {"id": "major-ds", "name": "Applied Data Science", "years": 4, "subjects": ["Statistics", "Machine Learning", "Data Engineering"], "courseIds": ["COURSE-SEED-0003", "COURSE-SEED-0004"], "departmentId": "dept-ds", "baseCourseIds": []}, {"id": "major-se", "name": "Software Engineering", "years": 3, "subjects": ["Programming", "Databases", "Software Architecture"], "courseIds": ["COURSE-SEED-0001", "COURSE-SEED-0002", "COURSE-SE-6D8D8AFD", "COURSE-SE-BCB46B6D", "COURSE-SE-CDE6B4AF", "COURSE-SE-846A7E2F", "COURSE-SE-65BDA403", "COURSE-SE-75F9B9EA"], "departmentId": "dept-cs", "baseCourseIds": ["COURSE-SE-65BDA403", "COURSE-SE-846A7E2F", "COURSE-SE-CDE6B4AF", "COURSE-SE-BCB46B6D", "COURSE-SE-75F9B9EA"]}]	2026-08-11 08:01:35.031+00	[{"id": "campus-main", "name": "main", "classes": []}, {"id": "campus-east-campus", "name": "East Campus", "classes": []}]
\.


--
-- Data for Name: academic_terms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_terms (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: accreditation_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accreditation_reports (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admissions_scholarships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admissions_scholarships (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: advising_appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advising_appointments (id, student_id, student_name, advisor_id, advisor_name, scheduled_at, duration_minutes, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: advising_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advising_messages (id, student_id, advisor_id, sender_role, sender_name, body, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: advisor_meetings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advisor_meetings (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: advisor_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advisor_notes (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: advisor_risk_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advisor_risk_alerts (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: advisor_student_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advisor_student_assignments (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_conversations (id, user_id, user_role, title, created_at, updated_at) FROM stdin;
AIC-8B73AC01	USR-DEAN-1002	dean	Hi, who are you and what can you help me with?	2026-08-11 08:59:53.898+00	2026-08-11 08:59:55.851+00
AIC-CD479ED2	USR-DEAN-1002	dean	My favorite color is purple. Just remember that, no need to 	2026-08-11 09:04:26.943+00	2026-08-11 09:04:30.635+00
AIC-BD4A3625	USR-DEAN-1002	dean	My favorite color is purple. Just remember that, no need to 	2026-08-11 09:06:00.855+00	2026-08-11 09:06:03.316+00
AIC-37DE6B38	USR-DEAN-1002	dean	hello Kino	2026-08-11 09:08:00.721+00	2026-08-11 09:08:01.693+00
AIC-C67127C0	USR-SA-1001	super-admin	h8i	2026-08-11 09:01:04.87+00	2026-08-11 09:09:47.908+00
\.


--
-- Data for Name: ai_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_messages (id, conversation_id, role, content, tool_calls, created_at) FROM stdin;
AIM-C0B56A8C	AIC-8B73AC01	user	Hi, who are you and what can you help me with?	\N	2026-08-11 08:59:54.005+00
AIM-AD5F2937	AIC-8B73AC01	assistant	Hi! I'm **Kino**, your in-app AI assistant for the UNYT school management system.\n\nI can help you understand:\n*   **How the UNYT system works** for different roles like students, professors, deans, finance, and administration.\n*   **How to accomplish tasks** within the system, such as finding information about students or courses, managing enrollment, understanding finance features, or generating reports.\n*   **Which page or section** you need to navigate to, or **which button** to click, to get things done.\n\nPlease remember, while I can guide you on *how* to do things, I **cannot perform any actions myself** within the system (like creating, editing, or deleting data). I'm here to provide information and instructions!	\N	2026-08-11 08:59:55.824+00
AIM-8FDF68D0	AIC-C67127C0	user	h8i	\N	2026-08-11 09:01:04.982+00
AIM-FB86815A	AIC-C67127C0	assistant	I'm sorry, I don't understand. How can I help you?	\N	2026-08-11 09:01:06.043+00
AIM-391A0F05	AIC-C67127C0	user	hi	\N	2026-08-11 09:01:15.914+00
AIM-3034150B	AIC-C67127C0	assistant	Hi there! I'm Kino, your in-app AI assistant for the UNYT school management system. I can help you with creating users, students, professors, and courses, and answer questions about how the system works. What can I do for you today?	\N	2026-08-11 09:01:16.637+00
AIM-AAD14642	AIC-C67127C0	user	is this gemini api key ?	\N	2026-08-11 09:01:36.6+00
AIM-05620ED7	AIC-C67127C0	assistant	I am Kino, the in-app AI assistant for the UNYT school management system. I'm here to help you navigate the system and accomplish tasks like creating users, students, professors, and courses.\n\nHow can I assist you with UNYT today?	\N	2026-08-11 09:01:38.59+00
AIM-2AB0F033	AIC-C67127C0	user	how can i change password	\N	2026-08-11 09:02:15.381+00
AIM-10ED1127	AIC-CD479ED2	user	My favorite color is purple. Just remember that, no need to say anything else.	\N	2026-08-11 09:04:27.058+00
AIM-6CBBA586	AIC-CD479ED2	assistant	Okay. How can I help you with UNYT today?	\N	2026-08-11 09:04:28.415+00
AIM-CE61C030	AIC-CD479ED2	user	What is my favorite color? Answer in one short sentence.	\N	2026-08-11 09:04:28.577+00
AIM-D90403AA	AIC-CD479ED2	assistant	As an AI assistant, I don't store personal information like your favorite color.	\N	2026-08-11 09:04:30.607+00
AIM-0F2B9802	AIC-BD4A3625	user	My favorite color is purple. Just remember that, no need to say anything else.	\N	2026-08-11 09:06:00.964+00
AIM-0600B3B0	AIC-BD4A3625	assistant	Understood! I'll remember that your favorite color is purple.	\N	2026-08-11 09:06:01.884+00
AIM-DC81B115	AIC-BD4A3625	user	What is my favorite color? Answer in one short sentence.	\N	2026-08-11 09:06:02.484+00
AIM-EF2C7A73	AIC-BD4A3625	assistant	Your favorite color is purple.	\N	2026-08-11 09:06:03.246+00
AIM-B1EF00FE	AIC-37DE6B38	user	hello Kino	\N	2026-08-11 09:08:00.774+00
AIM-F87D7800	AIC-37DE6B38	assistant	Hello! I'm Kino, your AI assistant for the UNYT system. How can I help you today?	\N	2026-08-11 09:08:01.666+00
AIM-A7DCEDAD	AIC-C67127C0	user	how can i change password	\N	2026-08-11 09:09:10.635+00
AIM-45037CA3	AIC-C67127C0	assistant	I can't directly change your password for you through this chat. For security reasons, password changes are usually handled within your user profile settings or by an administrator.\n\nWould you like me to guide you on how to find the password change option in your dashboard, or should I direct you to someone who can help?	\N	2026-08-11 09:09:12.076+00
AIM-5AE5B273	AIC-C67127C0	user	yes	\N	2026-08-11 09:09:29.539+00
AIM-282E4B54	AIC-C67127C0	assistant	To change your password, you'll typically find a "Change Password" or "Security Settings" option within your user profile section on your dashboard.\n\nAre you looking for instructions on how to navigate to that section, or would you like me to tell you which role (e.g., admin, super-admin) can help you with a password reset if you're unable to access your account?	\N	2026-08-11 09:09:31.22+00
AIM-4175D3C8	AIC-C67127C0	user	who made this system	\N	2026-08-11 09:09:45.974+00
AIM-7805AEF8	AIC-C67127C0	assistant	This system was developed for UNYT to help manage various aspects of the school, including students, courses, enrollment, and more.	\N	2026-08-11 09:09:47.881+00
\.


--
-- Data for Name: ai_pending_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_pending_actions (id, conversation_id, tool_name, input, status, created_by, created_at, executed_at, result_summary, result_entity_id) FROM stdin;
\.


--
-- Data for Name: api_clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_clients (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: application_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_documents (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_submissions (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_records (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_sessions (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, title, description, status, notes, created_at, updated_at, actor_user_id, actor_username, entity_type, entity_id, details) FROM stdin;
AUD-091423E9			active	\N	2026-05-06 08:12:41.01+00	2026-05-06 08:12:39.479482+00	\N	\N	\N	\N	{}
AUD-607D610C			active	\N	2026-05-06 08:12:44.099+00	2026-05-06 08:12:42.509853+00	\N	\N	\N	\N	{}
AUD-9080673E			active	\N	2026-05-06 08:12:46.577+00	2026-05-06 08:12:44.986832+00	\N	\N	\N	\N	{}
AUD-95A05B6F			active	\N	2026-05-06 08:13:48.96+00	2026-05-06 08:13:47.370502+00	\N	\N	\N	\N	{}
AUD-463D24D4			active	\N	2026-05-06 08:14:42.073+00	2026-05-06 08:14:40.482605+00	\N	\N	\N	\N	{}
AUD-AA32C1BA			active	\N	2026-05-06 08:57:11.206+00	2026-05-06 08:57:09.647837+00	\N	\N	\N	\N	{}
AUD-9BA5E735			active	\N	2026-05-06 08:57:15.461+00	2026-05-06 08:57:13.868414+00	\N	\N	\N	\N	{}
AUD-07EA3157			active	\N	2026-05-06 09:27:12.01+00	2026-05-06 09:27:10.418413+00	\N	\N	\N	\N	{}
AUD-C88761DE			active	\N	2026-05-06 17:36:56.14+00	2026-05-06 17:36:58.31541+00	\N	\N	\N	\N	{}
AUD-C56DA6EA			active	\N	2026-05-06 17:36:56.412+00	2026-05-06 17:36:58.549993+00	\N	\N	\N	\N	{}
AUD-34D69D5B			active	\N	2026-05-06 17:37:13.003+00	2026-05-06 17:37:15.140447+00	\N	\N	\N	\N	{}
AUD-C9ECDC20			active	\N	2026-05-06 17:37:25.897+00	2026-05-06 17:37:28.035268+00	\N	\N	\N	\N	{}
AUD-7D60537A			active	\N	2026-05-06 17:37:42.466+00	2026-05-06 17:37:44.606772+00	\N	\N	\N	\N	{}
AUD-1F32092E			active	\N	2026-05-06 17:37:45.813+00	2026-05-06 17:37:47.953826+00	\N	\N	\N	\N	{}
AUD-8071AF0A			active	\N	2026-05-06 17:44:03.658+00	2026-05-06 17:44:05.837087+00	\N	\N	\N	\N	{}
AUD-13B36741			active	\N	2026-05-06 18:09:27.978+00	2026-05-06 18:09:30.182268+00	\N	\N	\N	\N	{}
AUD-E944C494			active	\N	2026-05-06 18:10:34.966+00	2026-05-06 18:10:37.134699+00	\N	\N	\N	\N	{}
AUD-5E04162F			active	\N	2026-05-06 18:26:20.488+00	2026-05-06 18:26:20.549673+00	\N	\N	\N	\N	{}
AUD-6E597BD2			active	\N	2026-05-06 20:24:52.506+00	2026-05-06 20:24:52.630221+00	\N	\N	\N	\N	{}
AUD-775744F0			active	\N	2026-05-06 20:43:49.382+00	2026-05-06 20:43:49.555477+00	\N	\N	\N	\N	{}
AUD-4F9C7FB0			active	\N	2026-05-07 08:43:54.294+00	2026-05-07 08:43:55.766867+00	\N	\N	\N	\N	{}
AUD-4DCD433F			active	\N	2026-05-07 08:43:54.934+00	2026-05-07 08:43:56.365897+00	\N	\N	\N	\N	{}
AUD-13229EF6			active	\N	2026-05-07 08:43:55.679+00	2026-05-07 08:43:57.109952+00	\N	\N	\N	\N	{}
AUD-FD12B27E			active	\N	2026-05-07 10:27:32.867+00	2026-05-07 10:27:32.819158+00	\N	\N	\N	\N	{}
AUD-916E8A9F			active	\N	2026-05-07 14:40:08.868+00	2026-05-07 14:40:07.397123+00	\N	\N	\N	\N	{}
AUD-EE7A4D5D			active	\N	2026-05-07 14:54:53.465+00	2026-05-07 14:54:51.956284+00	\N	\N	\N	\N	{}
AUD-E699FB7C			active	\N	2026-05-07 14:56:57.694+00	2026-05-07 14:56:56.179251+00	\N	\N	\N	\N	{}
AUD-632C0A5E			active	\N	2026-05-07 15:40:30.665+00	2026-05-07 15:40:30.742451+00	\N	\N	\N	\N	{}
\.


--
-- Data for Name: backup_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_jobs (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: backup_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_snapshots (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: book_copies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_copies (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: book_loans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_loans (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: book_reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_reservations (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: branding_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branding_settings (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: campus_event_rsvps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campus_event_rsvps (id, event_id, student_id, student_name, created_at) FROM stdin;
\.


--
-- Data for Name: campus_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campus_events (id, title, description, category, location, start_at, end_at, capacity, rsvp_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: campuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campuses (id, title, description, status, notes, created_at, updated_at, name) FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, campus_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: classroom_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classroom_schedules (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classrooms (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: club_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.club_memberships (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clubs (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (code, percent, created_at) FROM stdin;
welcome10	10.00	2026-04-15 17:41:38.178103+00
spring25	25.00	2026-04-15 17:41:38.178103+00
\.


--
-- Data for Name: course_approval_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_approval_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_materials (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: course_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_reviews (id, course_id, course_title, professor_id, professor_name, student_id, rating, difficulty, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, display_id, title, code, professor_id, professor_name, section_id, capacity, start_date, end_date, price, department, branch, location, schedule, eligible_programs, eligible_faculties, eligible_semesters, enrollment_open, enrollment_opens_at, enrollment_closes_at, enrollment_open_at, enrollment_close_at, enrollment_status_note, created_at, updated_at, prerequisite_course_ids, credit_hours, semester_id) FROM stdin;
COURSE-SE-639E0A8F	EDF202-A	Elective in Department/Faculty Level II	EDF 202	PROF-6DAB86DF	anasprof test	A	40	2026-04-30 17:26:19.704+00	2026-08-25 17:26:19.704+00	720.00	Computer Science	Faculty of Engineering and Architecture	SE Room 105	[{"day": "thursday", "branch": "Faculty of Engineering and Architecture", "endTime": "11:15", "location": "SE Lab 201", "startTime": "09:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 5"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 4	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-A8435B72	SE301-A	Software Engineering	SE 301	PROF-6DAB86DF	anasprof test	A	40	2026-04-30 17:26:19.704+00	2026-08-25 17:26:19.704+00	1440.00	Computer Science	Faculty of Engineering and Architecture	SE Room 105	[{"day": "saturday", "branch": "Faculty of Engineering and Architecture", "endTime": "14:45", "location": "SE Lab 201", "startTime": "13:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 5"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 8	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SEED-0003	DS210-A	Machine Learning Foundations	DS210	PROF-6DAB86DF	anasprof test	A	30	2026-04-29 17:25:57.052+00	2026-08-25 17:25:57.052+00	1400.00	Data Science	North Campus	Room DS-301	[{"day": "wednesday", "branch": "North Campus", "endTime": "18:15", "location": "Room DS-301", "startTime": "16:45", "department": "Computer Science"}]	{"data science"}	{engineering,business}	{"semester 4"}	f	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SEED-0004	DS240-C	Data Warehousing and BI	DS240	PROF-6DAB86DF	anasprof test	C	28	2026-04-30 17:25:57.052+00	2026-08-22 17:25:57.052+00	1350.00	Data Science	North Campus	Room DS-220	[{"day": "wednesday", "branch": "North Campus", "endTime": "19:45", "location": "Room DS-220", "startTime": "18:15", "department": "Computer Science"}]	{"data science"}	{engineering,business}	{"semester 4"}	f	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SEED-0006	BA230-B	Business Analytics in Practice	BA230	PROF-6DAB86DF	anasprof test	B	40	2026-05-01 17:25:57.052+00	2026-08-26 17:25:57.052+00	1150.00	Business Administration	Main Campus	Room BA-203	[{"day": "monday", "branch": "Main Campus", "endTime": "09:30", "location": "Room BA-203", "startTime": "08:00", "department": "Computer Science"}]	{"business administration"}	{engineering,business}	{"semester 3"}	f	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-00000001	SE101	Software Engineering Fundamentals	SE101	PROF-6DAB86DF	anasprof test	A	30	2026-04-18 00:00:00+00	2026-08-13 00:00:00+00	1200.00	Computer Science	main	Room A101	[{"day": "saturday", "branch": "main", "endTime": "16:30", "location": "Room A101", "startTime": "15:00", "department": "Computer Science"}]	{"software engineering","software engineering"}	{engineering}	{"year 2"}	f	2026-04-13 17:41:38.178+00	2026-05-05 17:41:38.178+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	\N	2026-04-15 17:41:38.178+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-05A90F88	CS 201	Object Oriented Programming with Java	CS 201	PROF-6DAB86DF	anasprof test	A	40	2026-04-28 00:00:00+00	2026-08-23 00:00:00+00	1080.00	Computer Science	East Campus	SE Hall 3	[{"day": "tuesday", "branch": "East Campus", "endTime": "11:15", "location": "SE Hall 3", "startTime": "09:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 3"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-49550E43	ENG 102	Composition II	ENG 102	PROF-6DAB86DF	anasprof test	A	40	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1080.00	Computer Science	East Campus	SE Room 105	[{"day": "thursday", "branch": "Faculty of Engineering and Architecture", "endTime": "16:30", "location": "SE Lab 201", "startTime": "15:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"year 2"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-65BDA403	CS 101	Computer Ethics	CS 101	PROF-6DAB86DF	anasprof test	A	40	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1440.00	Computer Science	main	SE Lab 201	[{"day": "monday", "branch": "Faculty of Engineering and Architecture", "endTime": "16:30", "location": "SE Lab 201", "startTime": "15:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 1"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	\N	\N	ECTS: 8	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SEED-0001	SE201	Advanced Software Engineering	SE201	PROF-6DAB86DF	anasprof test	A	40	2026-04-27 00:00:00+00	2026-08-20 00:00:00+00	1300.00	Computer Science	main	Lab CS-201	[{"day": "saturday", "branch": "Main Campus", "endTime": "18:15", "location": "Lab CS-201", "startTime": "16:45", "department": "Computer Science"}]	{"computer science","software engineering"}	{engineering,business}	{"semester 3"}	t	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	\N	\N	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-846A7E2F	CS 102	Computer Applications	CS 102	PROF-6DAB86DF	anasprof test	A	40	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	Computer Science	East Campus	SE Lab 201	[{"day": "monday", "branch": "Faculty of Engineering and Architecture", "endTime": "18:15", "location": "SE Lab 201", "startTime": "16:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 1"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	\N	\N	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-A941B05B	FL 102	Foreign Language II	FL 102	PROF-6DAB86DF	anasprof test	A	40	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	720.00	dept-cs	East Campus	SE Room 105	[{"day": "friday", "branch": "Faculty of Engineering and Architecture", "endTime": "09:30", "location": "SE Lab 201", "startTime": "08:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"year 1","year 2","year 3"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 4	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-BD34D4E9	MATH 102	Calculus II	MATH 102	PROF-6DAB86DF	anasprof test	A	40	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1080.00	Computer Science	East Campus	SE Room 105	[{"day": "friday", "branch": "Faculty of Engineering and Architecture", "endTime": "16:30", "location": "SE Lab 201", "startTime": "15:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"year 1","year 2","year 3"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-C8B041FD	FL 101	Foreign Language I	FL 101	PROF-6DAB86DF	anasprof test	A	40	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	720.00	Computer Science	East Campus	SE Lab 201	[{"day": "thursday", "branch": "Faculty of Engineering and Architecture", "endTime": "19:45", "location": "SE Lab 201", "startTime": "18:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 1"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 4	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SEED-0002	SE220	Cloud Application Development	SE220	PROF-6DAB86DF	anasprof test	B	35	2026-04-28 00:00:00+00	2026-08-18 00:00:00+00	1250.00	Computer Science	East Campus	Room CS-105	[{"day": "saturday", "branch": "East Campus", "endTime": "19:45", "location": "Room CS-105", "startTime": "18:15", "department": "Computer Science"}]	{"computer science","software engineering"}	{engineering,business}	{"semester 3"}	t	2026-04-20 17:25:57.052+00	2026-05-12 17:25:57.052+00	\N	\N	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-8A733FED	B1-E4DE	b1	B1-E4DE	PROF-6DAB86DF	anasprof test	\N	20	2026-04-30 15:48:22.339+00	2026-08-28 15:48:22.339+00	0.00	\N	mian	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	2026-04-30 15:48:24.368+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-08E70B02	CS 203	Database Systems	CS 203	PROF-6DAB86DF	anasprof test	A	40	2026-04-28 00:00:00+00	2026-08-23 00:00:00+00	1080.00	Computer Science	main	SE Hall 3	[{"day": "tuesday", "branch": "main", "endTime": "14:45", "location": "SE Hall 3", "startTime": "13:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 3"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-2C016455	SE210-A	Artificial Intelligence	SE 210	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "saturday", "branch": "Faculty of Engineering and Architecture", "endTime": "11:15", "location": "SE Lab 201", "startTime": "09:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-2DE2FD6D	SE211-A	Intro to Machine Learning	SE 211	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "saturday", "branch": "Faculty of Engineering and Architecture", "endTime": "13:00", "location": "SE Lab 201", "startTime": "11:30", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-21C3BF22	SE202-A	Mobile Application Development	SE 202	PROF-6DAB86DF	anasprof test	A	40	2026-04-29 17:26:19.704+00	2026-08-24 17:26:19.704+00	1440.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "saturday", "branch": "Faculty of Engineering and Architecture", "endTime": "09:30", "location": "SE Lab 201", "startTime": "08:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 4"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 8	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-31CF18A2	CS 103	Introduction to Computer Science	CS 103	PROF-6DAB86DF	anasprof test	A	40	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1080.00	Computer Science	main	SE Room 105	[{"day": "monday", "branch": "Faculty of Engineering and Architecture", "endTime": "19:45", "location": "SE Lab 201", "startTime": "18:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 2"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-36D19A21	CS303-A	Data Communications and Networking	CS 303	PROF-6DAB86DF	anasprof test	A	40	2026-04-30 17:26:19.704+00	2026-08-25 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Room 105	[{"day": "tuesday", "branch": "Faculty of Engineering and Architecture", "endTime": "19:45", "location": "SE Lab 201", "startTime": "18:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 5"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-38EF2F7A	CS320-A	Virtualization and Cloud Computing	CS 320	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	720.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "wednesday", "branch": "Faculty of Engineering and Architecture", "endTime": "16:30", "location": "SE Lab 201", "startTime": "15:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 4 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-3DFCBAC6	CS304-A	Operating Systems	CS 304	PROF-6DAB86DF	anasprof test	A	40	2026-04-30 17:26:19.704+00	2026-08-25 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Room 105	[{"day": "wednesday", "branch": "Faculty of Engineering and Architecture", "endTime": "09:30", "location": "SE Lab 201", "startTime": "08:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 5"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-42B090DB	CS 202	Computer Organization and System Architecture	CS 202	PROF-6DAB86DF	anasprof test	A	40	2026-04-28 00:00:00+00	2026-08-23 00:00:00+00	1080.00	Computer Science	East Campus	SE Hall 3	[{"day": "tuesday", "branch": "East Campus", "endTime": "13:00", "location": "SE Hall 3", "startTime": "11:30", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 3"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-05-01 14:43:00+00	2026-05-08 14:43:00+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-50803D5F	BI301-A	Business Information Systems	BI 301	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "monday", "branch": "Faculty of Engineering and Architecture", "endTime": "13:00", "location": "SE Lab 201", "startTime": "11:30", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-5C9A41A5	EDF201-A	Elective in Department/Faculty Level I	EDF 201	PROF-6DAB86DF	anasprof test	A	40	2026-04-29 17:26:19.704+00	2026-08-24 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "thursday", "branch": "Faculty of Engineering and Architecture", "endTime": "09:30", "location": "SE Lab 201", "startTime": "08:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 4"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-6D8D8AFD	SE 201	Programming in C# Net	SE 201	PROF-CBFDD391	ali imhamed	A	40	2026-04-28 00:00:00+00	2026-08-23 00:00:00+00	1080.00	Computer Science	main	SE Hall 3	[{"day": "friday", "branch": "main", "endTime": "19:45", "location": "SE Hall 3", "startTime": "18:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 3"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	\N	\N	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-70F962E3	CS302-A	Web Systems Development	CS 302	PROF-6DAB86DF	anasprof test	A	40	2026-04-30 17:26:19.704+00	2026-08-25 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Room 105	[{"day": "tuesday", "branch": "Faculty of Engineering and Architecture", "endTime": "18:15", "location": "SE Lab 201", "startTime": "16:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 5"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-75F9B9EA	CS 104	Introduction to Programming	CS 104	PROF-6DAB86DF	anasprof test	A	40	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1440.00	Computer Science	East Campus	SE Room 105	[{"day": "tuesday", "branch": "Faculty of Engineering and Architecture", "endTime": "09:30", "location": "SE Lab 201", "startTime": "08:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 2"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	\N	\N	ECTS: 8	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-81E56E62	EUL201-A	Elective in University Level	EUL 201	PROF-6DAB86DF	anasprof test	A	40	2026-05-01 17:26:19.704+00	2026-08-26 17:26:19.704+00	720.00	Computer Science	Faculty of Engineering and Architecture	SE Hall 3	[{"day": "thursday", "branch": "Faculty of Engineering and Architecture", "endTime": "18:15", "location": "SE Lab 201", "startTime": "16:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 6"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 4	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-93FFED7E	CS310-A	System Administration	CS 310	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	720.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "wednesday", "branch": "Faculty of Engineering and Architecture", "endTime": "14:45", "location": "SE Lab 201", "startTime": "13:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 4 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-97A55A0C	BI201-A	Management Information Systems	BI 201	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "monday", "branch": "Faculty of Engineering and Architecture", "endTime": "11:15", "location": "SE Lab 201", "startTime": "09:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-BCB46B6D	MATH 101	Calculus I	MATH 101	PROF-6625D078	test test1	A	40	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	300.00	Computer Science	main	SE Lab 201	[{"day": "friday", "branch": "Faculty of Engineering and Architecture", "endTime": "14:45", "location": "SE Lab 201", "startTime": "13:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 1"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	\N	\N	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-C70D66C2	BI302-A	Project Management in Information Technology	BI 302	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	720.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "monday", "branch": "Faculty of Engineering and Architecture", "endTime": "14:45", "location": "SE Lab 201", "startTime": "13:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 4 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-CA6A9C24	CS305-A	Advanced Java	CS 305	PROF-6DAB86DF	anasprof test	A	40	2026-05-01 17:26:19.704+00	2026-08-26 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Hall 3	[{"day": "wednesday", "branch": "Faculty of Engineering and Architecture", "endTime": "11:15", "location": "SE Lab 201", "startTime": "09:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 6"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-CABEBCBD	CS208-A	Data Structures	CS 208	PROF-6DAB86DF	anasprof test	A	40	2026-04-29 17:26:19.704+00	2026-08-24 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "tuesday", "branch": "Faculty of Engineering and Architecture", "endTime": "16:30", "location": "SE Lab 201", "startTime": "15:00", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 4"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-CB55408E	CS309-A	Network Administration and Management	CS 309	PROF-6DAB86DF	anasprof test	A	50	2026-05-02 17:26:19.704+00	2026-08-27 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "wednesday", "branch": "Faculty of Engineering and Architecture", "endTime": "13:00", "location": "SE Lab 201", "startTime": "11:30", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{elective}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6 | Elective course	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-CDE6B4AF	ENG 101	Composition I	ENG 101	PROF-6DAB86DF	anasprof test	A	40	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	Computer Science	East Campus	SE Lab 209	[{"day": "thursday", "branch": "Faculty of Engineering and Architecture", "endTime": "14:45", "location": "SE Lab 201", "startTime": "13:15", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 1"}	t	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	\N	\N	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-DD8E458C	RMAS333-A	Research Methods in Applied Sciences	RMAS 333	PROF-6DAB86DF	anasprof test	A	40	2026-05-01 17:26:19.704+00	2026-08-26 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Hall 3	[{"day": "friday", "branch": "Faculty of Engineering and Architecture", "endTime": "18:15", "location": "SE Lab 201", "startTime": "16:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 6"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-E85E3B57	EDF203-A	Elective in Department/Faculty Level III	EDF 203	PROF-6DAB86DF	anasprof test	A	40	2026-05-01 17:26:19.704+00	2026-08-26 17:26:19.704+00	1080.00	Computer Science	Faculty of Engineering and Architecture	SE Hall 3	[{"day": "thursday", "branch": "Faculty of Engineering and Architecture", "endTime": "13:00", "location": "SE Lab 201", "startTime": "11:30", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 6"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 6	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-F2175321	GP399-A	Graduation Project	GP 399	PROF-6DAB86DF	anasprof test	A	40	2026-05-01 17:26:19.704+00	2026-08-26 17:26:19.704+00	1440.00	Computer Science	Faculty of Engineering and Architecture	SE Hall 3	[{"day": "friday", "branch": "Faculty of Engineering and Architecture", "endTime": "11:15", "location": "SE Lab 201", "startTime": "09:45", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 6"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 8	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
COURSE-SE-F5EA7553	INT299-A	Internship	INT 299	PROF-6DAB86DF	anasprof test	A	40	2026-04-29 17:26:19.704+00	2026-08-24 17:26:19.704+00	720.00	Computer Science	Faculty of Engineering and Architecture	SE Lab 201	[{"day": "friday", "branch": "Faculty of Engineering and Architecture", "endTime": "13:00", "location": "SE Lab 201", "startTime": "11:30", "department": "Computer Science"}]	{"software engineering"}	{"faculty of engineering and architecture"}	{"semester 4"}	f	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	2026-04-19 17:26:19.704+00	2026-05-22 17:26:19.704+00	ECTS: 4	2026-04-22 17:26:19.704+00	2026-08-11 08:54:36.12748+00	\N	\N	SEM-SPRING-2026
\.


--
-- Data for Name: custom_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_roles (id, name, description, base_role, permissions, access_profile, created_at, updated_at) FROM stdin;
CR-ED40AC1A	it guy	test custom role with user	it-admin	{"reports:view": true, "enrollment:view": true, "enrollment:manage": true}	{}	2026-04-30 16:29:08.892+00	2026-04-30 16:29:08.892+00
\.


--
-- Data for Name: deleted_courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deleted_courses (id, course, enrollments, deleted_at, deleted_by_user_id, deleted_by_name) FROM stdin;
\.


--
-- Data for Name: department_comparisons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_comparisons (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: department_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_reports (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: device_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.device_logs (id, device_name, ip_address, event_type, created_at, user_id, details) FROM stdin;
DVC-2001	Finance Desk Terminal	10.0.0.40	payment-review	2026-04-19 19:11:51.345258+00	USR-FIN-1001	Reviewed partial payment record
DVC-2002	Registrar Desktop	10.0.0.41	registration-check	2026-04-19 19:11:51.345258+00	USR-REG-1001	Checked open registration state
DVC-2003	Advisor Laptop	10.0.0.42	advisor-assignment	2026-04-19 19:11:51.345258+00	USR-ADV-1001	Assigned student advisor mapping
\.


--
-- Data for Name: discipline_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discipline_cases (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ebooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ebooks (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: email_sms_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_sms_configs (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_leave_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: enrollment_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollment_overrides (id, student_id, course_id, reason, approved_by, created_at, status) FROM stdin;
OVR-2001	USR-STU-1002	CS 104	Balance pending but registration open for probation case	USR-REG-1001	2026-04-19 19:11:51.345258+00	pending
OVR-2002	USR-STU-1005	CS 203	Advisor approved after payment partial clearance	USR-REG-1002	2026-04-19 19:11:51.345258+00	approved
OVR-2003	USR-STU-1009	GP 399	Graduation project enrollment blocked by unpaid balance	USR-REG-1003	2026-04-19 19:11:51.345258+00	rejected
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, display_id, student_id, course_id, course_title, professor_id, professor_name, status, start_date, end_date, price, base_price, coupon_code, discount_percent, discount_amount, created_at, updated_at, grade, grade_midterm, grade_final, grade_project, grade_participation, grade_total, letter_grade, semester, tuition_charged, charged_at, payment_verified, approved_by_user_id, approved_by_name, approved_by_role, approved_at, rejected_by_user_id, rejected_by_name, rejected_by_role, rejected_at, course_schedule, course_code, course_branch, auto_assigned_base_course, updated_by_user_id, updated_by_name, updated_by_role, deleted_at, campus, is_finalized, grade_updated_at, grades_finalized_at, grades_finalized_by, payment_status, latest_advisor_message, latest_advisor_message_at, student, semester_id) FROM stdin;
ENR-61A07A4F	CS 104	STU-854E151E	COURSE-SE-75F9B9EA	Introduction to Programming	PROF-6DAB86DF	anasprof test	cancelled	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1440.00	1440.00	\N	\N	\N	2026-05-07 10:27:32.562+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "tuesday", "branch": "Faculty of Engineering and Architecture", "endTime": "09:30", "location": "SE Lab 201", "startTime": "08:00", "department": "Computer Science"}]	CS 104	East Campus	\N	USR1777587960760	memo	student	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-SEED-0010	BA230-010	STU-AC24FC01	COURSE-SEED-0006	Business Analytics in Practice	PROF-6DAB86DF	anasprof test	active	2026-05-01 17:25:57.052+00	2026-08-26 17:25:57.052+00	1150.00	1150.00	\N	\N	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "monday", "branch": "Main Campus", "endTime": "12:30", "location": "Room BA-203", "startTime": "11:00", "department": "Business Administration"}, {"day": "thursday", "branch": "Main Campus", "endTime": "12:30", "location": "Room BA-203", "startTime": "11:00", "department": "Business Administration"}]	BA230	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-SEED-0017	DS210-017	USR-STU-1007	COURSE-SEED-0003	Machine Learning Foundations	PROF-6DAB86DF	anasprof test	active	2026-04-29 17:25:57.052+00	2026-08-25 17:25:57.052+00	1400.00	1400.00	\N	\N	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "monday", "branch": "North Campus", "endTime": "14:30", "location": "Room DS-301", "startTime": "13:00", "department": "Data Science"}, {"day": "friday", "branch": "North Campus", "endTime": "14:30", "location": "Room DS-301", "startTime": "13:00", "department": "Data Science"}]	DS210	\N	\N	\N	\N	\N	\N	Main Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-463F4DAA	CS 101	STU-C067BF1D	COURSE-SE-65BDA403	Computer Ethics	PROF-6DAB86DF	anasprof test	pendingAdvisorApproval	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1440.00	1440.00	\N	0.0000	0.00	2026-05-07 14:27:28.352+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-8E497E42	CS 102	STU-C067BF1D	COURSE-SE-846A7E2F	Computer Applications	PROF-6DAB86DF	anasprof test	pendingAdvisorApproval	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	1080.00	\N	0.0000	0.00	2026-05-07 14:27:28.464+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-B27A002E	SE 201	STU-8806EBCB	COURSE-SE-6D8D8AFD	Programming in C# Net	PROF-CBFDD391	ali imhamed	active	2026-04-28 00:00:00+00	2026-08-23 00:00:00+00	1080.00	1080.00	\N	\N	\N	2026-05-06 18:09:27.725+00	2026-08-11 08:54:36.12748+00	\N	30.00	40.00	20.00	10.00	100.00	A	2026-04	f	\N	t	USR1777586069421	anasprof	professor	2026-05-06 18:10:34.776+00	\N	\N	\N	\N	[{"day": "friday", "branch": "Faculty of Engineering and Architecture", "endTime": "14:30", "location": "SE Hall 3", "startTime": "13:00", "department": "Computer Science"}]	SE 201	main	\N	USR-SA-1001	admin23	super-admin	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-C41C5187	CS 104	STU-C067BF1D	COURSE-SE-75F9B9EA	Introduction to Programming	PROF-6DAB86DF	anasprof test	pendingAdvisorApproval	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1440.00	1440.00	\N	0.0000	0.00	2026-05-07 14:27:28.555+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-EA1D5869	MATH 101	STU-C067BF1D	COURSE-SE-BCB46B6D	Calculus I	PROF-6625D078	test test1	pendingAdvisorApproval	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	300.00	300.00	\N	0.0000	0.00	2026-05-07 14:27:28.651+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-10A08E60	SE 201	STU-854E151E	COURSE-SE-6D8D8AFD	Programming in C# Net	PROF-CBFDD391	ali imhamed	active	2026-04-28 00:00:00+00	2026-08-23 00:00:00+00	1080.00	1080.00	\N	\N	\N	2026-05-01 14:53:23.559+00	2026-08-11 08:54:36.12748+00	\N	20.00	24.00	3.00	1.00	48.00	F	2026-04	t	2026-05-01 14:53:49.533+00	t	USR1777586069421	anasprof	professor	2026-05-01 14:53:49.533+00	\N	\N	\N	\N	\N	SE 201	\N	\N	USR-SA-1001	admin23	super-admin	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-2686A758	MATH 101	STU-2A8EE849	COURSE-SE-BCB46B6D	Calculus I	PROF-6625D078	test test1	active	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	1080.00	\N	0.0000	0.00	2026-05-01 10:23:19.868+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	t	2026-05-01 10:23:19.868+00	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	MATH 101	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-9A06836C	ENG 101	STU-2A8EE849	COURSE-SE-CDE6B4AF	Composition I	PROF-6DAB86DF	anasprof test	active	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	1080.00	\N	0.0000	0.00	2026-05-01 10:23:19.738+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	t	2026-05-01 10:23:19.738+00	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	ENG 101	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-BE715023	SE220	STU-854E151E	COURSE-SEED-0002	Cloud Application Development	PROF-6DAB86DF	anasprof test	active	2026-04-28 00:00:00+00	2026-08-18 00:00:00+00	1250.00	1250.00	\N	\N	\N	2026-05-01 14:53:23.235+00	2026-08-11 08:54:36.12748+00	\N	22.00	33.00	20.00	10.00	85.00	A-	2026-04	f	\N	t	USR-SA-1001	admin23	super-admin	2026-05-06 08:57:11.01+00	\N	\N	\N	\N	\N	\N	\N	\N	USR-SA-1001	admin23	super-admin	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-DB59A062	B1-E4DE	STU-854E151E	COURSE-8A733FED	b1	PROF-6DAB86DF	anasprof test	cancelled	2026-04-30 15:48:22.339+00	2026-08-28 15:48:22.339+00	0.00	0.00	\N	\N	\N	2026-05-01 13:02:16.662+00	2026-08-11 08:54:36.12748+00	\N	30.00	30.00	20.00	10.00	90.00	A	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USR-SA-1001	admin23	super-admin	\N	Main Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-40378946	SE220	STU-AC24FC01	COURSE-SEED-0002	Cloud Application Development	PROF-6DAB86DF	anasprof test	pending	2026-04-28 00:00:00+00	2026-08-18 00:00:00+00	1250.00	1250.00	\N	\N	\N	2026-04-30 21:50:25.149+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-7026D0BC	CS 101	STU-2A8EE849	COURSE-SE-65BDA403	Computer Ethics	PROF-6DAB86DF	anasprof test	active	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1440.00	1440.00	\N	0.0000	0.00	2026-05-01 10:23:19.607+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	t	2026-05-01 10:23:19.607+00	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-73AA921B	CS 102	STU-2A8EE849	COURSE-SE-846A7E2F	Computer Applications	PROF-6DAB86DF	anasprof test	active	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	1080.00	\N	0.0000	0.00	2026-05-01 10:23:19.674+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	t	2026-05-01 10:23:19.674+00	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-863CF190	SE220	STU-8806EBCB	COURSE-SEED-0002	Cloud Application Development	PROF-6DAB86DF	anasprof test	pending_approval	2026-04-28 00:00:00+00	2026-08-18 00:00:00+00	1250.00	1250.00	\N	\N	\N	2026-05-06 20:43:49.203+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "saturday", "branch": "East Campus", "endTime": "19:45", "location": "Room CS-105", "startTime": "18:15", "department": "Computer Science"}]	SE220	East Campus	\N	USR1778088969769	test2y	student	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-BEBECEB4	CS 104	STU-854E151E	COURSE-SE-75F9B9EA	Introduction to Programming	PROF-6DAB86DF	anasprof test	pendingAdvisorApproval	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1440.00	1440.00	\N	\N	\N	2026-05-07 14:54:53.081+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "tuesday", "branch": "Faculty of Engineering and Architecture", "endTime": "09:30", "location": "SE Lab 201", "startTime": "08:00", "department": "Computer Science"}]	CS 104	East Campus	\N	USR1777587960760	memo	student	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-EC922BD9	SE201	STU-854E151E	COURSE-SEED-0001	Advanced Software Engineering	PROF-6DAB86DF	anasprof test	active	2026-04-27 00:00:00+00	2026-08-20 00:00:00+00	1300.00	1300.00	\N	\N	\N	2026-05-01 14:53:22.804+00	2026-08-11 08:54:36.12748+00	\N	30.00	40.00	20.00	10.00	100.00	A	2026-04	f	\N	t	USR-SA-1001	admin23	super-admin	2026-05-06 08:57:15.278+00	\N	\N	\N	\N	\N	\N	\N	\N	USR1777586069421	anasprof	professor	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-F6FBC303	ENG 101	STU-C067BF1D	COURSE-SE-CDE6B4AF	Composition I	PROF-6DAB86DF	anasprof test	pendingAdvisorApproval	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	1080.00	\N	0.0000	0.00	2026-05-07 14:27:28.742+00	2026-08-11 08:54:36.12748+00	\N	22.00	30.00	20.00	10.00	82.00	B	2026-04	f	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	USR1777586069421	anasprof	professor	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-MATCH-00011	SE201-M-011	USR-STU-1007	COURSE-SEED-0001	Advanced Software Engineering	PROF-6DAB86DF	anasprof test	active	2026-04-27 00:00:00+00	2026-08-20 00:00:00+00	1300.00	1300.00	\N	\N	\N	2026-04-22 17:26:13.67+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "monday", "branch": "Main Campus", "endTime": "10:30", "location": "Lab CS-201", "startTime": "09:00", "department": "Computer Science"}, {"day": "wednesday", "branch": "Main Campus", "endTime": "10:30", "location": "Lab CS-201", "startTime": "09:00", "department": "Computer Science"}]	SE201	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-4A92C09A	MATH 101	STU-AC24FC01	COURSE-SE-BCB46B6D	Calculus I	PROF-6625D078	test test1	active	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	1080.00	\N	\N	\N	2026-04-24 12:02:53.085+00	2026-08-11 08:54:36.12748+00	\N	50.00	50.00	50.00	50.00	100.00	A	2026-04	t	2026-04-24 12:02:53.085+00	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	MATH 101	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-99D15A50	CS 104	STU-2A8EE849	COURSE-SE-75F9B9EA	Introduction to Programming	PROF-6DAB86DF	anasprof test	active	2026-04-27 00:00:00+00	2026-08-22 00:00:00+00	1440.00	1440.00	\N	0.0000	0.00	2026-05-01 10:23:19.803+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	t	2026-05-01 10:23:19.803+00	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-MATCH-00012	SE220-M-012	USR-STU-1007	COURSE-SEED-0002	Cloud Application Development	PROF-6DAB86DF	anasprof test	active	2026-04-28 00:00:00+00	2026-08-18 00:00:00+00	1250.00	1250.00	\N	\N	\N	2026-04-22 17:26:13.67+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "tuesday", "branch": "Main Campus", "endTime": "12:30", "location": "Room CS-105", "startTime": "11:00", "department": "Computer Science"}, {"day": "thursday", "branch": "Main Campus", "endTime": "12:30", "location": "Room CS-105", "startTime": "11:00", "department": "Computer Science"}]	SE220	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-MATCH-00014	BA230-M-014	USR-STU-1008	COURSE-SEED-0006	Business Analytics in Practice	PROF-6DAB86DF	anasprof test	active	2026-05-01 17:25:57.052+00	2026-08-26 17:25:57.052+00	1150.00	1150.00	\N	\N	\N	2026-04-22 17:26:13.67+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "monday", "branch": "Main Campus", "endTime": "12:30", "location": "Room BA-203", "startTime": "11:00", "department": "Business Administration"}, {"day": "thursday", "branch": "Main Campus", "endTime": "12:30", "location": "Room BA-203", "startTime": "11:00", "department": "Business Administration"}]	BA230	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-SEED-0009	BA205-009	STU-AC24FC01	COURSE-SE-846A7E2F	Computer Applications	PROF-6DAB86DF	anasprof test	active	2026-04-26 00:00:00+00	2026-08-21 00:00:00+00	1080.00	1080.00	\N	\N	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	t	2026-04-24 14:19:37.816+00	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "tuesday", "branch": "Main Campus", "endTime": "10:30", "location": "Room BA-110", "startTime": "09:00", "department": "Business Administration"}, {"day": "friday", "branch": "Main Campus", "endTime": "10:30", "location": "Room BA-110", "startTime": "09:00", "department": "Business Administration"}]	CS 102	\N	\N	\N	\N	\N	\N	East Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-SEED-0018	DS240-018	USR-STU-1007	COURSE-SEED-0004	Data Warehousing and BI	PROF-6DAB86DF	anasprof test	active	2026-04-30 17:25:57.052+00	2026-08-22 17:25:57.052+00	1350.00	1350.00	\N	\N	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "wednesday", "branch": "North Campus", "endTime": "16:30", "location": "Room DS-220", "startTime": "15:00", "department": "Data Science"}, {"day": "thursday", "branch": "North Campus", "endTime": "16:30", "location": "Room DS-220", "startTime": "15:00", "department": "Data Science"}]	DS240	\N	\N	\N	\N	\N	\N	Main Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
ENR-SEED-0019	DS240-019	USR-STU-1008	COURSE-SEED-0004	Data Warehousing and BI	PROF-6DAB86DF	anasprof test	active	2026-04-30 17:25:57.052+00	2026-08-22 17:25:57.052+00	1350.00	1350.00	\N	\N	\N	2026-04-22 17:25:57.052+00	2026-08-11 08:54:36.12748+00	\N	\N	\N	\N	\N	\N	\N	2026-04	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	[{"day": "wednesday", "branch": "North Campus", "endTime": "16:30", "location": "Room DS-220", "startTime": "15:00", "department": "Data Science"}, {"day": "thursday", "branch": "North Campus", "endTime": "16:30", "location": "Room DS-220", "startTime": "15:00", "department": "Data Science"}]	DS240	\N	\N	\N	\N	\N	\N	Main Campus	f	\N	\N	\N	\N	\N	\N	\N	SEM-SPRING-2026
\.


--
-- Data for Name: entrance_exam_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entrance_exam_results (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: equipment_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_registrations (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: exam_timetables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_timetables (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, category, description, amount, date, approved_by, status) FROM stdin;
EXP-00000001	operations	Lab equipment maintenance	150.00	2026-04-15 17:41:38.178103+00	admin_anas	approved
\.


--
-- Data for Name: faculty_budget_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faculty_budget_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fee_invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_invoice_items (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fee_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_invoices (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback (id, student_id, student_name, professor_id, professor_name, type, rating, comment, date, status, subject, category, course_id, priority, context, source, target_role, attachment, attachment_name) FROM stdin;
FB-00000001	STU-00000001	Linda Hoxha	\N	Roland Kola	course	5	Great start and clear roadmap for the semester.	2026-04-15 17:41:38.178103+00	new	Course quality	enrollment	COURSE-00000001	normal	student-portal	student-portal	admin	\N	\N
\.


--
-- Data for Name: finance_installment_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finance_installment_plans (id, student_id, student_name, title, total_amount, installment_count, amount_per_installment, paid_amount, remaining_balance, start_date, next_due_date, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: finance_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finance_invoices (id, invoice_number, student_id, student_name, student_display_id, title, semester, issue_date, due_date, status, subtotal, total, paid_amount, balance_due, currency, notes, line_items, created_by, created_at, updated_at, semester_id) FROM stdin;
FININV-734EEF15	INV-A2360479	STU-AC24FC01	taha imhamed	STU-AC24FC01	Tuition Invoice	Fall 2026	2026-04-26	2026-04-26	open	150	150	0	150	USD	\N	[{"id": "INVLINE-41738A9C", "type": "tuition", "label": "Tuition invoice", "total": 150, "quantity": 1, "unitAmount": 150, "description": "test invoice"}]	finance.elira	2026-04-26 10:56:53.478+00	2026-04-26 10:56:53.478+00	\N
FININV-A783EA04	INV-07E170DC	STU-AC24FC01	taha imhamed	STU-AC24FC01	Payment receipt - 2026-04-30	\N	2026-04-30	2026-04-30	open	2310	2310	0	2310	USD	Payment method: cash.	[{"id": "INVLINE-81ABBC72", "type": "tuition", "label": "Payment received", "total": 2310, "quantity": 1, "unitAmount": 2310, "description": "Recorded payment receipt"}]	admin23	2026-04-30 17:39:13.39+00	2026-04-30 17:39:13.39+00	\N
FININV-8257A916	INV-CBC5B292	USR-STU-1007	Mira Kola	USR-STU-1007	Payment receipt - 2026-04-30	\N	2026-04-30	2026-04-30	open	550	550	0	550	USD	Payment method: card.	[{"id": "INVLINE-3997D2EC", "type": "tuition", "label": "Payment received", "total": 550, "quantity": 1, "unitAmount": 550, "description": "Recorded payment receipt"}]	admin23	2026-04-30 20:41:28.917+00	2026-04-30 20:41:28.917+00	\N
FININV-20E5FCDD	INV-9FB29056	USR-STU-1007	Mira Kola	USR-STU-1007	Payment receipt - 2026-04-30	\N	2026-04-30	2026-04-30	open	550	550	0	550	USD	Payment method: card.	[{"id": "INVLINE-FB105770", "type": "tuition", "label": "Payment received", "total": 550, "quantity": 1, "unitAmount": 550, "description": "Recorded payment receipt"}]	admin23	2026-04-30 20:41:29.534+00	2026-04-30 20:41:29.534+00	\N
FININV-0C899CB2	INV-700B33E9	STU-854E151E	mohamed ali	STU-854E151E	Payment receipt - 2026-05-06	\N	2026-05-06	2026-05-06	open	101080	101080	0	101080	USD	Payment method: card.	[{"id": "INVLINE-9309C74B", "type": "tuition", "label": "Payment received", "total": 101080, "quantity": 1, "unitAmount": 101080, "description": "Recorded payment receipt"}]	admin23	2026-05-06 08:14:20.294+00	2026-05-06 08:14:20.294+00	\N
FININV-421DFAA4	INV-6E81E65A	STU-AC24FC01	taha imhamed	STU-AC24FC01	Payment receipt - 2026-05-06	\N	2026-05-06	2026-05-06	open	2310	2310	0	2310	USD	Payment method: transfer.	[{"id": "INVLINE-80EE0A96", "type": "tuition", "label": "Payment received", "total": 2310, "quantity": 1, "unitAmount": 2310, "description": "Recorded payment receipt"}]	admin23	2026-05-06 08:56:24.718+00	2026-05-06 08:56:24.718+00	\N
\.


--
-- Data for Name: finance_refund_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finance_refund_requests (id, student_id, student_name, invoice_id, invoice_number, amount, reason, requested_at, status, approved_at, approved_by, notes) FROM stdin;
\.


--
-- Data for Name: finance_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finance_requests (id, request_number, requester_id, requester_name, requester_role, department, request_type, title, item_name, amount, urgency, justification, vendor_name, notes, status, handled_at, handled_by, finance_notes, created_at, updated_at) FROM stdin;
FREQ-AECBB425	REQ-503E152A	USR-PRO-1001	dr.hassan	professor	cs	purchase	hdmi	2	2	low	test	taha	\N	rejected	2026-05-06 08:38:39.518+00	admin23	Marked rejected from finance dashboard	2026-04-26 11:33:18.124+00	2026-05-06 08:38:39.518+00
\.


--
-- Data for Name: finance_sponsorships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finance_sponsorships (id, student_id, student_name, sponsor_name, sponsor_type, coverage_type, coverage_value, applied_amount, status, start_date, end_date, notes, created_at, updated_at) FROM stdin;
SPON-F158E127	USR-STU-1007	Mira Kola	free test	government	fixed	100	100	active	2026-04-30	\N	\N	2026-04-30 17:30:24.655+00	2026-04-30 17:30:24.655+00
\.


--
-- Data for Name: financial_holds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_holds (id, student_id, student_name, student_display_id, reason, balance_at_hold, status, created_at, released_at, released_by) FROM stdin;
\.


--
-- Data for Name: financial_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_ledger (id, student_id, amount, entry_type, source, note, payment_id, enrollment_id, invoice_id, created_at, created_by_user_id, created_by_name, metadata) FROM stdin;
LED-59116500	STU-854E151E	100000	debit	invoice	Invoice INV-907E997A: Tuition Invoice	TXN-39D45AB2	\N	FININV-6E0C4396	2026-05-06 08:13:34.754+00	\N	\N	{"referenceId": "FININV-6E0C4396", "balanceAfter": 101080}
LED-81EFE47F	STU-854E151E	101080	credit	payment	Student payment recorded	TXN-9B2E1AEE	\N	\N	2026-05-06 08:14:20.084+00	USR-SA-1001	admin23	{"method": "card", "balanceAfter": 0, "financeStatus": "confirmed"}
LED-48F320CC	STU-854E151E	101080	debit	invoice	Invoice INV-700B33E9: Payment receipt - 2026-05-06	TXN-A7EFB20E	\N	FININV-0C899CB2	2026-05-06 08:14:21.427+00	\N	\N	{"referenceId": "FININV-0C899CB2", "balanceAfter": 101080}
LED-2311A493	STU-854E151E	101080	credit	payment	Student payment recorded	TXN-9B03C762	\N	FININV-0C899CB2	2026-05-06 08:15:07.526+00	USR-SA-1001	admin23	{"method": "transfer", "balanceAfter": 0, "financeStatus": "confirmed"}
LED-91F4B83D	STU-854E151E	101080	debit	invoice	Invoice INV-09A4C499: Payment receipt - 2026-05-06	TXN-E0A9C4E4	\N	FININV-15DEB998	2026-05-06 08:15:09.172+00	\N	\N	{"referenceId": "FININV-15DEB998", "balanceAfter": 101080}
LED-29532DC2	STU-AC24FC01	2310	credit	payment	Student payment recorded	TXN-7BCD4A28	\N	FININV-A783EA04	2026-05-06 08:56:24.56+00	USR-SA-1001	admin23	{"method": "transfer", "balanceAfter": 0, "financeStatus": "confirmed"}
LED-87B58F73	STU-AC24FC01	2310	debit	invoice	Invoice INV-6E81E65A: Payment receipt - 2026-05-06	TXN-83AF9DBB	\N	FININV-421DFAA4	2026-05-06 08:56:26.101+00	\N	\N	{"referenceId": "FININV-421DFAA4", "balanceAfter": 2310}
LED-4E615521	STU-8806EBCB	1000	credit	payment	Student payment recorded	TXN-CA817728	\N	\N	2026-05-07 10:25:55.335+00	USR-SA-1001	admin23	{"method": "transfer", "balanceAfter": 0, "financeStatus": "confirmed"}
\.


--
-- Data for Name: financial_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_reports (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: global_announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.global_announcements (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: grade_change_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade_change_audit (id, enrollment_id, student_id, course_id, actor_user_id, actor_username, before_state, after_state, created_at) FROM stdin;
GRA-08F66BD1	ENR-EC922BD9	STU-854E151E	COURSE-SEED-0001	USR1777586069421	anasprof	{"grade": null, "gradeFinal": null, "gradeTotal": null, "isFinalized": false, "letterGrade": null, "gradeMidterm": null, "gradeProject": null, "gradeParticipation": null}	{"grade": null, "gradeFinal": 40, "gradeTotal": 100, "isFinalized": false, "letterGrade": "A", "gradeMidterm": 30, "gradeProject": 20, "gradeParticipation": 10}	2026-05-06 09:27:11.97+00
GRA-47DB16D2	ENR-B27A002E	STU-8806EBCB	COURSE-SE-6D8D8AFD	USR-SA-1001	admin23	{"grade": null, "gradeFinal": null, "gradeTotal": null, "isFinalized": false, "letterGrade": null, "gradeMidterm": null, "gradeProject": null, "gradeParticipation": null}	{"grade": null, "gradeFinal": 40, "gradeTotal": 100, "isFinalized": false, "letterGrade": "A", "gradeMidterm": 30, "gradeProject": 20, "gradeParticipation": 10}	2026-05-06 18:26:20.446+00
GRA-BAA40CCD	ENR-DB59A062	STU-854E151E	COURSE-8A733FED	USR-SA-1001	admin23	{"grade": null, "gradeFinal": null, "gradeTotal": null, "isFinalized": false, "letterGrade": null, "gradeMidterm": null, "gradeProject": null, "gradeParticipation": null}	{"grade": null, "gradeFinal": 30, "gradeTotal": 90, "isFinalized": false, "letterGrade": "A", "gradeMidterm": 30, "gradeProject": 20, "gradeParticipation": 10}	2026-05-07 08:43:54.249+00
GRA-2C140AD5	ENR-BE715023	STU-854E151E	COURSE-SEED-0002	USR-SA-1001	admin23	{"grade": null, "gradeFinal": null, "gradeTotal": null, "isFinalized": false, "letterGrade": null, "gradeMidterm": null, "gradeProject": null, "gradeParticipation": null}	{"grade": null, "gradeFinal": 33, "gradeTotal": 85, "isFinalized": false, "letterGrade": "A-", "gradeMidterm": 22, "gradeProject": 20, "gradeParticipation": 10}	2026-05-07 08:43:54.898+00
GRA-788858E9	ENR-10A08E60	STU-854E151E	COURSE-SE-6D8D8AFD	USR-SA-1001	admin23	{"grade": null, "gradeFinal": null, "gradeTotal": null, "isFinalized": false, "letterGrade": null, "gradeMidterm": null, "gradeProject": null, "gradeParticipation": null}	{"grade": null, "gradeFinal": 24, "gradeTotal": 48, "isFinalized": false, "letterGrade": "F", "gradeMidterm": 20, "gradeProject": 3, "gradeParticipation": 1}	2026-05-07 08:43:55.643+00
GRA-2E90E3EA	ENR-F6FBC303	STU-C067BF1D	COURSE-SE-CDE6B4AF	USR1777586069421	anasprof	{"grade": null, "gradeFinal": null, "gradeTotal": null, "isFinalized": false, "letterGrade": null, "gradeMidterm": null, "gradeProject": null, "gradeParticipation": null}	{"grade": null, "gradeFinal": 30, "gradeTotal": 82, "isFinalized": false, "letterGrade": "B", "gradeMidterm": 22, "gradeProject": 20, "gradeParticipation": 10}	2026-05-07 15:40:30.608+00
\.


--
-- Data for Name: gradebook_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gradebook_entries (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: graduation_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.graduation_approvals (id, student_id, program, approved_by, approved_at, status, remarks) FROM stdin;
GRA-2001	USR-STU-1007	Computer Science	USR-REG-1001	2026-04-19 19:11:51.345258+00	approved	Eligible for graduation planning
GRA-2002	USR-STU-1008	Business Administration	USR-REG-1002	2026-04-19 19:11:51.345258+00	pending	Awaiting finance confirmation
GRA-2003	USR-STU-1009	Data Science	USR-REG-1003	2026-04-19 19:11:51.345258+00	blocked	Cannot proceed until payment is complete
\.


--
-- Data for Name: graduation_eligibility_checks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.graduation_eligibility_checks (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: homework_grading_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.homework_grading_tasks (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: housing_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.housing_assignments (id, student_id, student_name, building_name, room_number, bed_number, status, start_date, end_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: id_card_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.id_card_access (id, holder_name, holder_type, card_number, issued_at, expires_at, status, notes) FROM stdin;
IDC-2001	Ahmed Rashidi	student	CARD-1001	2026-04-19 19:11:51.345258+00	2027-04-19 19:11:51.345258+00	active	First-year student access card
IDC-2002	Sara Dervishi	student	CARD-1002	2026-04-19 19:11:51.345258+00	2027-04-19 19:11:51.345258+00	active	Second-year student access card
IDC-2003	Luka Hoxha	student	CARD-1003	2026-04-19 19:11:51.345258+00	2027-04-19 19:11:51.345258+00	suspended	Blocked until registration clearance
\.


--
-- Data for Name: incident_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incident_reports (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: income; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.income (id, source, description, amount, date, student_id) FROM stdin;
INC-00000001	tuition	Tuition installment	300.00	2026-04-15 17:41:38.178103+00	\N
\.


--
-- Data for Name: installment_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.installment_payments (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: installment_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.installment_plans (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.integrations (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: interview_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interview_schedules (id, applicant_name, program, interviewer, scheduled_at, status, notes) FROM stdin;
INTV-2001	Student One	Software Engineering	admissions.era	2026-04-21 19:11:51.345258+00	scheduled	First-year applicant simulation
INTV-2002	Student Two	Computer Science	admissions.lorik	2026-04-22 19:11:51.345258+00	scheduled	Second-year simulation
INTV-2003	Student Three	Data Science	admissions.jona	2026-04-23 19:11:51.345258+00	scheduled	Third-year pathway simulation
\.


--
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interviews (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: journals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.journals (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lab_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_materials (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: late_penalties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.late_penalties (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: library_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.library_books (id, title, author, isbn, category, total_copies, available_copies, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: library_fines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.library_fines (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: library_loans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.library_loans (id, book_id, book_title, borrower_name, borrower_type, borrowed_at, due_at, returned_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: login_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_devices (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: maintenance_mode; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_mode (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: maintenance_state; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_state (id, enabled, message, updated_at, updated_by) FROM stdin;
global	f	\N	2026-04-30 17:07:40.025234+00	manual-unset
\.


--
-- Data for Name: maintenance_windows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_windows (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: meal_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meal_plans (id, student_id, student_name, plan_name, balance, status, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: module_toggles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.module_toggles (id, passphrase_hash, disabled_modules, disabled_features, updated_at, updated_by, module_states, feature_states, lock_message) FROM stdin;
global	$2b$10$boCTY0qrgNmiOoTaw72SlO.WZb3QZ.q9XOQG.rGMRmEi9c//VpJTi	[]	[]	2026-08-11 07:52:36.456+00	admin23	{"hr": "open", "advising": "open", "students": "open", "dashboard": "open", "professor": "open", "hr-records": "open"}	{}	\N
\.


--
-- Data for Name: multilingual_strings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.multilingual_strings (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news (id, title, body, created_at, created_by, expires_at, image_url) FROM stdin;
NEWS-00000001	Welcome To The New Portal	This is a seeded news item so you can test announcements and notifications.	2026-04-15 17:41:38.178103+00	admin_anas	2026-05-15 17:41:38.178103+00	\N
NEWS-376E6EC5	New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	admin23	2026-07-11 00:00:00+00	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, body, created_at, read, actor, image_url) FROM stdin;
NOTIF-00000001	USR-STU-0001	Welcome	Your student account is ready.	2026-04-15 17:41:38.178103+00	f	system	\N
NOTIF-00000002	USR-PROF-0001	Welcome	Your professor account is ready.	2026-04-15 17:41:38.178103+00	f	system	\N
ENROLL-NOTIF-993C8F5D	STU-00000001	Enrollment successful: Applied Data Modeling	You have been enrolled in Applied Data Modeling.	2026-04-17 08:27:07.171+00	f	Linda Hoxha	\N
ENROLL-NOTIF-A6D99A89	STU-00000002	Enrollment successful: Software Engineering Fundamentals	You have been enrolled in Software Engineering Fundamentals.	2026-04-19 19:19:59.908+00	f	Ardit Balla	\N
ENROLL-NOTIF-B55DD4C6	STU-AC24FC01	Enrollment successful: Calculus I	You have been enrolled in Calculus I.	2026-04-24 12:02:53.085+00	f	taha imhamed	\N
NEWS-NOTIF-CC932E21	USR-ADV-0001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-AEABEAB5	USR-USER-0001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-DAC9D1A5	USR-SUP-0001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-A2F24697	USR-PROF-0001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-79679906	USR1776631176452	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-272FD973	USR-ADMIN-0001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-7B23E873	USR-REG-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-EB2E0BB3	USR-TA-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-185353FD	USR-ADV-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-ACEEB506	USR-PRO-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-6E3386D2	USR-PRO-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-F64450A8	USR-PRO-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-C691728D	USR-TA-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-EF69501E	USR-TA-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-52B1B52C	USR-ADV-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-5FA0F69E	USR-ADV-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-B8287714	USR-REG-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-59817097	USR-REG-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-675A46A8	USR-ADM-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-FCFF80F1	USR-ADM-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-2E47BDBF	USR-FIN-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-F8C798F6	USR-FIN-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-E88C4CE7	USR-FIN-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-4EF39842	USR-IT-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-57A7ABC1	USR-IT-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-B4B70CF7	USR-DEAN-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-6EF63A13	USR-DEAN-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-361046B8	USR-HOD-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-89B318C2	USR-HOD-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-930994D3	USR-HOD-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-DD1C6A3B	USR-LIB-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-096ACA56	USR-SAFF-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-0934563C	USR-SAFF-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-1339A48E	USR-HR-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-93BC4272	USR-HR-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-DD6F7E10	USR-HR-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-6774CE63	USR-IT-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-EB07DD1E	USR-SEC-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-647F0DB1	USR-SA-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-5F017793	USR-ADM-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-939F52F4	USR-SAFF-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-83693F44	USR-SA-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-005421D2	USR-DEAN-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-CEE47223	USR-FAC-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-1906F3F5	USR-FAC-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-6024B5C2	USR-RES-1002	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-36CA3DE2	USR-RES-1003	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-47E4B124	USR-FAC-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-A0EAB25B	USR-RES-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
NEWS-NOTIF-5E12FAFD	USR-SA-1001	New announcement: New arch for the demo	this is the new system update we are still working on it any problem file a ticket to the admin	2026-04-25 16:17:34.115+00	f	admin23	\N
ENROLL-NOTIF-5722B1E2	STU-AC24FC01	Enrollment successful: Cloud Application Development	You have been enrolled in Cloud Application Development.	2026-04-30 21:50:25.149+00	f	taha imhamed	\N
ENROLL-NOTIF-E8D2B567	USR1777587960760	Enrollment request submitted: b1	Your request is pending advisor approval.	2026-05-01 11:12:37.776+00	f	mohamed ali	\N
ENROLL-NOTIF-A0E578B1	USR1777587960760	Enrollment request submitted: b1	Your request is pending advisor approval.	2026-05-01 13:02:16.729+00	f	mohamed ali	\N
ENROLL-NOTIF-D9BF163E	USR1777587960760	Enrollment request submitted: Advanced Software Engineering	Your request is pending advisor approval.	2026-05-01 14:53:22.939+00	f	mohamed ali	\N
ENROLL-NOTIF-356992C3	USR1777587960760	Enrollment request submitted: Cloud Application Development	Your request is pending advisor approval.	2026-05-01 14:53:23.299+00	f	mohamed ali	\N
ENROLL-NOTIF-9F97B0C7	USR1777587960760	Enrollment request submitted: Programming in C# Net	Your request is pending advisor approval.	2026-05-01 14:53:23.623+00	f	mohamed ali	\N
ENROLL-NOTIF-CD98505C	USR1777587960760	Enrollment approved: Programming in C# Net	Your enrollment has been approved and completed.	2026-05-01 14:53:49.832+00	f	anasprof	\N
ENROLL-NOTIF-D643CEF3	USR1777587960760	Enrollment approved: Cloud Application Development	Your enrollment has been approved and completed.	2026-05-06 08:57:11.166+00	f	admin23	\N
ENROLL-NOTIF-A818B2F5	USR1777587960760	Enrollment approved: Advanced Software Engineering	Your enrollment has been approved and completed.	2026-05-06 08:57:15.427+00	f	admin23	\N
ENROLL-NOTIF-A2EC374F	USR1778088969769	Enrollment request submitted: Programming in C# Net	Your request is pending advisor approval.	2026-05-06 18:09:27.909+00	f	test2y imhamed	\N
ENROLL-NOTIF-D3FE38E2	USR1778088969769	Enrollment approved: Programming in C# Net	Your enrollment has been approved and completed.	2026-05-06 18:10:34.935+00	f	anasprof	\N
ENROLL-NOTIF-A13CD819	USR1778088969769	Enrollment request submitted: Cloud Application Development	Your enrollment cannot be approved until payment is completed.	2026-05-06 20:43:49.354+00	f	test2y imhamed	\N
ENROLL-NOTIF-5D963DA8	USR1777587960760	Enrollment request submitted: Introduction to Programming	Your request is pending advisor approval.	2026-05-07 10:27:32.818+00	f	mohamed ali	\N
ENROLL-NOTIF-AC05D9EB	USR1777587960760	Enrollment request submitted: Introduction to Programming	Your request is pending advisor approval.	2026-05-07 14:54:53.415+00	f	mohamed ali	\N
TKT-NOTIF-8DCB0AE8	USR-SUP-0001	New ticket: give us what we need ya	admin23 opened a other ticket for Admin Office.	2026-08-11 08:25:09.062+00	f	admin23	\N
\.


--
-- Data for Name: offer_letters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offer_letters (id, applicant_name, program, issued_at, status, expiration_date, notes) FROM stdin;
OFR-2001	Student One	Software Engineering	2026-04-19 19:11:51.345258+00	issued	2026-05-03 19:11:51.345258+00	Offer generated for simulation
OFR-2002	Student Two	Computer Science	2026-04-19 19:11:51.345258+00	draft	\N	Offer pending review
OFR-2003	Student Three	Data Science	2026-04-19 19:11:51.345258+00	issued	2026-04-29 19:11:51.345258+00	Offer tied to scholarship case
\.


--
-- Data for Name: password_reset_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_audit (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, display_id, student_id, amount, method, note, created_at, type, source, reference_id, enrollment_id, course_id, course_title, balance_after, invoice_id, finance_status, confirmed_at, confirmed_by, confirmation_note, deleted_at) FROM stdin;
TXN-60070D19	TXN-60070D19	STU-AC24FC01	1080.00	internal	Enrollment charge for Calculus I	2026-04-24 12:02:53.199+00	debit	enrollment	ENR-4A92C09A	ENR-4A92C09A	COURSE-SE-BCB46B6D	Calculus I	1080.00	\N	\N	\N	\N	\N	\N
TXN-D0A870B4	TXN-D0A870B4	STU-AC24FC01	150.00	internal	Invoice INV-A2360479: Tuition Invoice	2026-04-26 10:56:53.915+00	debit	adjustment	FININV-734EEF15	\N	\N	\N	2310.00	FININV-734EEF15	confirmed	2026-04-26 10:56:53.915+00	system	Invoice charge posted	\N
TXN-25C192E8	TXN-6F750DEE	USR-STU-1008	50.00	card	Test payment	2026-04-19 20:57:57.902+00	credit	payment	\N	\N	\N	\N	550.00	\N	confirmed	2026-04-30 17:29:59.014+00	admin23	Confirmed from finance dashboard	\N
TXN-D3B5CAFC	TXN-6D7D9FDB	STU-AC24FC01	2310.00	cash	\N	2026-04-30 17:39:13.195+00	credit	payment	\N	\N	\N	\N	0.00	\N	confirmed	2026-04-30 17:39:13.195+00	admin23	Recorded by finance dashboard	\N
TXN-3F2535DC	TXN-3F2535DC	STU-AC24FC01	2310.00	internal	Invoice INV-07E170DC: Payment receipt - 2026-04-30	2026-04-30 17:39:13.924+00	debit	adjustment	FININV-A783EA04	\N	\N	\N	2310.00	FININV-A783EA04	confirmed	2026-04-30 17:39:13.924+00	system	Invoice charge posted	\N
TXN-02A16020	TXN-EB76D1FD	USR-STU-1007	550.00	card	\N	2026-04-30 20:41:28.683+00	credit	payment	\N	\N	\N	\N	0.00	\N	confirmed	2026-04-30 20:41:28.683+00	admin23	Recorded by finance dashboard	\N
TXN-B31A00BC	TXN-66B538E5	USR-STU-1007	550.00	card	\N	2026-04-30 20:41:29.3+00	credit	payment	\N	\N	\N	\N	0.00	\N	confirmed	2026-04-30 20:41:29.3+00	admin23	Recorded by finance dashboard	\N
TXN-98523AB8	TXN-98523AB8	USR-STU-1007	550.00	internal	Invoice INV-CBC5B292: Payment receipt - 2026-04-30	2026-04-30 20:41:29.642+00	debit	adjustment	FININV-8257A916	\N	\N	\N	550.00	FININV-8257A916	confirmed	2026-04-30 20:41:29.642+00	system	Invoice charge posted	\N
TXN-1C4CE542	TXN-1C4CE542	USR-STU-1007	550.00	internal	Invoice INV-9FB29056: Payment receipt - 2026-04-30	2026-04-30 20:41:30.258+00	debit	adjustment	FININV-20E5FCDD	\N	\N	\N	550.00	FININV-20E5FCDD	confirmed	2026-04-30 20:41:30.258+00	system	Invoice charge posted	\N
TXN-7CAA752B	TXN-7CAA752B	STU-854E151E	1080.00	internal	Enrollment charge for Programming in C# Net	2026-05-01 14:53:49.67+00	debit	enrollment	ENR-10A08E60	ENR-10A08E60	COURSE-SE-6D8D8AFD	Programming in C# Net	1080.00	\N	\N	\N	\N	\N	\N
TXN-0B4B2F82	TXN-0B4B2F82	STU-AC24FC01	1080.00	internal	Enrollment charge for Computer Applications	2026-04-24 14:19:37.816+00	debit	enrollment	ENR-SEED-0009	ENR-SEED-0009	\N	Digital Marketing Strategy	2160.00	\N	\N	\N	\N	\N	\N
TXN-39D45AB2	TXN-39D45AB2	STU-854E151E	100000.00	internal	Invoice INV-907E997A: Tuition Invoice	2026-05-06 08:13:34.615+00	debit	adjustment	FININV-6E0C4396	\N	\N	\N	101080.00	FININV-6E0C4396	confirmed	2026-05-06 08:13:34.615+00	system	Invoice charge posted	\N
TXN-9B2E1AEE	TXN-B6B8BE93	STU-854E151E	101080.00	card	\N	2026-05-06 08:14:19.979+00	credit	payment	\N	\N	\N	\N	0.00	\N	confirmed	2026-05-06 08:14:19.979+00	admin23	Recorded by finance dashboard	\N
TXN-A7EFB20E	TXN-A7EFB20E	STU-854E151E	101080.00	internal	Invoice INV-700B33E9: Payment receipt - 2026-05-06	2026-05-06 08:14:21.296+00	debit	adjustment	FININV-0C899CB2	\N	\N	\N	101080.00	FININV-0C899CB2	confirmed	2026-05-06 08:14:21.296+00	system	Invoice charge posted	\N
TXN-9B03C762	TXN-6DC69857	STU-854E151E	101080.00	transfer	\N	2026-05-06 08:15:07.412+00	credit	payment	\N	\N	\N	\N	0.00	FININV-0C899CB2	confirmed	2026-05-06 08:15:07.412+00	admin23	Recorded by finance dashboard	\N
TXN-E0A9C4E4	TXN-E0A9C4E4	STU-854E151E	101080.00	internal	Invoice INV-09A4C499: Payment receipt - 2026-05-06	2026-05-06 08:15:09.032+00	debit	adjustment	FININV-15DEB998	\N	\N	\N	101080.00	FININV-15DEB998	confirmed	2026-05-06 08:15:09.032+00	system	Invoice charge posted	\N
TXN-86AA6691	TXN-C0D08815	USR-STU-1007	50.00	card	Test payment	2026-04-19 20:57:52.196+00	credit	payment	\N	\N	\N	\N	550.00	\N	confirmed	2026-05-06 08:38:22.851+00	admin23	Confirmed from finance dashboard	\N
TXN-8DE02951	TXN-8DE02951	STU-854E151E	101080.00	internal	Invoice deleted: INV-09A4C499 — Payment receipt - 2026-05-06	2026-05-06 08:56:03.04+00	credit	adjustment	FININV-15DEB998	\N	\N	\N	0.00	FININV-15DEB998	confirmed	2026-05-06 08:56:03.04+00	admin23	Invoice deletion reversal	\N
TXN-7BCD4A28	TXN-7D515600	STU-AC24FC01	2310.00	transfer	\N	2026-05-06 08:56:24.454+00	credit	payment	\N	\N	\N	\N	0.00	FININV-A783EA04	confirmed	2026-05-06 08:56:24.454+00	admin23	Recorded by finance dashboard	\N
TXN-83AF9DBB	TXN-83AF9DBB	STU-AC24FC01	2310.00	internal	Invoice INV-6E81E65A: Payment receipt - 2026-05-06	2026-05-06 08:56:25.958+00	debit	adjustment	FININV-421DFAA4	\N	\N	\N	2310.00	FININV-421DFAA4	confirmed	2026-05-06 08:56:25.958+00	system	Invoice charge posted	\N
TXN-5080ED8A	TXN-5080ED8A	USR-STU-1007	550.00	internal	Balance cleared by finance admin	2026-05-06 08:56:48.144+00	credit	adjustment	USR-STU-1007	\N	\N	\N	0.00	\N	confirmed	2026-05-06 08:56:48.144+00	admin23	Balance cleared by finance admin	\N
TXN-13FC9EF1	TXN-13FC9EF1	STU-AC24FC01	2310.00	internal	Balance cleared by finance admin	2026-05-06 08:56:59.971+00	credit	adjustment	STU-AC24FC01	\N	\N	\N	0.00	\N	confirmed	2026-05-06 08:56:59.971+00	admin23	Balance cleared by finance admin	\N
TXN-B1D815A4	TXN-B1D815A4	STU-854E151E	100000.00	internal	Invoice deleted: INV-907E997A — Tuition Invoice	2026-05-06 09:18:46.61+00	credit	adjustment	FININV-6E0C4396	\N	\N	\N	-100000.00	FININV-6E0C4396	confirmed	2026-05-06 09:18:46.61+00	admin23	Invoice deletion reversal	\N
TXN-CA817728	TXN-9DCCCF9B	STU-8806EBCB	1000.00	transfer	\N	2026-05-07 10:25:55.177+00	credit	payment	\N	\N	\N	\N	0.00	\N	confirmed	2026-05-07 10:25:55.177+00	admin23	Recorded by finance dashboard	\N
\.


--
-- Data for Name: payroll_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_entries (id, staff_id, staff_name, pay_period, amount, status, paid_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_items (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payroll_runs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_runs (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: professor_workspaces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.professor_workspaces (id, professor_id, course_id, materials, assignments, quizzes, attendance_sessions, messages, announcements, office_hours, mark_publications, updated_at) FROM stdin;
PWORK-D7CC55AC	PROF-00000001	COURSE-00000001	[]	[]	[]	[]	[]	[]	[]	[]	2026-04-29 07:46:17.245+00
PWORK-ED7F8C2F	PROF-6DAB86DF	COURSE-SE-BCB46B6D	[{"id": "MAT-9004F2C7", "size": null, "title": "test1", "fileUrl": null, "category": "syllabus", "fileName": null, "mimeType": null, "updatedAt": "2026-05-06T17:15:47.141Z", "uploadedAt": "2026-05-06T17:15:47.141Z", "description": "test1"}]	[]	[]	[]	[]	[]	[]	[]	2026-05-06 17:15:47.141+00
PWORK-FBB920E4	PROF-6DAB86DF	COURSE-SE-CDE6B4AF	[]	[]	[]	[]	[]	[]	[]	[]	2026-05-06 21:57:13.217+00
\.


--
-- Data for Name: professors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.professors (id, first_name, last_name, email, phone, photo, department, salary, hire_date, specialization, status, created_at, updated_at) FROM stdin;
PROF-6DAB86DF	anasprof	test	anasprof@unyt.com	23	/placeholder-user.jpg	Computer Science	0.00	2026-04-30 21:54:29.421+00	23	active	2026-04-30 21:54:31.786+00	2026-05-05 14:49:45.056662+00
PROF-CBFDD391	ali	imhamed	tahahosine@gmail.com	0692057984	/placeholder-user.jpg	Computer Science	994.00	2026-05-05 00:00:00+00	pro	active	2026-05-05 19:18:39.568599+00	2026-05-05 19:18:39.568599+00
PROF-6625D078	test	test1	test@test.com	002	/placeholder-user.jpg	Computer Science	1000.00	2026-05-01 00:00:00+00	General	active	2026-05-06 17:08:29.439805+00	2026-05-06 17:08:29.439805+00
PROF-44277F84	anas	anas	anas@gmail.com		/placeholder-user.jpg	General	0.00	2026-05-07 14:25:16.931+00		active	2026-05-07 14:25:15.746646+00	2026-05-07 14:25:15.746646+00
\.


--
-- Data for Name: publications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.publications (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, course_id, professor_id, student_id, body, created_at, status, reply, replied_at) FROM stdin;
\.


--
-- Data for Name: quiz_attempt_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_attempt_answers (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_attempts (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_questions (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quizzes (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refund_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refund_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: registration_state; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_state (id, is_open, blocked_reason, updated_at, updated_by) FROM stdin;
global	t	\N	2026-04-19 19:11:51.345258+00	USR-REG-1001
first-year-open	t	\N	2026-04-19 19:11:51.345258+00	USR-REG-1001
second-year-open-hold	t	Unpaid tuition balance blocks registration	2026-04-19 19:11:51.345258+00	USR-REG-1002
third-year-closed	f	Registration closed by registrar	2026-04-19 19:11:51.345258+00	USR-REG-1003
\.


--
-- Data for Name: research_database_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_database_access (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: research_grants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_grants (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: research_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: revoked_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revoked_tokens (jti, revoked_at, revoked_by, reason) FROM stdin;
e3b4ff0f-7c97-43f8-927c-18d8517d0f8e	2026-08-11 08:53:36.57495+00	admin23	IoT Connectors: forced timeout
ccf2dd7e-8dd1-4a91-9413-92bc5a2462c9	2026-08-11 10:23:43.47289+00	admin23	IoT Connectors: forced timeout
6917ff67-2fe4-443e-860a-cb93db01cc98	2026-08-11 10:52:54.241997+00	admin23	IoT Connectors: forced re-authentication
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: room_bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room_bookings (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, name, campus, capacity, created_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (id, applied_at) FROM stdin;
0001_add_soft_delete_columns.sql	2026-08-06 22:38:08.627976+00
0002_add_hr_and_library_tables.sql	2026-08-06 23:01:09.148572+00
0003_add_campus_life_tables.sql	2026-08-06 23:24:21.095385+00
0004_add_advising_appointments.sql	2026-08-06 23:28:51.749107+00
0005_add_user_mfa_columns.sql	2026-08-06 23:36:24.769794+00
0006_add_course_reviews.sql	2026-08-06 23:42:10.019094+00
0007_add_enrollment_campus_and_acl.sql	2026-08-10 14:03:27.327522+00
0008_add_enrollment_undocumented_columns.sql	2026-08-10 14:03:27.385899+00
0009_register_module_toggles.sql	2026-08-10 14:03:27.440889+00
0010_add_advising_messages.sql	2026-08-11 08:04:09.976192+00
0011_add_semesters.sql	2026-08-11 08:53:09.888669+00
0012_backfill_semesters.sql	2026-08-11 08:53:09.99017+00
0013_fix_semester_matching.sql	2026-08-11 08:54:36.182864+00
\.


--
-- Data for Name: scholarship_awards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scholarship_awards (id, student_id, scholarship_name, amount, awarded_by, awarded_at, status, notes) FROM stdin;
SCH-2001	USR-STU-1001	Merit Excellence Award	1500.00	USR-ADM-1001	2026-04-19 19:11:51.345258+00	awarded	First-year scholarship student
SCH-2002	USR-STU-1004	STEM Excellence Grant	2000.00	USR-ADM-1002	2026-04-19 19:11:51.345258+00	awarded	Second-year scholarship coverage
SCH-2003	USR-STU-1007	Graduation Support Grant	1800.00	USR-ADM-1003	2026-04-19 19:11:51.345258+00	pending	Third-year student pending finance review
\.


--
-- Data for Name: security_incidents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.security_incidents (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.security_logs (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: semesters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semesters (id, label, academic_year, start_date, end_date, status, created_at, updated_at) FROM stdin;
SEM-FALL-2025	Fall 2025	2025-2026	2025-08-15	2025-12-20	closed	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-FALL-2026	Fall 2026	2026-2027	2026-08-15	2026-12-20	upcoming	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-FALL-2027	Fall 2027	2027-2028	2027-08-15	2027-12-20	upcoming	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-FALL-2028	Fall 2028	2028-2029	2028-08-15	2028-12-20	upcoming	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SPRING-2025	Spring 2025	2024-2025	2025-01-10	2025-05-20	closed	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SPRING-2027	Spring 2027	2026-2027	2027-01-10	2027-05-20	upcoming	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SPRING-2028	Spring 2028	2027-2028	2028-01-10	2028-05-20	upcoming	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SUMMER-2025	Summer 2025	2024-2025	2025-06-01	2025-07-25	closed	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SUMMER-2026	Summer 2026	2025-2026	2026-06-01	2026-07-25	closed	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SUMMER-2027	Summer 2027	2026-2027	2027-06-01	2027-07-25	upcoming	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SUMMER-2028	Summer 2028	2027-2028	2028-06-01	2028-07-25	upcoming	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
SEM-SPRING-2026	Spring 2026	2025-2026	2026-04-01	2026-08-01	closed	2026-08-11 08:53:09.916907+00	2026-08-11 08:53:09.916907+00
\.


--
-- Data for Name: site_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_content (id, hero, stats, highlights, about, admissions, metrics, updated_at) FROM stdin;
site-content	{"badge": "AR University", "title": "Build your future", "subtitle": "Academic excellence and practical skills", "primaryCtaHref": "/interest", "primaryCtaLabel": "Apply now", "secondaryCtaHref": "/admissions", "secondaryCtaLabel": "Explore programs", "backgroundImageUrl": null}	[{"label": "Students", "value": "0+", "metricKey": "students"}, {"label": "Courses", "value": "0+", "metricKey": "courses"}, {"label": "Professors", "value": "0+", "metricKey": "professors"}, {"label": "Enrollments", "value": "0+", "metricKey": "enrollments"}]	[{"title": "Career-focused curriculum", "description": "Practical content aligned with market needs"}, {"title": "Modern learning environment", "description": "Labs and collaborative spaces"}]	{"body": "A student-centered institution focused on technology and innovation.", "badge": "About", "title": "Who we are"}	{"body": "Submit your application and track status in your student portal.", "badge": "Admissions", "title": "Join us"}	{"courses": 2, "students": 2, "professors": 2, "enrollments": 1}	2026-04-15 17:41:38.178103+00
\.


--
-- Data for Name: sponsorships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sponsorships (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sso_config (id, provider, client_id, issuer_url, enabled, updated_at) FROM stdin;
SSO-2001	Azure AD	azure-client-id	https://login.microsoftonline.com/common/v2.0	t	2026-04-19 19:11:51.345258+00
SSO-2002	Google Workspace	google-client-id	https://accounts.google.com	f	2026-04-19 19:11:51.345258+00
SSO-B067FE35	canvas	11221	https://canvas.instructure.com/	f	2026-05-05 13:57:13.017+00
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sso_providers (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: staff_contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_contracts (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: staff_performance_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_performance_reviews (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: staff_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_records (id, first_name, last_name, email, department, "position", employment_status, hire_date, salary, phone, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_documents (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_profiles_extra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_profiles_extra (student_id, year_level, advisor_id, advisor_name, professor_id, professor_name, scholarship_status, payment_status, registration_hold, tuition_balance, notes, created_at, updated_at) FROM stdin;
USR-STU-1001	first-year	USR-ADV-1001	advisor.omer	USR-PRO-1001	dr.hassan	scholarship	paid	f	0.00	First year software engineering student with scholarship	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1002	first-year	USR-ADV-1002	advisor.nada	USR-PRO-1002	dr.mira	none	partial	f	450.00	First year student with partial payment	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1003	first-year	USR-ADV-1003	advisor.ledi	USR-PRO-1003	dr.erjon	none	unpaid	t	1200.00	First year student blocked by unpaid fees	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1004	second-year	USR-ADV-1001	advisor.omer	USR-PRO-1001	dr.hassan	scholarship	paid	f	0.00	Second year student assigned to advisor and professor	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1005	second-year	USR-ADV-1002	advisor.nada	USR-PRO-1002	dr.mira	none	partial	f	300.00	Second year student with balance remaining	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1006	second-year	USR-ADV-1003	advisor.ledi	USR-PRO-1003	dr.erjon	none	unpaid	t	1400.00	Second year student with registration hold	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1007	third-year	USR-ADV-1001	advisor.omer	USR-PRO-1001	dr.hassan	scholarship	paid	f	0.00	Third year student ready for internship and graduation planning	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1008	third-year	USR-ADV-1002	advisor.nada	USR-PRO-1002	dr.mira	none	partial	f	250.00	Third year student with partial fee payment	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
USR-STU-1009	third-year	USR-ADV-1003	advisor.ledi	USR-PRO-1003	dr.erjon	none	unpaid	t	1600.00	Third year student blocked until fees are settled	2026-04-17 16:54:00.657724+00	2026-04-19 19:11:51.345258+00
\.


--
-- Data for Name: student_record_changes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_record_changes (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_scholarships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_scholarships (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, display_id, first_name, last_name, email, phone, photo, enrollment_date, program, program_id, faculty, faculty_id, current_semester, status, address, date_of_birth, balance, supervisor_id, supervisor_name, created_at, updated_at, year_level, advisor_id, advisor_name, professor_id, professor_name, scholarship_status, payment_status, registration_hold, tuition_balance, middle_name, major, gender, nationality, national_id, passport_number, blood_type, city, postal_code, emergency_contact_name, emergency_contact_phone, mother_name, father_name, deleted_at) FROM stdin;
USR-STU-1007	USR-STU-1007	Mira	Kola	mira2@university.edu	+355680100007	/placeholder-user.jpg	2026-04-17 00:00:00+00	Computer Science	\N	\N	\N	Year 1	active	Computer Science	2001-12-25	0.00	PROF-00000001	Roland Kola	2026-04-17 16:54:00.657+00	2026-05-06 08:56:46.634856+00	3	USR-ADV-1001	advisor.omer	USR-PRO-1001	dr.hassan	scholarship	paid	f	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
STU-2A8EE849	STU-2A8EE849	anas	anas	anas@gmail.com	123	/placeholder-user.jpg	2026-05-01 00:00:00+00	Computer Science	\N	\N	\N	Year 1	active	12 15	2026-05-01	0.00	PROF1777585923791	anas test	2026-05-01 10:23:19.50294+00	2026-08-11 08:53:09.916907+00	1	\N	\N	\N	\N	\N	\N	f	0.00	anas	Software Engineering	\N	\N	\N	\N	\N	tirana	1001	\N	\N	\N	\N	\N
STU-8806EBCB	STU-8806EBCB	test2y	imhamed	tahahosinew@gmail.com	0692057984	/placeholder-user.jpg	2026-05-06 00:00:00+00	Computer Science	\N	\N	\N	Year 2	active	bllouk	1997-10-04	0.00	PROF-6DAB86DF	anasprof test	2026-05-06 17:36:11.432+00	2026-08-11 08:53:09.916907+00	2	\N	\N	\N	\N	\N	\N	f	0.00	test2y	Software Engineering	\N	\N	\N	\N	\N	tirana	1001	\N	\N	\N	\N	\N
STU-C067BF1D	STU-C067BF1D	tahatest	tahatest	tahatest@g	2323	/placeholder-user.jpg	2026-04-30 00:00:00+00	Computer Science	\N	\N	\N	Year 1	active	12 15	2026-02-26	0.00	PROF-6DAB86DF	anasprof test	2026-05-07 14:27:26.319591+00	2026-08-11 08:53:09.916907+00	1	\N	\N	\N	\N	\N	\N	f	0.00	tahatest	Software Engineering	\N	\N	\N	\N	\N	tirana	1001	\N	\N	\N	\N	\N
STU-AC24FC01	STU-AC24FC01	taha	imhamed	tahahosine23@gmail.com	0692057984	/placeholder-user.jpg	2026-04-19 00:00:00+00	Computer Science	\N	\N	\N	Year 3	active	test	2005-05-03	0.00	USR-PRO-1001	Dr Hassan Alami	2026-04-19 20:39:38.984+00	2026-08-11 08:53:09.916907+00	3	\N	\N	\N	\N	\N	\N	f	0.00	\N	\N	### #@##	### #@##	0002	memo23	wd	tirana	1001	Taha Hosine	0945849211	?/	ali	\N
STU-854E151E	STU-854E151E	mohamed	ali	ali@unyt.com	092321	/placeholder-user.jpg	2026-05-01 00:00:00+00	Computer Science	\N	\N	\N	Year 2	active	bllouk	2005-02-07	-100000.00	PROF-6DAB86DF	anasprof t	2026-04-30 22:26:02.749+00	2026-08-11 08:53:09.916907+00	2	\N	\N	\N	\N	\N	\N	f	0.00	ali	Software Engineering	\N	\N	\N	\N	\N	tirana	1001	\N	\N	\N	\N	\N
USR-STU-1008	USR-STU-1008	Denis	Hasa	denis.student@university.edu	+355680100008	/placeholder-user.jpg	2026-04-17 16:54:00.657+00	Business Administration	\N	\N	\N	\N	active	Business Administration	2001-12-30	999.00	\N	\N	2026-04-17 16:54:00.657+00	2026-08-11 16:18:28.615273+00	3	USR-ADV-1002	advisor.nada	USR-PRO-1002	dr.mira	none	partial	f	250.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: support_desk_replies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_desk_replies (id, ticket_id, author_id, author_name, author_role, body, created_at) FROM stdin;
\.


--
-- Data for Name: support_desk_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_desk_tickets (id, ticket_number, requester_id, requester_name, requester_role, department, category, subject, description, status, created_at, updated_at, closed_at, last_reply_at, last_reply_by_role) FROM stdin;
\.


--
-- Data for Name: support_ticket_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_ticket_messages (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, title, description, status, notes, created_at, updated_at) FROM stdin;
TKT-228DF60E		no one is listing to me :( thats bad	open	\N	2026-08-11 08:25:08.972+00	2026-08-11 08:25:08.972+00
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ta_student_support_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ta_student_support_sessions (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teaching_assistant_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teaching_assistant_assignments (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teaching_loads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teaching_loads (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transcript_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transcript_requests (id, student_id, requested_at, delivery_method, status, notes) FROM stdin;
TSR-2001	USR-STU-1007	2026-04-19 19:11:51.345258+00	email	ready	Third-year transcript request ready
TSR-2002	USR-STU-1008	2026-04-19 19:11:51.345258+00	pickup	pending	Pending fee clearance
TSR-2003	USR-STU-1009	2026-04-19 19:11:51.345258+00	email	blocked	Blocked until outstanding balance is paid
\.


--
-- Data for Name: transfer_credits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transfer_credits (id, student_id, source_institution, course_title, credit_hours, evaluated_by, evaluated_at, status) FROM stdin;
TRN-2001	USR-STU-1007	Regional College	Database Systems	3	USR-REG-1001	2026-04-19 19:11:51.345258+00	approved
TRN-2002	USR-STU-1008	City Institute	Business Analytics	4	USR-REG-1002	2026-04-19 19:11:51.345258+00	pending
TRN-2003	USR-STU-1009	National Technical College	Advanced Java	3	USR-REG-1003	2026-04-19 19:11:51.345258+00	rejected
\.


--
-- Data for Name: user_feature_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_feature_overrides (id, user_id, module_key, feature_key, state, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, user_id, permission_key, allowed, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_role_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_role_history (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, normalized_username, email, role, created_at, last_login, status, avatar_url, password, permissions, student_id, professor_id, full_name, phone, department, year_level, advisor_id, advisor_name, professor_name, custom_role_id, custom_role_name, access_profile, secondary_roles, deleted_at, mfa_enabled, mfa_secret) FROM stdin;
USR1776631176452	taha	taha	tahahosine23@gmail.com	student	2026-04-19 20:39:36.393+00	2026-08-11 16:21:11.474+00	active	\N	$2b$10$XpWACWcAWH7vXoABqGMK9.4MhvNpxD6bDXM9Aj2bvfDUV77wz0nAu	{"users:manage": true}	STU-AC24FC01	\N	\N	\N	\N	\N	\N	\N	\N	\N	MEMO	{}	["security"]	\N	f	\N
USR1777586069421	anasprof	anasprof	anasprof@unyt.com	professor	2026-04-30 21:54:29.356+00	2026-08-11 08:52:48.916+00	active	\N	$2b$10$T87KAGyjSt96xW9WBuEqZe4VF3QytOqA/FqRoEl5lydL7h.yHIH5K	{}	\N	PROF-6DAB86DF	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	["advisor"]	\N	f	\N
USR1778087307326	test1	test1	test@test.com	professor	2026-05-06 17:08:27.262+00	2026-05-07 08:48:36.075+00	active	\N	$2b$10$T87KAGyjSt96xW9WBuEqZe4VF3QytOqA/FqRoEl5lydL7h.yHIH5K	{"ENTER_GRADES": true, "edit_own_grades": true}	\N	PROF-6625D078	\N	\N	\N	\N	\N	\N	\N	\N	ad	{}	["advisor"]	\N	f	\N
USR-SUP-0001	supervisor_sara	supervisor_sara	supervisor@unyt.local	supervisor	2026-04-15 17:41:38.178+00	2026-04-16 16:08:55.256+00	active	\N	$2b$10$Pvfdbx6LYnlIT.LkTNt46.xdD/JV7SLXfiyI1RRf0CZVC8EVtANjK	{"reports:view": true, "marketing:view": true, "enrollment:view": true, "marketing:manage": true, "enrollment:manage": true}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR1778088141083	student1	student1	student1@gmkail.com	student	2026-05-06 17:22:21.023+00	2026-05-06 17:22:21.023+00	active	\N	$2b$10$ugfw/j1lWHSh3RU5nlVE2erG9C6qMMEpF9fVhWilhBPoW7X.wZyDO	{"enrollment:self": true}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR1777587960760	memo	memo	ali@unyt.com	student	2026-04-30 22:26:00.683+00	2026-05-07 14:39:41.653+00	active	\N	$2b$10$nsatMRQAKOOrplaZTilZGetP83Zw7xoz7nDr2aiEPrclsBOvi3KOa	{"ENTER_GRADES": false, "enrollment:self": false, "enrollment:override-window": true, "enrollment:override-capacity": false}	STU-854E151E	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-TA-1001	ta.noel	ta.noel	ta.noel@university.edu	teaching-assistant	2026-04-17 16:28:08.367+00	2026-08-11 16:20:41.67+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Noel Kola	+355680300001	Computer Science	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-ADV-1001	advisor.omer	advisor.omer	advisor.omer@university.edu	advisor	2026-04-17 16:28:08.367+00	2026-08-08 14:08:46.692+00	active	\N	$2b$10$T87KAGyjSt96xW9WBuEqZe4VF3QytOqA/FqRoEl5lydL7h.yHIH5K	{}	\N	\N	Omer Kastrati	+355680400001	Advising	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-LIB-1003	library.riela	library.riela	library.riela@university.edu	librarian	2026-04-17 16:28:08.367+00	2026-08-11 16:21:14.167+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Riela Pango	+355681100003	Library	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-SAFF-1002	studaff.keti	studaff.keti	studaff.keti@university.edu	student-affairs	2026-04-17 16:28:08.367+00	2026-08-11 16:21:14.829+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Keti Tola	+355681300002	Student Affairs	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-HR-1003	hr.gerta	hr.gerta	hr.gerta@university.edu	hr	2026-04-17 16:28:08.367+00	2026-08-11 16:21:15.481+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Gerta Lila	+355681400003	Human Resources	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-SA-1003	superadmin.luan	superadmin.luan	superadmin.luan@university.edu	super-admin	2026-04-17 16:28:08.367+00	2026-08-08 13:37:37.263+00	active	\N	$2b$10$BlhUrlEIm4OrgMZMNS9dq.q5nLX5m8ZOddoz/3vSX8VD0mdckw2l2	{}	\N	\N	Luan Shkreli	+355681200003	Executive Admin	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR1777630199320	anas	anas	anas@gmail.com	professor	2026-05-01 10:09:59.253+00	2026-05-06 20:46:45.546+00	active	\N	$2b$10$T87KAGyjSt96xW9WBuEqZe4VF3QytOqA/FqRoEl5lydL7h.yHIH5K	{"enrollment:self": true}	\N	PROF-44277F84	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-RES-B823	research.nia	research.nia	research.nia@university.edu	research-office	2026-08-11 16:26:36.633+00	2026-08-11 16:26:36.633+00	active	\N	$2b$10$T87KAGyjSt96xW9WBuEqZe4VF3QytOqA/FqRoEl5lydL7h.yHIH5K	{}	\N	\N	Nia Kastrati	+355680900099	Research Office	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR1778088969769	test2y	test2y	tahahosinew@gmail.com	student	2026-05-06 17:36:09.709+00	2026-05-06 20:43:40.453+00	active	\N	$2b$10$H9PzyN0wcfCngKPtFpJnYeBEPLQ8ikmK6NLd31y1D7fzEYPucednS	{"enrollment:self": true}	STU-8806EBCB	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-HOD-1002	hod.ds	hod.ds	hod.ds@university.edu	hod	2026-04-17 16:28:08.367151+00	2026-04-17 16:28:08.367151+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Megi Dervishi	+355681000002	Data Science	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-HOD-1003	hod.biz	hod.biz	hod.biz@university.edu	hod	2026-04-17 16:28:08.367151+00	2026-04-17 16:28:08.367151+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Besnik Lami	+355681000003	Business Administration	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-ADM-1001	admissions.era	admissions.era	admissions.era@university.edu	admissions	2026-04-17 16:28:08.367+00	2026-08-11 16:20:42.704+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Era Duka	+355680600001	Admissions	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-FIN-1001	finance.elira	finance.elira	finance.elira@university.edu	finance	2026-04-17 16:28:08.367+00	2026-08-11 16:20:43.349+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Elira Hasa	+355680700001	Finance Office	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-HOD-1001	hod.cs	hod.cs	hod.cs@university.edu	hod	2026-04-17 16:28:08.367+00	2026-08-11 16:20:44.008+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Arjan Tafaj	+355681000001	Computer Science	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-SEC-1001	security.dani	security.dani	security.dani@university.edu	security	2026-04-17 16:28:08.367+00	2026-08-11 16:20:44.655+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Dani Frasheri	+355681500001	Security	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-REG-1003	registrar.rei	registrar.rei	registrar.rei@university.edu	registrar	2026-04-17 16:28:08.367+00	2026-08-11 16:21:12.225+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Rei Cani	+355680500003	Registrar Office	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-IT-1002	it.bora	it.bora	it.bora@university.edu	it-admin	2026-04-17 16:28:08.367+00	2026-08-11 16:21:12.873+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Bora Zeneli	+355680800002	IT Services	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-DEAN-1002	dean.petra	dean.petra	dean.petra@university.edu	dean	2026-04-17 16:28:08.367+00	2026-08-11 16:21:13.526+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Petra Nushi	+355680900002	Academic Affairs	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-FAC-1001	facilities.rina	facilities.rina	facilities.rina@university.edu	facilities	2026-04-17 16:28:08.367+00	2026-08-11 16:20:45.325+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{}	\N	\N	Rina Shehu	+355681600001	Facilities	\N	\N	\N	\N	\N	\N	{}	[]	\N	f	\N
USR-SA-1001	admin23	admin23	superadmin.alban@university.edu	super-admin	2026-04-17 16:28:08.367+00	2026-08-11 16:21:16.145+00	active	\N	$2b$10$l2K3paLvlIhRcOaoeJl5eeflKCfzAHH2LoLFPrHkshiGLPRMH80Sm	{"news:view": true, "audit:view": true, "users:edit": true, "news:manage": true, "audit:export": true, "finance:view": true, "reports:view": true, "settings:sso": true, "users:create": true, "users:delete": true, "users:manage": true, "feedback:view": true, "students:edit": true, "students:view": true, "finance:manage": true, "marketing:view": true, "reports:export": true, "enrollment:self": true, "enrollment:view": true, "feedback:manage": true, "finance:approve": true, "professors:edit": true, "professors:view": true, "settings:manage": true, "students:create": true, "students:delete": true, "marketing:manage": true, "applications:view": true, "enrollment:manage": true, "professors:create": true, "professors:delete": true, "settings:security": true, "applications:manage": true, "settings:integrations": true, "enrollment:override-window": true, "enrollment:override-capacity": true}	\N	\N	Alban Reka	+355681200001	Executive Admin	\N	\N	\N	\N	\N	\N	{"allowAuditExports": true, "allowNewsPublishing": true, "allowFinanceApprovals": true, "allowEnrollmentAnytime": true, "allowSensitiveSettings": true, "allowDeveloperWorkspace": true, "allowApplicationDecisions": true, "allowEnrollmentWhenClosed": true, "allowEnrollmentOverCapacity": true, "allowUserLifecycleManagement": true, "allowStudentLifecycleManagement": true, "allowProfessorLifecycleManagement": true}	{}	\N	f	\N
\.


--
-- Data for Name: visitor_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visitor_logs (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: welfare_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.welfare_requests (id, title, description, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-15 17:41:24
20211116045059	2026-04-15 17:41:24
20211116050929	2026-04-15 17:41:24
20211116051442	2026-04-15 17:41:24
20211116212300	2026-04-15 17:41:24
20211116213355	2026-04-15 17:41:25
20211116213934	2026-04-15 17:41:25
20211116214523	2026-04-15 17:41:25
20211122062447	2026-04-15 17:41:25
20211124070109	2026-04-15 17:41:25
20211202204204	2026-04-15 17:41:26
20211202204605	2026-04-15 17:41:26
20211210212804	2026-04-15 17:41:26
20211228014915	2026-04-15 17:41:27
20220107221237	2026-04-15 17:41:27
20220228202821	2026-04-15 17:41:27
20220312004840	2026-04-15 17:41:27
20220603231003	2026-04-15 17:41:27
20220603232444	2026-04-15 17:41:28
20220615214548	2026-04-15 17:41:28
20220712093339	2026-04-15 17:41:28
20220908172859	2026-04-15 17:41:28
20220916233421	2026-04-15 17:41:28
20230119133233	2026-04-15 17:41:29
20230128025114	2026-04-15 17:41:29
20230128025212	2026-04-15 17:41:29
20230227211149	2026-04-15 17:41:29
20230228184745	2026-04-15 17:41:29
20230308225145	2026-04-15 17:41:30
20230328144023	2026-04-15 17:41:30
20231018144023	2026-04-15 17:41:30
20231204144023	2026-04-15 17:41:30
20231204144024	2026-04-15 17:41:30
20231204144025	2026-04-15 17:41:31
20240108234812	2026-04-15 17:41:31
20240109165339	2026-04-15 17:41:31
20240227174441	2026-04-15 17:41:31
20240311171622	2026-04-15 17:41:32
20240321100241	2026-04-15 17:41:32
20240401105812	2026-04-15 17:41:32
20240418121054	2026-04-15 17:41:33
20240523004032	2026-04-15 17:41:33
20240618124746	2026-04-15 17:41:34
20240801235015	2026-04-15 17:41:34
20240805133720	2026-04-15 17:41:34
20240827160934	2026-04-15 17:41:34
20240919163303	2026-04-15 17:41:34
20240919163305	2026-04-15 17:41:35
20241019105805	2026-04-15 17:41:35
20241030150047	2026-04-15 17:41:35
20241108114728	2026-04-15 17:41:36
20241121104152	2026-04-15 17:41:36
20241130184212	2026-04-15 17:41:36
20241220035512	2026-04-15 17:41:36
20241220123912	2026-04-15 17:41:36
20241224161212	2026-04-15 17:41:37
20250107150512	2026-04-15 17:41:37
20250110162412	2026-04-15 17:41:37
20250123174212	2026-04-15 17:41:37
20250128220012	2026-04-15 17:41:37
20250506224012	2026-04-15 17:41:37
20250523164012	2026-04-15 17:41:38
20250714121412	2026-04-15 17:41:38
20250905041441	2026-04-15 17:41:38
20251103001201	2026-04-15 17:41:38
20251120212548	2026-04-15 17:41:38
20251120215549	2026-04-15 17:41:39
20260218120000	2026-04-15 17:41:39
20260326120000	2026-04-15 17:41:39
20260514120000	2026-08-03 08:01:39
20260527120000	2026-08-03 08:01:40
20260528120000	2026-08-03 08:01:40
20260603120000	2026-08-03 08:01:40
20260605120000	2026-08-03 08:01:41
20260606110000	2026-08-03 08:01:41
20260616120000	2026-08-03 08:01:41
20260624120000	2026-08-03 08:01:42
20260626120000	2026-08-03 08:01:43
20260706120000	2026-08-03 08:01:43
20260707120000	2026-08-03 08:01:44
20260709120000	2026-08-03 08:01:44
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_realtime_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-15 13:12:36.240681
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-15 13:12:36.272519
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-15 13:12:36.274516
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-15 13:12:36.299258
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-15 13:12:36.3104
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-15 13:12:36.315364
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-15 13:12:36.319807
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-15 13:12:36.323617
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-15 13:12:36.326694
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-15 13:12:36.330726
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-15 13:12:36.333502
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-15 13:12:36.338341
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-15 13:12:36.341427
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-15 13:12:36.344357
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-15 13:12:36.347085
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-15 13:12:36.371356
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-15 13:12:36.375113
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-15 13:12:36.380331
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-15 13:12:36.382799
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-15 13:12:36.387388
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-15 13:12:36.389863
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-15 13:12:36.395341
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-15 13:12:36.408266
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-15 13:12:36.415675
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-15 13:12:36.418378
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-15 13:12:36.422125
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-15 13:12:36.424945
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-15 13:12:36.427253
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-15 13:12:36.429509
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-15 13:12:36.432094
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-15 13:12:36.43435
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-15 13:12:36.436694
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-15 13:12:36.438829
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-15 13:12:36.440994
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-15 13:12:36.443138
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-15 13:12:36.445385
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-15 13:12:36.447442
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-15 13:12:36.44966
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-15 13:12:36.452661
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-15 13:12:36.461603
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-15 13:12:36.463646
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-15 13:12:36.467591
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-15 13:12:36.469996
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-15 13:12:36.472349
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-15 13:12:36.474562
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-15 13:12:36.477532
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-15 13:12:36.486239
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-15 13:12:36.489283
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-15 13:12:36.491616
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-15 13:12:36.505693
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-15 13:12:36.508676
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-15 13:12:36.846702
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-15 13:12:36.8483
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-15 13:12:36.855569
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-15 13:12:36.857598
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-15 13:12:36.858979
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-22 17:19:54.923263
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-22 17:19:54.937211
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-15 13:12:36.86233
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-08-03 07:59:44.514457
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-08-03 07:59:44.520192
61	mark-filename-immutable	fe0096517ae9d60aaec1d110172ba9036dc66bb7	2026-08-12 06:36:13.099133
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_realtime_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: academic_structure academic_structure_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_structure
    ADD CONSTRAINT academic_structure_pkey PRIMARY KEY (id);


--
-- Name: academic_terms academic_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT academic_terms_pkey PRIMARY KEY (id);


--
-- Name: accreditation_reports accreditation_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accreditation_reports
    ADD CONSTRAINT accreditation_reports_pkey PRIMARY KEY (id);


--
-- Name: admissions_scholarships admissions_scholarships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admissions_scholarships
    ADD CONSTRAINT admissions_scholarships_pkey PRIMARY KEY (id);


--
-- Name: advising_appointments advising_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advising_appointments
    ADD CONSTRAINT advising_appointments_pkey PRIMARY KEY (id);


--
-- Name: advising_messages advising_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advising_messages
    ADD CONSTRAINT advising_messages_pkey PRIMARY KEY (id);


--
-- Name: advisor_meetings advisor_meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advisor_meetings
    ADD CONSTRAINT advisor_meetings_pkey PRIMARY KEY (id);


--
-- Name: advisor_notes advisor_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advisor_notes
    ADD CONSTRAINT advisor_notes_pkey PRIMARY KEY (id);


--
-- Name: advisor_risk_alerts advisor_risk_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advisor_risk_alerts
    ADD CONSTRAINT advisor_risk_alerts_pkey PRIMARY KEY (id);


--
-- Name: advisor_student_assignments advisor_student_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advisor_student_assignments
    ADD CONSTRAINT advisor_student_assignments_pkey PRIMARY KEY (id);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_pending_actions ai_pending_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_pending_actions
    ADD CONSTRAINT ai_pending_actions_pkey PRIMARY KEY (id);


--
-- Name: api_clients api_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_pkey PRIMARY KEY (id);


--
-- Name: application_documents application_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_documents
    ADD CONSTRAINT application_documents_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: attendance_sessions attendance_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: backup_jobs backup_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backup_jobs
    ADD CONSTRAINT backup_jobs_pkey PRIMARY KEY (id);


--
-- Name: backup_snapshots backup_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backup_snapshots
    ADD CONSTRAINT backup_snapshots_pkey PRIMARY KEY (id);


--
-- Name: book_copies book_copies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_copies
    ADD CONSTRAINT book_copies_pkey PRIMARY KEY (id);


--
-- Name: book_loans book_loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_loans
    ADD CONSTRAINT book_loans_pkey PRIMARY KEY (id);


--
-- Name: book_reservations book_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_reservations
    ADD CONSTRAINT book_reservations_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: branding_settings branding_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branding_settings
    ADD CONSTRAINT branding_settings_pkey PRIMARY KEY (id);


--
-- Name: campus_event_rsvps campus_event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campus_event_rsvps
    ADD CONSTRAINT campus_event_rsvps_pkey PRIMARY KEY (id);


--
-- Name: campus_events campus_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campus_events
    ADD CONSTRAINT campus_events_pkey PRIMARY KEY (id);


--
-- Name: campuses campuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campuses
    ADD CONSTRAINT campuses_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: classroom_schedules classroom_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classroom_schedules
    ADD CONSTRAINT classroom_schedules_pkey PRIMARY KEY (id);


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);


--
-- Name: club_memberships club_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_memberships
    ADD CONSTRAINT club_memberships_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (code);


--
-- Name: course_approval_requests course_approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_approval_requests
    ADD CONSTRAINT course_approval_requests_pkey PRIMARY KEY (id);


--
-- Name: course_materials course_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_pkey PRIMARY KEY (id);


--
-- Name: course_reviews course_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_pkey PRIMARY KEY (id);


--
-- Name: courses courses_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_unique UNIQUE (code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: custom_roles custom_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_pkey PRIMARY KEY (id);


--
-- Name: deleted_courses deleted_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deleted_courses
    ADD CONSTRAINT deleted_courses_pkey PRIMARY KEY (id);


--
-- Name: department_comparisons department_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_comparisons
    ADD CONSTRAINT department_comparisons_pkey PRIMARY KEY (id);


--
-- Name: department_reports department_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_reports
    ADD CONSTRAINT department_reports_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: device_logs device_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_logs
    ADD CONSTRAINT device_logs_pkey PRIMARY KEY (id);


--
-- Name: discipline_cases discipline_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline_cases
    ADD CONSTRAINT discipline_cases_pkey PRIMARY KEY (id);


--
-- Name: ebooks ebooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebooks
    ADD CONSTRAINT ebooks_pkey PRIMARY KEY (id);


--
-- Name: email_sms_configs email_sms_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_sms_configs
    ADD CONSTRAINT email_sms_configs_pkey PRIMARY KEY (id);


--
-- Name: employee_leave_requests employee_leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_requests
    ADD CONSTRAINT employee_leave_requests_pkey PRIMARY KEY (id);


--
-- Name: enrollment_overrides enrollment_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_overrides
    ADD CONSTRAINT enrollment_overrides_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_no_duplicate_active; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_no_duplicate_active UNIQUE (student_id, course_id, status);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: entrance_exam_results entrance_exam_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrance_exam_results
    ADD CONSTRAINT entrance_exam_results_pkey PRIMARY KEY (id);


--
-- Name: equipment_requests equipment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_requests
    ADD CONSTRAINT equipment_requests_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: exam_timetables exam_timetables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_timetables
    ADD CONSTRAINT exam_timetables_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: faculty_budget_requests faculty_budget_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty_budget_requests
    ADD CONSTRAINT faculty_budget_requests_pkey PRIMARY KEY (id);


--
-- Name: fee_invoice_items fee_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoice_items
    ADD CONSTRAINT fee_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: fee_invoices fee_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: finance_installment_plans finance_installment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_installment_plans
    ADD CONSTRAINT finance_installment_plans_pkey PRIMARY KEY (id);


--
-- Name: finance_invoices finance_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_invoices
    ADD CONSTRAINT finance_invoices_pkey PRIMARY KEY (id);


--
-- Name: finance_refund_requests finance_refund_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_refund_requests
    ADD CONSTRAINT finance_refund_requests_pkey PRIMARY KEY (id);


--
-- Name: finance_requests finance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_requests
    ADD CONSTRAINT finance_requests_pkey PRIMARY KEY (id);


--
-- Name: finance_sponsorships finance_sponsorships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_sponsorships
    ADD CONSTRAINT finance_sponsorships_pkey PRIMARY KEY (id);


--
-- Name: financial_holds financial_holds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_holds
    ADD CONSTRAINT financial_holds_pkey PRIMARY KEY (id);


--
-- Name: financial_ledger financial_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_ledger
    ADD CONSTRAINT financial_ledger_pkey PRIMARY KEY (id);


--
-- Name: financial_reports financial_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_reports
    ADD CONSTRAINT financial_reports_pkey PRIMARY KEY (id);


--
-- Name: global_announcements global_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_announcements
    ADD CONSTRAINT global_announcements_pkey PRIMARY KEY (id);


--
-- Name: grade_change_audit grade_change_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_change_audit
    ADD CONSTRAINT grade_change_audit_pkey PRIMARY KEY (id);


--
-- Name: gradebook_entries gradebook_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT gradebook_entries_pkey PRIMARY KEY (id);


--
-- Name: graduation_approvals graduation_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.graduation_approvals
    ADD CONSTRAINT graduation_approvals_pkey PRIMARY KEY (id);


--
-- Name: graduation_eligibility_checks graduation_eligibility_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.graduation_eligibility_checks
    ADD CONSTRAINT graduation_eligibility_checks_pkey PRIMARY KEY (id);


--
-- Name: homework_grading_tasks homework_grading_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.homework_grading_tasks
    ADD CONSTRAINT homework_grading_tasks_pkey PRIMARY KEY (id);


--
-- Name: housing_assignments housing_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.housing_assignments
    ADD CONSTRAINT housing_assignments_pkey PRIMARY KEY (id);


--
-- Name: id_card_access id_card_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.id_card_access
    ADD CONSTRAINT id_card_access_pkey PRIMARY KEY (id);


--
-- Name: incident_reports incident_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incident_reports
    ADD CONSTRAINT incident_reports_pkey PRIMARY KEY (id);


--
-- Name: income income_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.income
    ADD CONSTRAINT income_pkey PRIMARY KEY (id);


--
-- Name: installment_payments installment_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.installment_payments
    ADD CONSTRAINT installment_payments_pkey PRIMARY KEY (id);


--
-- Name: installment_plans installment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.installment_plans
    ADD CONSTRAINT installment_plans_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: interview_schedules interview_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_schedules
    ADD CONSTRAINT interview_schedules_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: journals journals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journals
    ADD CONSTRAINT journals_pkey PRIMARY KEY (id);


--
-- Name: lab_materials lab_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_materials
    ADD CONSTRAINT lab_materials_pkey PRIMARY KEY (id);


--
-- Name: late_penalties late_penalties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.late_penalties
    ADD CONSTRAINT late_penalties_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: library_books library_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.library_books
    ADD CONSTRAINT library_books_pkey PRIMARY KEY (id);


--
-- Name: library_fines library_fines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.library_fines
    ADD CONSTRAINT library_fines_pkey PRIMARY KEY (id);


--
-- Name: library_loans library_loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.library_loans
    ADD CONSTRAINT library_loans_pkey PRIMARY KEY (id);


--
-- Name: login_devices login_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_devices
    ADD CONSTRAINT login_devices_pkey PRIMARY KEY (id);


--
-- Name: maintenance_mode maintenance_mode_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_mode
    ADD CONSTRAINT maintenance_mode_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: maintenance_state maintenance_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_state
    ADD CONSTRAINT maintenance_state_pkey PRIMARY KEY (id);


--
-- Name: maintenance_windows maintenance_windows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_windows
    ADD CONSTRAINT maintenance_windows_pkey PRIMARY KEY (id);


--
-- Name: meal_plans meal_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_plans
    ADD CONSTRAINT meal_plans_pkey PRIMARY KEY (id);


--
-- Name: module_toggles module_toggles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_toggles
    ADD CONSTRAINT module_toggles_pkey PRIMARY KEY (id);


--
-- Name: multilingual_strings multilingual_strings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.multilingual_strings
    ADD CONSTRAINT multilingual_strings_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offer_letters offer_letters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_letters
    ADD CONSTRAINT offer_letters_pkey PRIMARY KEY (id);


--
-- Name: password_reset_audit password_reset_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_audit
    ADD CONSTRAINT password_reset_audit_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payroll_entries payroll_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_pkey PRIMARY KEY (id);


--
-- Name: payroll_items payroll_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_pkey PRIMARY KEY (id);


--
-- Name: payroll_runs payroll_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_pkey PRIMARY KEY (id);


--
-- Name: professor_workspaces professor_workspaces_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professor_workspaces
    ADD CONSTRAINT professor_workspaces_course_id_key UNIQUE (course_id);


--
-- Name: professor_workspaces professor_workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professor_workspaces
    ADD CONSTRAINT professor_workspaces_pkey PRIMARY KEY (id);


--
-- Name: professors professors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professors
    ADD CONSTRAINT professors_pkey PRIMARY KEY (id);


--
-- Name: publications publications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT publications_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempt_answers quiz_attempt_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempt_answers
    ADD CONSTRAINT quiz_attempt_answers_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: refund_requests refund_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (id);


--
-- Name: registration_state registration_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_state
    ADD CONSTRAINT registration_state_pkey PRIMARY KEY (id);


--
-- Name: research_database_access research_database_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_database_access
    ADD CONSTRAINT research_database_access_pkey PRIMARY KEY (id);


--
-- Name: research_grants research_grants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_grants
    ADD CONSTRAINT research_grants_pkey PRIMARY KEY (id);


--
-- Name: research_requests research_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_requests
    ADD CONSTRAINT research_requests_pkey PRIMARY KEY (id);


--
-- Name: revoked_tokens revoked_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (jti);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: room_bookings room_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT room_bookings_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: scholarship_awards scholarship_awards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scholarship_awards
    ADD CONSTRAINT scholarship_awards_pkey PRIMARY KEY (id);


--
-- Name: security_incidents security_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_pkey PRIMARY KEY (id);


--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);


--
-- Name: site_content site_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_pkey PRIMARY KEY (id);


--
-- Name: sponsorships sponsorships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsorships
    ADD CONSTRAINT sponsorships_pkey PRIMARY KEY (id);


--
-- Name: sso_config sso_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_config
    ADD CONSTRAINT sso_config_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: staff_contracts staff_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_contracts
    ADD CONSTRAINT staff_contracts_pkey PRIMARY KEY (id);


--
-- Name: staff_performance_reviews staff_performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_performance_reviews
    ADD CONSTRAINT staff_performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: staff_records staff_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_records
    ADD CONSTRAINT staff_records_pkey PRIMARY KEY (id);


--
-- Name: student_documents student_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_documents
    ADD CONSTRAINT student_documents_pkey PRIMARY KEY (id);


--
-- Name: student_profiles_extra student_profiles_extra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles_extra
    ADD CONSTRAINT student_profiles_extra_pkey PRIMARY KEY (student_id);


--
-- Name: student_record_changes student_record_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_record_changes
    ADD CONSTRAINT student_record_changes_pkey PRIMARY KEY (id);


--
-- Name: student_scholarships student_scholarships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_scholarships
    ADD CONSTRAINT student_scholarships_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: support_desk_replies support_desk_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_desk_replies
    ADD CONSTRAINT support_desk_replies_pkey PRIMARY KEY (id);


--
-- Name: support_desk_tickets support_desk_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_desk_tickets
    ADD CONSTRAINT support_desk_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_ticket_messages support_ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_ticket_messages
    ADD CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: ta_student_support_sessions ta_student_support_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ta_student_support_sessions
    ADD CONSTRAINT ta_student_support_sessions_pkey PRIMARY KEY (id);


--
-- Name: teaching_assistant_assignments teaching_assistant_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teaching_assistant_assignments
    ADD CONSTRAINT teaching_assistant_assignments_pkey PRIMARY KEY (id);


--
-- Name: teaching_loads teaching_loads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teaching_loads
    ADD CONSTRAINT teaching_loads_pkey PRIMARY KEY (id);


--
-- Name: transcript_requests transcript_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transcript_requests
    ADD CONSTRAINT transcript_requests_pkey PRIMARY KEY (id);


--
-- Name: transfer_credits transfer_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfer_credits
    ADD CONSTRAINT transfer_credits_pkey PRIMARY KEY (id);


--
-- Name: user_feature_overrides user_feature_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_feature_overrides
    ADD CONSTRAINT user_feature_overrides_pkey PRIMARY KEY (id);


--
-- Name: user_feature_overrides user_feature_overrides_user_id_module_key_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_feature_overrides
    ADD CONSTRAINT user_feature_overrides_user_id_module_key_feature_key_key UNIQUE (user_id, module_key, feature_key);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_role_history user_role_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_history
    ADD CONSTRAINT user_role_history_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (normalized_username);


--
-- Name: visitor_logs visitor_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitor_logs
    ADD CONSTRAINT visitor_logs_pkey PRIMARY KEY (id);


--
-- Name: welfare_requests welfare_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.welfare_requests
    ADD CONSTRAINT welfare_requests_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: idx_advising_appointments_advisor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advising_appointments_advisor_id ON public.advising_appointments USING btree (advisor_id);


--
-- Name: idx_advising_appointments_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advising_appointments_student_id ON public.advising_appointments USING btree (student_id);


--
-- Name: idx_advising_messages_advisor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advising_messages_advisor_id ON public.advising_messages USING btree (advisor_id);


--
-- Name: idx_advising_messages_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advising_messages_student_id ON public.advising_messages USING btree (student_id);


--
-- Name: idx_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id, updated_at DESC);


--
-- Name: idx_ai_messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages USING btree (conversation_id, created_at);


--
-- Name: idx_ai_pending_actions_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_pending_actions_conversation_id ON public.ai_pending_actions USING btree (conversation_id, created_at DESC);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs USING btree (entity_id);


--
-- Name: idx_campus_event_rsvps_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campus_event_rsvps_event_id ON public.campus_event_rsvps USING btree (event_id);


--
-- Name: idx_campus_event_rsvps_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_campus_event_rsvps_unique ON public.campus_event_rsvps USING btree (event_id, student_id);


--
-- Name: idx_classes_campus_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_campus_id ON public.classes USING btree (campus_id);


--
-- Name: idx_course_reviews_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_reviews_course_id ON public.course_reviews USING btree (course_id);


--
-- Name: idx_course_reviews_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_course_reviews_unique ON public.course_reviews USING btree (course_id, student_id);


--
-- Name: idx_courses_enrollment_open_enrollment_open_at_enrollment_close; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_enrollment_open_enrollment_open_at_enrollment_close ON public.courses USING btree (enrollment_open, enrollment_open_at, enrollment_close_at);


--
-- Name: idx_courses_enrollment_open_window; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_enrollment_open_window ON public.courses USING btree (enrollment_open, enrollment_open_at, enrollment_close_at);


--
-- Name: idx_courses_professor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_professor_id ON public.courses USING btree (professor_id);


--
-- Name: idx_courses_schedule_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_schedule_gin ON public.courses USING gin (schedule);


--
-- Name: idx_courses_semester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_semester_id ON public.courses USING btree (semester_id);


--
-- Name: idx_courses_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_start_date ON public.courses USING btree (start_date DESC);


--
-- Name: idx_custom_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_custom_roles_name ON public.custom_roles USING btree (name);


--
-- Name: idx_deleted_courses_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deleted_courses_deleted_at ON public.deleted_courses USING btree (deleted_at DESC);


--
-- Name: idx_enrollments_course_id_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_course_id_status ON public.enrollments USING btree (course_id, status);


--
-- Name: idx_enrollments_course_semester_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_course_semester_status ON public.enrollments USING btree (course_id, semester, status);


--
-- Name: idx_enrollments_course_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_course_status ON public.enrollments USING btree (course_id, status);


--
-- Name: idx_enrollments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_created_at ON public.enrollments USING btree (created_at DESC);


--
-- Name: idx_enrollments_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_deleted_at ON public.enrollments USING btree (deleted_at);


--
-- Name: idx_enrollments_semester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_semester_id ON public.enrollments USING btree (semester_id);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);


--
-- Name: idx_enrollments_student_course_semester_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_enrollments_student_course_semester_unique ON public.enrollments USING btree (student_id, course_id, semester) WHERE (status <> ALL (ARRAY['cancelled'::public.enrollment_status, 'rejected'::public.enrollment_status, 'dropped'::public.enrollment_status]));


--
-- Name: idx_enrollments_student_id_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_student_id_status ON public.enrollments USING btree (student_id, status);


--
-- Name: idx_enrollments_student_semester_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_student_semester_status ON public.enrollments USING btree (student_id, semester, status);


--
-- Name: idx_enrollments_student_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_student_status ON public.enrollments USING btree (student_id, status);


--
-- Name: idx_enrollments_unique_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_enrollments_unique_active ON public.enrollments USING btree (student_id, course_id) WHERE (status <> ALL (ARRAY['cancelled'::public.enrollment_status, 'rejected'::public.enrollment_status, 'dropped'::public.enrollment_status]));


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (date DESC);


--
-- Name: idx_feedback_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedback_date ON public.feedback USING btree (date DESC);


--
-- Name: idx_finance_installment_plans_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_installment_plans_student_id ON public.finance_installment_plans USING btree (student_id);


--
-- Name: idx_finance_invoices_invoice_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_finance_invoices_invoice_number ON public.finance_invoices USING btree (invoice_number);


--
-- Name: idx_finance_invoices_semester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_invoices_semester_id ON public.finance_invoices USING btree (semester_id);


--
-- Name: idx_finance_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_invoices_status ON public.finance_invoices USING btree (status);


--
-- Name: idx_finance_invoices_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_invoices_student_id ON public.finance_invoices USING btree (student_id);


--
-- Name: idx_finance_refund_requests_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_refund_requests_student_id ON public.finance_refund_requests USING btree (student_id);


--
-- Name: idx_finance_requests_request_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_finance_requests_request_number ON public.finance_requests USING btree (request_number);


--
-- Name: idx_finance_requests_requester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_requests_requester_id ON public.finance_requests USING btree (requester_id);


--
-- Name: idx_finance_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_requests_status ON public.finance_requests USING btree (status);


--
-- Name: idx_finance_sponsorships_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_sponsorships_student_id ON public.finance_sponsorships USING btree (student_id);


--
-- Name: idx_financial_holds_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_holds_status ON public.financial_holds USING btree (status);


--
-- Name: idx_financial_holds_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_holds_student_id ON public.financial_holds USING btree (student_id);


--
-- Name: idx_financial_ledger_enrollment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_ledger_enrollment_id ON public.financial_ledger USING btree (enrollment_id);


--
-- Name: idx_financial_ledger_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_ledger_student_id ON public.financial_ledger USING btree (student_id, created_at DESC);


--
-- Name: idx_grade_change_audit_enrollment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grade_change_audit_enrollment_id ON public.grade_change_audit USING btree (enrollment_id, created_at DESC);


--
-- Name: idx_grade_change_audit_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grade_change_audit_student_id ON public.grade_change_audit USING btree (student_id, created_at DESC);


--
-- Name: idx_housing_assignments_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_housing_assignments_student_id ON public.housing_assignments USING btree (student_id);


--
-- Name: idx_income_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_income_date ON public.income USING btree (date DESC);


--
-- Name: idx_library_loans_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_library_loans_book_id ON public.library_loans USING btree (book_id);


--
-- Name: idx_maintenance_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenance_requests_status ON public.maintenance_requests USING btree (status);


--
-- Name: idx_meal_plans_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_meal_plans_student_id ON public.meal_plans USING btree (student_id);


--
-- Name: idx_news_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_created_at ON public.news USING btree (created_at DESC);


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_payments_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_deleted_at ON public.payments USING btree (deleted_at);


--
-- Name: idx_payments_reference_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_reference_source ON public.payments USING btree (reference_id, source);


--
-- Name: idx_payments_student_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_student_created ON public.payments USING btree (student_id, created_at DESC);


--
-- Name: idx_payroll_entries_staff_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_entries_staff_id ON public.payroll_entries USING btree (staff_id);


--
-- Name: idx_professor_workspaces_professor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professor_workspaces_professor_id ON public.professor_workspaces USING btree (professor_id);


--
-- Name: idx_professors_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professors_email ON public.professors USING btree (email);


--
-- Name: idx_professors_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professors_status ON public.professors USING btree (status);


--
-- Name: idx_questions_prof_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_prof_created ON public.questions USING btree (professor_id, created_at DESC);


--
-- Name: idx_questions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_status ON public.questions USING btree (status);


--
-- Name: idx_questions_student_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_student_created ON public.questions USING btree (student_id, created_at DESC);


--
-- Name: idx_rooms_campus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_campus ON public.rooms USING btree (campus);


--
-- Name: idx_semesters_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_semesters_start_date ON public.semesters USING btree (start_date);


--
-- Name: idx_semesters_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_semesters_status ON public.semesters USING btree (status);


--
-- Name: idx_students_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_city ON public.students USING btree (city);


--
-- Name: idx_students_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_deleted_at ON public.students USING btree (deleted_at);


--
-- Name: idx_students_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_email ON public.students USING btree (email);


--
-- Name: idx_students_major; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_major ON public.students USING btree (major);


--
-- Name: idx_students_nationality; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_nationality ON public.students USING btree (nationality);


--
-- Name: idx_students_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_status ON public.students USING btree (status);


--
-- Name: idx_students_supervisor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_supervisor_id ON public.students USING btree (supervisor_id);


--
-- Name: idx_support_desk_replies_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_desk_replies_ticket_id ON public.support_desk_replies USING btree (ticket_id);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_user_feature_overrides_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_feature_overrides_user_id ON public.user_feature_overrides USING btree (user_id);


--
-- Name: idx_user_permissions_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_user_permissions_unique ON public.user_permissions USING btree (user_id, permission_key);


--
-- Name: idx_user_permissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);


--
-- Name: idx_users_custom_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_custom_role_id ON public.users USING btree (custom_role_id);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_professor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_professor_id ON public.users USING btree (professor_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_users_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_student_id ON public.users USING btree (student_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: courses trg_courses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: enrollments trg_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: professors trg_professors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_professors_updated_at BEFORE UPDATE ON public.professors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: students trg_students_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: classes classes_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id) ON DELETE CASCADE;


--
-- Name: courses courses_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professors(id) ON DELETE RESTRICT;


--
-- Name: courses courses_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);


--
-- Name: enrollments enrollments_coupon_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES public.coupons(code) ON DELETE SET NULL;


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professors(id) ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: feedback feedback_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professors(id) ON DELETE SET NULL;


--
-- Name: finance_invoices finance_invoices_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_invoices
    ADD CONSTRAINT finance_invoices_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id);


--
-- Name: enrollments fk_enrollments_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: enrollments fk_enrollments_professor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enrollments_professor FOREIGN KEY (professor_id) REFERENCES public.professors(id) ON DELETE RESTRICT;


--
-- Name: enrollments fk_enrollments_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: income income_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.income
    ADD CONSTRAINT income_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: payments payments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: payments payments_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE SET NULL;


--
-- Name: payments payments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: questions questions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: questions questions_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professors(id) ON DELETE CASCADE;


--
-- Name: questions questions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: users users_professor_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_professor_fk FOREIGN KEY (professor_id) REFERENCES public.professors(id) ON DELETE SET NULL;


--
-- Name: users users_student_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_student_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: campuses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: device_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: enrollment_overrides; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.enrollment_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: graduation_approvals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.graduation_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: id_card_access; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.id_card_access ENABLE ROW LEVEL SECURITY;

--
-- Name: interview_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_state; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.maintenance_state ENABLE ROW LEVEL SECURITY;

--
-- Name: offer_letters; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;

--
-- Name: registration_state; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.registration_state ENABLE ROW LEVEL SECURITY;

--
-- Name: scholarship_awards; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.scholarship_awards ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_config; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sso_config ENABLE ROW LEVEL SECURITY;

--
-- Name: student_profiles_extra; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_profiles_extra ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: transcript_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transcript_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_credits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transfer_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE academic_structure; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.academic_structure TO anon;
GRANT ALL ON TABLE public.academic_structure TO authenticated;
GRANT ALL ON TABLE public.academic_structure TO service_role;


--
-- Name: TABLE academic_terms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.academic_terms TO anon;
GRANT ALL ON TABLE public.academic_terms TO authenticated;
GRANT ALL ON TABLE public.academic_terms TO service_role;


--
-- Name: TABLE accreditation_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.accreditation_reports TO anon;
GRANT ALL ON TABLE public.accreditation_reports TO authenticated;
GRANT ALL ON TABLE public.accreditation_reports TO service_role;


--
-- Name: TABLE admissions_scholarships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admissions_scholarships TO anon;
GRANT ALL ON TABLE public.admissions_scholarships TO authenticated;
GRANT ALL ON TABLE public.admissions_scholarships TO service_role;


--
-- Name: TABLE advising_appointments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.advising_appointments TO anon;
GRANT ALL ON TABLE public.advising_appointments TO authenticated;
GRANT ALL ON TABLE public.advising_appointments TO service_role;


--
-- Name: TABLE advising_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.advising_messages TO anon;
GRANT ALL ON TABLE public.advising_messages TO authenticated;
GRANT ALL ON TABLE public.advising_messages TO service_role;


--
-- Name: TABLE advisor_meetings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.advisor_meetings TO anon;
GRANT ALL ON TABLE public.advisor_meetings TO authenticated;
GRANT ALL ON TABLE public.advisor_meetings TO service_role;


--
-- Name: TABLE advisor_notes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.advisor_notes TO anon;
GRANT ALL ON TABLE public.advisor_notes TO authenticated;
GRANT ALL ON TABLE public.advisor_notes TO service_role;


--
-- Name: TABLE advisor_risk_alerts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.advisor_risk_alerts TO anon;
GRANT ALL ON TABLE public.advisor_risk_alerts TO authenticated;
GRANT ALL ON TABLE public.advisor_risk_alerts TO service_role;


--
-- Name: TABLE advisor_student_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.advisor_student_assignments TO anon;
GRANT ALL ON TABLE public.advisor_student_assignments TO authenticated;
GRANT ALL ON TABLE public.advisor_student_assignments TO service_role;


--
-- Name: TABLE ai_conversations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_conversations TO anon;
GRANT ALL ON TABLE public.ai_conversations TO authenticated;
GRANT ALL ON TABLE public.ai_conversations TO service_role;


--
-- Name: TABLE ai_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_messages TO anon;
GRANT ALL ON TABLE public.ai_messages TO authenticated;
GRANT ALL ON TABLE public.ai_messages TO service_role;


--
-- Name: TABLE ai_pending_actions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_pending_actions TO anon;
GRANT ALL ON TABLE public.ai_pending_actions TO authenticated;
GRANT ALL ON TABLE public.ai_pending_actions TO service_role;


--
-- Name: TABLE api_clients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.api_clients TO anon;
GRANT ALL ON TABLE public.api_clients TO authenticated;
GRANT ALL ON TABLE public.api_clients TO service_role;


--
-- Name: TABLE application_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.application_documents TO anon;
GRANT ALL ON TABLE public.application_documents TO authenticated;
GRANT ALL ON TABLE public.application_documents TO service_role;


--
-- Name: TABLE applications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.applications TO anon;
GRANT ALL ON TABLE public.applications TO authenticated;
GRANT ALL ON TABLE public.applications TO service_role;


--
-- Name: TABLE assignment_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_submissions TO anon;
GRANT ALL ON TABLE public.assignment_submissions TO authenticated;
GRANT ALL ON TABLE public.assignment_submissions TO service_role;


--
-- Name: TABLE assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignments TO anon;
GRANT ALL ON TABLE public.assignments TO authenticated;
GRANT ALL ON TABLE public.assignments TO service_role;


--
-- Name: TABLE attendance_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attendance_records TO anon;
GRANT ALL ON TABLE public.attendance_records TO authenticated;
GRANT ALL ON TABLE public.attendance_records TO service_role;


--
-- Name: TABLE attendance_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attendance_sessions TO anon;
GRANT ALL ON TABLE public.attendance_sessions TO authenticated;
GRANT ALL ON TABLE public.attendance_sessions TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE backup_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.backup_jobs TO anon;
GRANT ALL ON TABLE public.backup_jobs TO authenticated;
GRANT ALL ON TABLE public.backup_jobs TO service_role;


--
-- Name: TABLE backup_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.backup_snapshots TO anon;
GRANT ALL ON TABLE public.backup_snapshots TO authenticated;
GRANT ALL ON TABLE public.backup_snapshots TO service_role;


--
-- Name: TABLE book_copies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.book_copies TO anon;
GRANT ALL ON TABLE public.book_copies TO authenticated;
GRANT ALL ON TABLE public.book_copies TO service_role;


--
-- Name: TABLE book_loans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.book_loans TO anon;
GRANT ALL ON TABLE public.book_loans TO authenticated;
GRANT ALL ON TABLE public.book_loans TO service_role;


--
-- Name: TABLE book_reservations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.book_reservations TO anon;
GRANT ALL ON TABLE public.book_reservations TO authenticated;
GRANT ALL ON TABLE public.book_reservations TO service_role;


--
-- Name: TABLE books; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.books TO anon;
GRANT ALL ON TABLE public.books TO authenticated;
GRANT ALL ON TABLE public.books TO service_role;


--
-- Name: TABLE branding_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.branding_settings TO anon;
GRANT ALL ON TABLE public.branding_settings TO authenticated;
GRANT ALL ON TABLE public.branding_settings TO service_role;


--
-- Name: TABLE campus_event_rsvps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.campus_event_rsvps TO anon;
GRANT ALL ON TABLE public.campus_event_rsvps TO authenticated;
GRANT ALL ON TABLE public.campus_event_rsvps TO service_role;


--
-- Name: TABLE campus_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.campus_events TO anon;
GRANT ALL ON TABLE public.campus_events TO authenticated;
GRANT ALL ON TABLE public.campus_events TO service_role;


--
-- Name: TABLE campuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.campuses TO anon;
GRANT ALL ON TABLE public.campuses TO authenticated;
GRANT ALL ON TABLE public.campuses TO service_role;


--
-- Name: TABLE classes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.classes TO anon;
GRANT ALL ON TABLE public.classes TO authenticated;
GRANT ALL ON TABLE public.classes TO service_role;


--
-- Name: TABLE classroom_schedules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.classroom_schedules TO anon;
GRANT ALL ON TABLE public.classroom_schedules TO authenticated;
GRANT ALL ON TABLE public.classroom_schedules TO service_role;


--
-- Name: TABLE classrooms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.classrooms TO anon;
GRANT ALL ON TABLE public.classrooms TO authenticated;
GRANT ALL ON TABLE public.classrooms TO service_role;


--
-- Name: TABLE club_memberships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.club_memberships TO anon;
GRANT ALL ON TABLE public.club_memberships TO authenticated;
GRANT ALL ON TABLE public.club_memberships TO service_role;


--
-- Name: TABLE clubs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clubs TO anon;
GRANT ALL ON TABLE public.clubs TO authenticated;
GRANT ALL ON TABLE public.clubs TO service_role;


--
-- Name: TABLE coupons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.coupons TO anon;
GRANT ALL ON TABLE public.coupons TO authenticated;
GRANT ALL ON TABLE public.coupons TO service_role;


--
-- Name: TABLE course_approval_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_approval_requests TO anon;
GRANT ALL ON TABLE public.course_approval_requests TO authenticated;
GRANT ALL ON TABLE public.course_approval_requests TO service_role;


--
-- Name: TABLE course_materials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_materials TO anon;
GRANT ALL ON TABLE public.course_materials TO authenticated;
GRANT ALL ON TABLE public.course_materials TO service_role;


--
-- Name: TABLE course_reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_reviews TO anon;
GRANT ALL ON TABLE public.course_reviews TO authenticated;
GRANT ALL ON TABLE public.course_reviews TO service_role;


--
-- Name: TABLE courses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.courses TO anon;
GRANT ALL ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;


--
-- Name: TABLE custom_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.custom_roles TO anon;
GRANT ALL ON TABLE public.custom_roles TO authenticated;
GRANT ALL ON TABLE public.custom_roles TO service_role;


--
-- Name: TABLE deleted_courses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.deleted_courses TO anon;
GRANT ALL ON TABLE public.deleted_courses TO authenticated;
GRANT ALL ON TABLE public.deleted_courses TO service_role;


--
-- Name: TABLE department_comparisons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.department_comparisons TO anon;
GRANT ALL ON TABLE public.department_comparisons TO authenticated;
GRANT ALL ON TABLE public.department_comparisons TO service_role;


--
-- Name: TABLE department_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.department_reports TO anon;
GRANT ALL ON TABLE public.department_reports TO authenticated;
GRANT ALL ON TABLE public.department_reports TO service_role;


--
-- Name: TABLE departments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.departments TO anon;
GRANT ALL ON TABLE public.departments TO authenticated;
GRANT ALL ON TABLE public.departments TO service_role;


--
-- Name: TABLE device_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.device_logs TO anon;
GRANT ALL ON TABLE public.device_logs TO authenticated;
GRANT ALL ON TABLE public.device_logs TO service_role;


--
-- Name: TABLE discipline_cases; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.discipline_cases TO anon;
GRANT ALL ON TABLE public.discipline_cases TO authenticated;
GRANT ALL ON TABLE public.discipline_cases TO service_role;


--
-- Name: TABLE ebooks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ebooks TO anon;
GRANT ALL ON TABLE public.ebooks TO authenticated;
GRANT ALL ON TABLE public.ebooks TO service_role;


--
-- Name: TABLE email_sms_configs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.email_sms_configs TO anon;
GRANT ALL ON TABLE public.email_sms_configs TO authenticated;
GRANT ALL ON TABLE public.email_sms_configs TO service_role;


--
-- Name: TABLE employee_leave_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.employee_leave_requests TO anon;
GRANT ALL ON TABLE public.employee_leave_requests TO authenticated;
GRANT ALL ON TABLE public.employee_leave_requests TO service_role;


--
-- Name: TABLE enrollment_overrides; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.enrollment_overrides TO anon;
GRANT ALL ON TABLE public.enrollment_overrides TO authenticated;
GRANT ALL ON TABLE public.enrollment_overrides TO service_role;


--
-- Name: TABLE enrollments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.enrollments TO anon;
GRANT ALL ON TABLE public.enrollments TO authenticated;
GRANT ALL ON TABLE public.enrollments TO service_role;


--
-- Name: TABLE entrance_exam_results; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.entrance_exam_results TO anon;
GRANT ALL ON TABLE public.entrance_exam_results TO authenticated;
GRANT ALL ON TABLE public.entrance_exam_results TO service_role;


--
-- Name: TABLE equipment_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.equipment_requests TO anon;
GRANT ALL ON TABLE public.equipment_requests TO authenticated;
GRANT ALL ON TABLE public.equipment_requests TO service_role;


--
-- Name: TABLE event_registrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.event_registrations TO anon;
GRANT ALL ON TABLE public.event_registrations TO authenticated;
GRANT ALL ON TABLE public.event_registrations TO service_role;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;


--
-- Name: TABLE exam_timetables; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exam_timetables TO anon;
GRANT ALL ON TABLE public.exam_timetables TO authenticated;
GRANT ALL ON TABLE public.exam_timetables TO service_role;


--
-- Name: TABLE expenses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.expenses TO anon;
GRANT ALL ON TABLE public.expenses TO authenticated;
GRANT ALL ON TABLE public.expenses TO service_role;


--
-- Name: TABLE faculty_budget_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.faculty_budget_requests TO anon;
GRANT ALL ON TABLE public.faculty_budget_requests TO authenticated;
GRANT ALL ON TABLE public.faculty_budget_requests TO service_role;


--
-- Name: TABLE fee_invoice_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.fee_invoice_items TO anon;
GRANT ALL ON TABLE public.fee_invoice_items TO authenticated;
GRANT ALL ON TABLE public.fee_invoice_items TO service_role;


--
-- Name: TABLE fee_invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.fee_invoices TO anon;
GRANT ALL ON TABLE public.fee_invoices TO authenticated;
GRANT ALL ON TABLE public.fee_invoices TO service_role;


--
-- Name: TABLE feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feedback TO anon;
GRANT ALL ON TABLE public.feedback TO authenticated;
GRANT ALL ON TABLE public.feedback TO service_role;


--
-- Name: TABLE finance_installment_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.finance_installment_plans TO anon;
GRANT ALL ON TABLE public.finance_installment_plans TO authenticated;
GRANT ALL ON TABLE public.finance_installment_plans TO service_role;


--
-- Name: TABLE finance_invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.finance_invoices TO anon;
GRANT ALL ON TABLE public.finance_invoices TO authenticated;
GRANT ALL ON TABLE public.finance_invoices TO service_role;


--
-- Name: TABLE finance_refund_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.finance_refund_requests TO anon;
GRANT ALL ON TABLE public.finance_refund_requests TO authenticated;
GRANT ALL ON TABLE public.finance_refund_requests TO service_role;


--
-- Name: TABLE finance_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.finance_requests TO anon;
GRANT ALL ON TABLE public.finance_requests TO authenticated;
GRANT ALL ON TABLE public.finance_requests TO service_role;


--
-- Name: TABLE finance_sponsorships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.finance_sponsorships TO anon;
GRANT ALL ON TABLE public.finance_sponsorships TO authenticated;
GRANT ALL ON TABLE public.finance_sponsorships TO service_role;


--
-- Name: TABLE financial_holds; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_holds TO anon;
GRANT ALL ON TABLE public.financial_holds TO authenticated;
GRANT ALL ON TABLE public.financial_holds TO service_role;


--
-- Name: TABLE financial_ledger; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_ledger TO anon;
GRANT ALL ON TABLE public.financial_ledger TO authenticated;
GRANT ALL ON TABLE public.financial_ledger TO service_role;


--
-- Name: TABLE financial_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_reports TO anon;
GRANT ALL ON TABLE public.financial_reports TO authenticated;
GRANT ALL ON TABLE public.financial_reports TO service_role;


--
-- Name: TABLE global_announcements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.global_announcements TO anon;
GRANT ALL ON TABLE public.global_announcements TO authenticated;
GRANT ALL ON TABLE public.global_announcements TO service_role;


--
-- Name: TABLE grade_change_audit; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.grade_change_audit TO anon;
GRANT ALL ON TABLE public.grade_change_audit TO authenticated;
GRANT ALL ON TABLE public.grade_change_audit TO service_role;


--
-- Name: TABLE gradebook_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gradebook_entries TO anon;
GRANT ALL ON TABLE public.gradebook_entries TO authenticated;
GRANT ALL ON TABLE public.gradebook_entries TO service_role;


--
-- Name: TABLE graduation_approvals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.graduation_approvals TO anon;
GRANT ALL ON TABLE public.graduation_approvals TO authenticated;
GRANT ALL ON TABLE public.graduation_approvals TO service_role;


--
-- Name: TABLE graduation_eligibility_checks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.graduation_eligibility_checks TO anon;
GRANT ALL ON TABLE public.graduation_eligibility_checks TO authenticated;
GRANT ALL ON TABLE public.graduation_eligibility_checks TO service_role;


--
-- Name: TABLE homework_grading_tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.homework_grading_tasks TO anon;
GRANT ALL ON TABLE public.homework_grading_tasks TO authenticated;
GRANT ALL ON TABLE public.homework_grading_tasks TO service_role;


--
-- Name: TABLE housing_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.housing_assignments TO anon;
GRANT ALL ON TABLE public.housing_assignments TO authenticated;
GRANT ALL ON TABLE public.housing_assignments TO service_role;


--
-- Name: TABLE id_card_access; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.id_card_access TO anon;
GRANT ALL ON TABLE public.id_card_access TO authenticated;
GRANT ALL ON TABLE public.id_card_access TO service_role;


--
-- Name: TABLE incident_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.incident_reports TO anon;
GRANT ALL ON TABLE public.incident_reports TO authenticated;
GRANT ALL ON TABLE public.incident_reports TO service_role;


--
-- Name: TABLE income; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.income TO anon;
GRANT ALL ON TABLE public.income TO authenticated;
GRANT ALL ON TABLE public.income TO service_role;


--
-- Name: TABLE installment_payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.installment_payments TO anon;
GRANT ALL ON TABLE public.installment_payments TO authenticated;
GRANT ALL ON TABLE public.installment_payments TO service_role;


--
-- Name: TABLE installment_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.installment_plans TO anon;
GRANT ALL ON TABLE public.installment_plans TO authenticated;
GRANT ALL ON TABLE public.installment_plans TO service_role;


--
-- Name: TABLE integrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integrations TO anon;
GRANT ALL ON TABLE public.integrations TO authenticated;
GRANT ALL ON TABLE public.integrations TO service_role;


--
-- Name: TABLE interview_schedules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.interview_schedules TO anon;
GRANT ALL ON TABLE public.interview_schedules TO authenticated;
GRANT ALL ON TABLE public.interview_schedules TO service_role;


--
-- Name: TABLE interviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.interviews TO anon;
GRANT ALL ON TABLE public.interviews TO authenticated;
GRANT ALL ON TABLE public.interviews TO service_role;


--
-- Name: TABLE journals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.journals TO anon;
GRANT ALL ON TABLE public.journals TO authenticated;
GRANT ALL ON TABLE public.journals TO service_role;


--
-- Name: TABLE lab_materials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lab_materials TO anon;
GRANT ALL ON TABLE public.lab_materials TO authenticated;
GRANT ALL ON TABLE public.lab_materials TO service_role;


--
-- Name: TABLE late_penalties; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.late_penalties TO anon;
GRANT ALL ON TABLE public.late_penalties TO authenticated;
GRANT ALL ON TABLE public.late_penalties TO service_role;


--
-- Name: TABLE leave_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.leave_requests TO anon;
GRANT ALL ON TABLE public.leave_requests TO authenticated;
GRANT ALL ON TABLE public.leave_requests TO service_role;


--
-- Name: TABLE library_books; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.library_books TO anon;
GRANT ALL ON TABLE public.library_books TO authenticated;
GRANT ALL ON TABLE public.library_books TO service_role;


--
-- Name: TABLE library_fines; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.library_fines TO anon;
GRANT ALL ON TABLE public.library_fines TO authenticated;
GRANT ALL ON TABLE public.library_fines TO service_role;


--
-- Name: TABLE library_loans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.library_loans TO anon;
GRANT ALL ON TABLE public.library_loans TO authenticated;
GRANT ALL ON TABLE public.library_loans TO service_role;


--
-- Name: TABLE login_devices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.login_devices TO anon;
GRANT ALL ON TABLE public.login_devices TO authenticated;
GRANT ALL ON TABLE public.login_devices TO service_role;


--
-- Name: TABLE maintenance_mode; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_mode TO anon;
GRANT ALL ON TABLE public.maintenance_mode TO authenticated;
GRANT ALL ON TABLE public.maintenance_mode TO service_role;


--
-- Name: TABLE maintenance_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_requests TO anon;
GRANT ALL ON TABLE public.maintenance_requests TO authenticated;
GRANT ALL ON TABLE public.maintenance_requests TO service_role;


--
-- Name: TABLE maintenance_state; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_state TO anon;
GRANT ALL ON TABLE public.maintenance_state TO authenticated;
GRANT ALL ON TABLE public.maintenance_state TO service_role;


--
-- Name: TABLE maintenance_windows; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_windows TO anon;
GRANT ALL ON TABLE public.maintenance_windows TO authenticated;
GRANT ALL ON TABLE public.maintenance_windows TO service_role;


--
-- Name: TABLE meal_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.meal_plans TO anon;
GRANT ALL ON TABLE public.meal_plans TO authenticated;
GRANT ALL ON TABLE public.meal_plans TO service_role;


--
-- Name: TABLE module_toggles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.module_toggles TO anon;
GRANT ALL ON TABLE public.module_toggles TO authenticated;
GRANT ALL ON TABLE public.module_toggles TO service_role;


--
-- Name: TABLE multilingual_strings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.multilingual_strings TO anon;
GRANT ALL ON TABLE public.multilingual_strings TO authenticated;
GRANT ALL ON TABLE public.multilingual_strings TO service_role;


--
-- Name: TABLE news; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.news TO anon;
GRANT ALL ON TABLE public.news TO authenticated;
GRANT ALL ON TABLE public.news TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE offer_letters; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.offer_letters TO anon;
GRANT ALL ON TABLE public.offer_letters TO authenticated;
GRANT ALL ON TABLE public.offer_letters TO service_role;


--
-- Name: TABLE password_reset_audit; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.password_reset_audit TO anon;
GRANT ALL ON TABLE public.password_reset_audit TO authenticated;
GRANT ALL ON TABLE public.password_reset_audit TO service_role;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- Name: TABLE payroll_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payroll_entries TO anon;
GRANT ALL ON TABLE public.payroll_entries TO authenticated;
GRANT ALL ON TABLE public.payroll_entries TO service_role;


--
-- Name: TABLE payroll_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payroll_items TO anon;
GRANT ALL ON TABLE public.payroll_items TO authenticated;
GRANT ALL ON TABLE public.payroll_items TO service_role;


--
-- Name: TABLE payroll_runs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payroll_runs TO anon;
GRANT ALL ON TABLE public.payroll_runs TO authenticated;
GRANT ALL ON TABLE public.payroll_runs TO service_role;


--
-- Name: TABLE professor_workspaces; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.professor_workspaces TO anon;
GRANT ALL ON TABLE public.professor_workspaces TO authenticated;
GRANT ALL ON TABLE public.professor_workspaces TO service_role;


--
-- Name: TABLE professors; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.professors TO anon;
GRANT ALL ON TABLE public.professors TO authenticated;
GRANT ALL ON TABLE public.professors TO service_role;


--
-- Name: TABLE publications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.publications TO anon;
GRANT ALL ON TABLE public.publications TO authenticated;
GRANT ALL ON TABLE public.publications TO service_role;


--
-- Name: TABLE questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.questions TO anon;
GRANT ALL ON TABLE public.questions TO authenticated;
GRANT ALL ON TABLE public.questions TO service_role;


--
-- Name: TABLE quiz_attempt_answers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quiz_attempt_answers TO anon;
GRANT ALL ON TABLE public.quiz_attempt_answers TO authenticated;
GRANT ALL ON TABLE public.quiz_attempt_answers TO service_role;


--
-- Name: TABLE quiz_attempts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quiz_attempts TO anon;
GRANT ALL ON TABLE public.quiz_attempts TO authenticated;
GRANT ALL ON TABLE public.quiz_attempts TO service_role;


--
-- Name: TABLE quiz_questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quiz_questions TO anon;
GRANT ALL ON TABLE public.quiz_questions TO authenticated;
GRANT ALL ON TABLE public.quiz_questions TO service_role;


--
-- Name: TABLE quizzes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quizzes TO anon;
GRANT ALL ON TABLE public.quizzes TO authenticated;
GRANT ALL ON TABLE public.quizzes TO service_role;


--
-- Name: TABLE refund_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refund_requests TO anon;
GRANT ALL ON TABLE public.refund_requests TO authenticated;
GRANT ALL ON TABLE public.refund_requests TO service_role;


--
-- Name: TABLE registration_state; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.registration_state TO anon;
GRANT ALL ON TABLE public.registration_state TO authenticated;
GRANT ALL ON TABLE public.registration_state TO service_role;


--
-- Name: TABLE research_database_access; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.research_database_access TO anon;
GRANT ALL ON TABLE public.research_database_access TO authenticated;
GRANT ALL ON TABLE public.research_database_access TO service_role;


--
-- Name: TABLE research_grants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.research_grants TO anon;
GRANT ALL ON TABLE public.research_grants TO authenticated;
GRANT ALL ON TABLE public.research_grants TO service_role;


--
-- Name: TABLE research_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.research_requests TO anon;
GRANT ALL ON TABLE public.research_requests TO authenticated;
GRANT ALL ON TABLE public.research_requests TO service_role;


--
-- Name: TABLE revoked_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.revoked_tokens TO anon;
GRANT ALL ON TABLE public.revoked_tokens TO authenticated;
GRANT ALL ON TABLE public.revoked_tokens TO service_role;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.role_permissions TO anon;
GRANT ALL ON TABLE public.role_permissions TO authenticated;
GRANT ALL ON TABLE public.role_permissions TO service_role;


--
-- Name: TABLE room_bookings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.room_bookings TO anon;
GRANT ALL ON TABLE public.room_bookings TO authenticated;
GRANT ALL ON TABLE public.room_bookings TO service_role;


--
-- Name: TABLE rooms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rooms TO anon;
GRANT ALL ON TABLE public.rooms TO authenticated;
GRANT ALL ON TABLE public.rooms TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.schema_migrations TO anon;
GRANT ALL ON TABLE public.schema_migrations TO authenticated;
GRANT ALL ON TABLE public.schema_migrations TO service_role;


--
-- Name: TABLE scholarship_awards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.scholarship_awards TO anon;
GRANT ALL ON TABLE public.scholarship_awards TO authenticated;
GRANT ALL ON TABLE public.scholarship_awards TO service_role;


--
-- Name: TABLE security_incidents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.security_incidents TO anon;
GRANT ALL ON TABLE public.security_incidents TO authenticated;
GRANT ALL ON TABLE public.security_incidents TO service_role;


--
-- Name: TABLE security_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.security_logs TO anon;
GRANT ALL ON TABLE public.security_logs TO authenticated;
GRANT ALL ON TABLE public.security_logs TO service_role;


--
-- Name: TABLE semesters; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.semesters TO anon;
GRANT ALL ON TABLE public.semesters TO authenticated;
GRANT ALL ON TABLE public.semesters TO service_role;


--
-- Name: TABLE site_content; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_content TO anon;
GRANT ALL ON TABLE public.site_content TO authenticated;
GRANT ALL ON TABLE public.site_content TO service_role;


--
-- Name: TABLE sponsorships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sponsorships TO anon;
GRANT ALL ON TABLE public.sponsorships TO authenticated;
GRANT ALL ON TABLE public.sponsorships TO service_role;


--
-- Name: TABLE sso_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sso_config TO anon;
GRANT ALL ON TABLE public.sso_config TO authenticated;
GRANT ALL ON TABLE public.sso_config TO service_role;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sso_providers TO anon;
GRANT ALL ON TABLE public.sso_providers TO authenticated;
GRANT ALL ON TABLE public.sso_providers TO service_role;


--
-- Name: TABLE staff_contracts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.staff_contracts TO anon;
GRANT ALL ON TABLE public.staff_contracts TO authenticated;
GRANT ALL ON TABLE public.staff_contracts TO service_role;


--
-- Name: TABLE staff_performance_reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.staff_performance_reviews TO anon;
GRANT ALL ON TABLE public.staff_performance_reviews TO authenticated;
GRANT ALL ON TABLE public.staff_performance_reviews TO service_role;


--
-- Name: TABLE staff_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.staff_records TO anon;
GRANT ALL ON TABLE public.staff_records TO authenticated;
GRANT ALL ON TABLE public.staff_records TO service_role;


--
-- Name: TABLE student_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_documents TO anon;
GRANT ALL ON TABLE public.student_documents TO authenticated;
GRANT ALL ON TABLE public.student_documents TO service_role;


--
-- Name: TABLE student_profiles_extra; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_profiles_extra TO anon;
GRANT ALL ON TABLE public.student_profiles_extra TO authenticated;
GRANT ALL ON TABLE public.student_profiles_extra TO service_role;


--
-- Name: TABLE student_record_changes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_record_changes TO anon;
GRANT ALL ON TABLE public.student_record_changes TO authenticated;
GRANT ALL ON TABLE public.student_record_changes TO service_role;


--
-- Name: TABLE student_scholarships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_scholarships TO anon;
GRANT ALL ON TABLE public.student_scholarships TO authenticated;
GRANT ALL ON TABLE public.student_scholarships TO service_role;


--
-- Name: TABLE students; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.students TO anon;
GRANT ALL ON TABLE public.students TO authenticated;
GRANT ALL ON TABLE public.students TO service_role;


--
-- Name: TABLE support_desk_replies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_desk_replies TO anon;
GRANT ALL ON TABLE public.support_desk_replies TO authenticated;
GRANT ALL ON TABLE public.support_desk_replies TO service_role;


--
-- Name: TABLE support_desk_tickets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_desk_tickets TO anon;
GRANT ALL ON TABLE public.support_desk_tickets TO authenticated;
GRANT ALL ON TABLE public.support_desk_tickets TO service_role;


--
-- Name: TABLE support_ticket_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_ticket_messages TO anon;
GRANT ALL ON TABLE public.support_ticket_messages TO authenticated;
GRANT ALL ON TABLE public.support_ticket_messages TO service_role;


--
-- Name: TABLE support_tickets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_tickets TO anon;
GRANT ALL ON TABLE public.support_tickets TO authenticated;
GRANT ALL ON TABLE public.support_tickets TO service_role;


--
-- Name: TABLE system_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_settings TO anon;
GRANT ALL ON TABLE public.system_settings TO authenticated;
GRANT ALL ON TABLE public.system_settings TO service_role;


--
-- Name: TABLE ta_student_support_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ta_student_support_sessions TO anon;
GRANT ALL ON TABLE public.ta_student_support_sessions TO authenticated;
GRANT ALL ON TABLE public.ta_student_support_sessions TO service_role;


--
-- Name: TABLE teaching_assistant_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teaching_assistant_assignments TO anon;
GRANT ALL ON TABLE public.teaching_assistant_assignments TO authenticated;
GRANT ALL ON TABLE public.teaching_assistant_assignments TO service_role;


--
-- Name: TABLE teaching_loads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teaching_loads TO anon;
GRANT ALL ON TABLE public.teaching_loads TO authenticated;
GRANT ALL ON TABLE public.teaching_loads TO service_role;


--
-- Name: TABLE transcript_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transcript_requests TO anon;
GRANT ALL ON TABLE public.transcript_requests TO authenticated;
GRANT ALL ON TABLE public.transcript_requests TO service_role;


--
-- Name: TABLE transfer_credits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transfer_credits TO anon;
GRANT ALL ON TABLE public.transfer_credits TO authenticated;
GRANT ALL ON TABLE public.transfer_credits TO service_role;


--
-- Name: TABLE user_feature_overrides; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_feature_overrides TO anon;
GRANT ALL ON TABLE public.user_feature_overrides TO authenticated;
GRANT ALL ON TABLE public.user_feature_overrides TO service_role;


--
-- Name: TABLE user_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_permissions TO anon;
GRANT ALL ON TABLE public.user_permissions TO authenticated;
GRANT ALL ON TABLE public.user_permissions TO service_role;


--
-- Name: SEQUENCE user_permissions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_permissions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_permissions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_permissions_id_seq TO service_role;


--
-- Name: TABLE user_role_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_role_history TO anon;
GRANT ALL ON TABLE public.user_role_history TO authenticated;
GRANT ALL ON TABLE public.user_role_history TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE visitor_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.visitor_logs TO anon;
GRANT ALL ON TABLE public.visitor_logs TO authenticated;
GRANT ALL ON TABLE public.visitor_logs TO service_role;


--
-- Name: TABLE welfare_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.welfare_requests TO anon;
GRANT ALL ON TABLE public.welfare_requests TO authenticated;
GRANT ALL ON TABLE public.welfare_requests TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict gbZ2vQkVZkurhFVC6A8nYdoe4c4GGQPJe6GBPU0flpEV1k25IpG1oopFdeobG4S

