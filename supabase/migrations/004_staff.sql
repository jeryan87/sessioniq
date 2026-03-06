-- Staff table: profile data for people in an organization.
-- Separate from auth identities because:
-- 1. A staff record can exist BEFORE the person accepts their invitation
--    (user_id is NULL until they create an account)
-- 2. If an auth user is deleted, we keep the staff profile for historical
--    data (ON DELETE SET NULL)
-- 3. Staff records hold business data (job title, phone, etc.) that
--    doesn't belong in auth.users

CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  role public.staff_role NOT NULL DEFAULT 'VIEWER',
  job_title text,
  phone text,
  office_location text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organization_id, email)
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_staff_org_id ON public.staff(organization_id);
CREATE INDEX idx_staff_user_id ON public.staff(user_id);
CREATE INDEX idx_staff_email ON public.staff(email);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
