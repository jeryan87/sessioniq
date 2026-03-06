import { createAdminClient } from '@/app/lib/supabase/admin'
import { CreateOrgForm } from '@/app/components/admin/create-org-form'
import { OrgList } from '@/app/components/admin/org-list'

/**
 * Organization management page for superadmins.
 *
 * WHY: Superadmins need to create organizations and see the full list.
 * The CreateOrgForm calls a server action; the OrgList displays existing orgs.
 */
export default async function OrganizationsPage() {
  const admin = createAdminClient()

  const { data: organizations } = await admin
    .from('organizations')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">
          Organizations
        </h2>
      </div>

      <div className="mt-6">
        <CreateOrgForm />
      </div>

      <div className="mt-8">
        <OrgList organizations={organizations ?? []} />
      </div>
    </div>
  )
}
