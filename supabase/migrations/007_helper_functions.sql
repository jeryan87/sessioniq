-- Helper functions used by RLS policies and application code.
-- All use SECURITY DEFINER so they run as the function owner,
-- not the calling user. This is necessary because RLS policies
-- need to query tables that the user may not have direct access to.
--
-- NOTE: 009_security_hardening.sql re-creates these with SET search_path = public.
-- This file is kept as-is for migration history; the 009 migration is the
-- authoritative version.

-- ==========================================================
-- Get all organization IDs the current user belongs to.
-- Used in RLS policies: "organization_id IN (SELECT user_organization_ids())"
-- ==========================================================
CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid();
$$;

-- ==========================================================
-- Check if the current user is an admin of a specific org.
-- Used in RLS policies for write operations on staff, members, invitations.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.user_is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND role = 'ADMIN'
  );
$$;

-- ==========================================================
-- Check if the current user is a superadmin.
-- Used in RLS policies to grant superadmins full access.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.superadmins
    WHERE user_id = auth.uid()
  );
$$;

-- ==========================================================
-- Validate an invitation token. Callable by anon key.
--
-- Uses SECURITY DEFINER because the person clicking an invitation
-- link is unauthenticated — they have no auth.uid() and no RLS
-- policies would grant them access to the invitations table.
--
-- Returns a JSON object with invitation details or an error.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.validate_invitation(invite_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv record;
BEGIN
  SELECT
    i.id,
    i.organization_id,
    i.email,
    i.role,
    i.status,
    i.expires_at,
    o.name AS organization_name
  INTO inv
  FROM public.invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = invite_token;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid invitation token');
  END IF;

  IF inv.status != 'pending' THEN
    RETURN json_build_object('valid', false, 'error',
      format('This invitation has already been %s', inv.status));
  END IF;

  IF inv.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'This invitation has expired');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'id', inv.id,
    'organization_id', inv.organization_id,
    'organization_name', inv.organization_name,
    'email', inv.email,
    'role', inv.role,
    'expires_at', inv.expires_at
  );
END;
$$;

-- Grant execute to both authenticated and anonymous users
-- (anonymous needs it for the invitation acceptance flow)
GRANT EXECUTE ON FUNCTION public.validate_invitation(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invitation(uuid) TO authenticated;
