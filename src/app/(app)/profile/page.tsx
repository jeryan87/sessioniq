import { getUserContext } from '@/app/lib/auth'
import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Profile page — redirects to the staff detail view for the current user.
 *
 * WHY: In the v1 design, profile editing happens in the staff detail panel's
 * Contact tab. This page finds the user's staff record and redirects to
 * /staff?selected=<id> so they see their own profile in the master-detail
 * layout with full editing capabilities.
 */
export default async function ProfilePage() {
  const ctx = await getUserContext()
  if (!ctx) redirect('/login')

  const activeOrgId = ctx.activeOrganizationId
  if (!activeOrgId) redirect('/')

  const supabase = await createClient()

  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id')
    .eq('organization_id', activeOrgId)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  if (staffRecord) {
    redirect(`/staff?selected=${staffRecord.id}`)
  }

  // Fallback: no staff record found — redirect to staff page
  redirect('/staff')
}
