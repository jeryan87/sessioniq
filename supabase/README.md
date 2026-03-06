# Supabase Migrations

## How to Apply

### Option A: Supabase Dashboard (recommended for now)
1. Go to Supabase Dashboard > SQL Editor
2. Run each file in `supabase/migrations/` in numerical order (001 through 009)
3. After running all migrations, seed the first superadmin (see below)

### Option B: Supabase CLI
```bash
npx supabase db push
```

## Seeding the First Superadmin

After all migrations are applied:

1. Log in to the app with your account
2. Find your user UUID in Supabase Dashboard > Authentication > Users
3. Run in SQL Editor:
```sql
INSERT INTO public.superadmins (user_id) VALUES ('YOUR-UUID-HERE');
```

## Tables

| Table | Purpose |
|---|---|
| `organizations` | Tenant organizations (one per customer company) |
| `organization_members` | Links auth users to orgs with a role (access control) |
| `staff` | Staff profiles within orgs (can exist before user has an account) |
| `superadmins` | SessionIQ operators (platform-level access) |
| `invitations` | Pending/accepted/expired/revoked invitations |

## Enums

| Enum | Values |
|---|---|
| `staff_role` | ADMIN, PRESENTER, VIEWER |
| `invitation_status` | pending, accepted, expired, revoked |

## Key Design Decisions

- **No self-registration.** Users only enter through invitations.
- **Superadmins** are separate from org roles — stored in their own table.
- **Staff records** can exist before a user creates an account (nullable `user_id`).
- **RLS** is enabled on all tables. Superadmins bypass all org-level restrictions.
- **`validate_invitation()`** uses SECURITY DEFINER so unauthenticated users can validate their invitation token.
