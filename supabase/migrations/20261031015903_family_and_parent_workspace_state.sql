CREATE TABLE IF NOT EXISTS public.family_shared_state (
  family_id uuid PRIMARY KEY REFERENCES public.families(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parent_private_state (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_private_state_family_idx
  ON public.parent_private_state(family_id);

ALTER TABLE public.family_shared_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_private_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='family_shared_state' AND policyname='family_shared_state_select_own_family') THEN
    CREATE POLICY family_shared_state_select_own_family ON public.family_shared_state
      FOR SELECT TO authenticated USING (family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='family_shared_state' AND policyname='family_shared_state_insert_own_family') THEN
    CREATE POLICY family_shared_state_insert_own_family ON public.family_shared_state
      FOR INSERT TO authenticated WITH CHECK (family_id = private.current_user_family_id() AND updated_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='family_shared_state' AND policyname='family_shared_state_update_own_family') THEN
    CREATE POLICY family_shared_state_update_own_family ON public.family_shared_state
      FOR UPDATE TO authenticated USING (family_id = private.current_user_family_id())
      WITH CHECK (family_id = private.current_user_family_id() AND updated_by = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_private_state' AND policyname='parent_private_state_select_self') THEN
    CREATE POLICY parent_private_state_select_self ON public.parent_private_state
      FOR SELECT TO authenticated USING (auth_user_id = auth.uid() AND family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_private_state' AND policyname='parent_private_state_insert_self') THEN
    CREATE POLICY parent_private_state_insert_self ON public.parent_private_state
      FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid() AND family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_private_state' AND policyname='parent_private_state_update_self') THEN
    CREATE POLICY parent_private_state_update_self ON public.parent_private_state
      FOR UPDATE TO authenticated USING (auth_user_id = auth.uid() AND family_id = private.current_user_family_id())
      WITH CHECK (auth_user_id = auth.uid() AND family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_private_state' AND policyname='parent_private_state_delete_self') THEN
    CREATE POLICY parent_private_state_delete_self ON public.parent_private_state
      FOR DELETE TO authenticated USING (auth_user_id = auth.uid() AND family_id = private.current_user_family_id());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.family_shared_state TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_private_state TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='family_shared_state') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.family_shared_state;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='parent_private_state') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_private_state;
    END IF;
  END IF;
END $$;
