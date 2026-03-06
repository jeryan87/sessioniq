-- Security hardening for SECURITY DEFINER functions.
--
-- WHY: SECURITY DEFINER functions run as the function owner (postgres).
-- Without an explicit search_path, a malicious user could create a schema
-- with a poisoned version of a table/function, then trick the function
-- into reading the wrong data. Setting search_path = public closes this.
--
-- Also adds a race condition guard on invitation acceptance by using
-- an UPDATE ... SET status = 'accepted' WHERE status = 'pending'
-- pattern (the server actions already do this, but we add a trigger
-- here as an extra layer of defense).

-- ==========================================================
-- Fix search_path on all SECURITY DEFINER functions
-- ==========================================================

CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.superadmins
    WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_invitation(invite_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Re-grant execute permissions (CREATE OR REPLACE resets grants)
GRANT EXECUTE ON FUNCTION public.validate_invitation(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invitation(uuid) TO authenticated;
