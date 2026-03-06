-- Row Level Security policies for all tables.
-- These define the security boundary for the entire multi-tenant system.
--
-- Pattern:
-- - Members can read data in their own org
-- - Org Admins can write data in their own org
-- - Superadmins have full access to everything
-- - Users can update their own staff record (phone, job title, etc.)

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

-- Members can see their own orgs
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT public.user_organization_ids()));

-- Superadmins can do everything with organizations
CREATE POLICY "Superadmins have full access to organizations"
  ON public.organizations FOR ALL
  USING (public.is_superadmin());

-- ============================================================
-- ORGANIZATION_MEMBERS
-- ============================================================

-- Users can see their own membership rows
CREATE POLICY "Users can view their own memberships"
  ON public.organization_members FOR SELECT
  USING (user_id = auth.uid());

-- Members can see other members in their orgs
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Org admins can manage members in their org
CREATE POLICY "Org admins can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.user_is_org_admin(organization_id));

CREATE POLICY "Org admins can update members"
  ON public.organization_members FOR UPDATE
  USING (public.user_is_org_admin(organization_id));

CREATE POLICY "Org admins can delete members"
  ON public.organization_members FOR DELETE
  USING (public.user_is_org_admin(organization_id));

-- Superadmins can do everything with members
CREATE POLICY "Superadmins have full access to org members"
  ON public.organization_members FOR ALL
  USING (public.is_superadmin());

-- ============================================================
-- STAFF
-- ============================================================

-- Members can view staff in their orgs
CREATE POLICY "Members can view org staff"
  ON public.staff FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Org admins can manage staff in their org
CREATE POLICY "Org admins can insert staff"
  ON public.staff FOR INSERT
  WITH CHECK (public.user_is_org_admin(organization_id));

CREATE POLICY "Org admins can update staff"
  ON public.staff FOR UPDATE
  USING (public.user_is_org_admin(organization_id));

CREATE POLICY "Org admins can delete staff"
  ON public.staff FOR DELETE
  USING (public.user_is_org_admin(organization_id));

-- Users can update their own staff record (e.g., phone, job title)
CREATE POLICY "Users can update own staff record"
  ON public.staff FOR UPDATE
  USING (user_id = auth.uid());

-- Superadmins have full access to staff
CREATE POLICY "Superadmins have full access to staff"
  ON public.staff FOR ALL
  USING (public.is_superadmin());

-- ============================================================
-- INVITATIONS
-- ============================================================

-- Org admins can view invitations for their org
CREATE POLICY "Org admins can view org invitations"
  ON public.invitations FOR SELECT
  USING (public.user_is_org_admin(organization_id));

-- Org admins can create invitations for their org
CREATE POLICY "Org admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.user_is_org_admin(organization_id));

-- Org admins can update invitations (e.g., revoke)
CREATE POLICY "Org admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (public.user_is_org_admin(organization_id));

-- Superadmins have full access to invitations
CREATE POLICY "Superadmins have full access to invitations"
  ON public.invitations FOR ALL
  USING (public.is_superadmin());

-- NOTE: Invitation acceptance uses the service_role key via the admin
-- client (src/app/lib/supabase/admin.ts) because the user accepting
-- the invitation is either unauthenticated (new user) or not yet a
-- member of any org. The validate_invitation() function uses SECURITY
-- DEFINER to bypass RLS for the token validation step.
