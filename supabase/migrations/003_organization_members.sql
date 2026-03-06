-- Organization members: the access-control join table linking auth users
-- to organizations. This is the source of truth for "who can access what."
-- A user can belong to multiple orgs (e.g., a consultant).

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL DEFAULT 'VIEWER',
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Index for the most common query: "what orgs does this user belong to?"
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
