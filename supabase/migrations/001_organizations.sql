-- Organizations table: the top-level tenant unit
-- Each customer company gets one organization, created by a Superadmin.

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Index for slug lookups (future: subdomain or path-based routing)
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
