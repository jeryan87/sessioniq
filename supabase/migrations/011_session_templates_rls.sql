-- Row Level Security policies for session_templates.
--
-- Pattern mirrors the staff table:
-- - Members can read templates in their own org
-- - Org Admins can create/update/delete templates in their own org
-- - Superadmins have full access

-- ============================================================
-- SESSION_TEMPLATES
-- ============================================================

-- All org members can view templates
CREATE POLICY "Members can view org session templates"
  ON public.session_templates FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Org admins can create templates
CREATE POLICY "Org admins can insert session templates"
  ON public.session_templates FOR INSERT
  WITH CHECK (public.user_is_org_admin(organization_id));

-- Org admins can update templates
CREATE POLICY "Org admins can update session templates"
  ON public.session_templates FOR UPDATE
  USING (public.user_is_org_admin(organization_id));

-- Org admins can delete templates
CREATE POLICY "Org admins can delete session templates"
  ON public.session_templates FOR DELETE
  USING (public.user_is_org_admin(organization_id));

-- Superadmins have full access
CREATE POLICY "Superadmins have full access to session templates"
  ON public.session_templates FOR ALL
  USING (public.is_superadmin());
