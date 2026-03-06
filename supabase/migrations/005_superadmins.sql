-- Superadmins table: SessionIQ operators who provision organizations
-- and manage the platform. Conceptually separate from org roles.
--
-- WHY a separate table instead of a boolean on user_profiles:
-- 1. RLS policies can reference it directly in subqueries
-- 2. Superadmin status is explicitly queryable and auditable
-- 3. No coupling to a profile table that may change shape later

CREATE TABLE public.superadmins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read the superadmin list
CREATE POLICY "Superadmins can read superadmin list"
  ON public.superadmins FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.superadmins)
  );
