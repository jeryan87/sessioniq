-- Invitations table: the mechanism for bringing new users into the system.
-- Every user enters through an invitation — there is no self-registration.
--
-- Flow:
-- 1. Superadmin or Org Admin creates an invitation (org_id + email + role)
-- 2. A unique token is generated and included in the invite URL
-- 3. Invited person clicks the link, creates an account (or joins if they
--    already have one), and gets linked to the organization
-- 4. Invitation status changes from 'pending' to 'accepted'

CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.staff_role NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

-- Prevent duplicate pending invitations to the same email for the same org.
-- Partial unique index: only blocks duplicates when status = 'pending'.
-- A user can have an expired invitation and receive a new one without conflict.
CREATE UNIQUE INDEX idx_invitations_pending_unique
  ON public.invitations(organization_id, email)
  WHERE (status = 'pending');

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Indexes for common query patterns
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_org_id ON public.invitations(organization_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
