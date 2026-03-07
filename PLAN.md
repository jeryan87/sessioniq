# Staff Management — Implementation Plan

## Overview

Build the staff management feature following the list-detail pattern visible in both the Microsoft Bookings and SessionIQ v1 screenshots: a staff list on the left with search and role badges, and a detail/edit panel on the right.

### Layout: Sidebar navigation upgrade

Before building staff pages, upgrade the `(app)/layout.tsx` from its current header-only design to a **sidebar + header layout** matching the v1 screenshot. This gives us the left nav with Home, Staff, and future items (Calendar, Sessions, etc.).

## Files to Create/Modify

### 1. Upgrade App Layout — sidebar navigation
**Modify:** `src/app/(app)/layout.tsx`
- Replace header-only layout with a sidebar + top header
- Sidebar nav items: Home (`/`), Staff (`/staff`)
- Sidebar shows "SessionIQ" brand at top
- Top header shows org name, user email, Admin badge (if superadmin), logout
- Sidebar highlights active route

### 2. Staff Server Actions
**Create:** `src/app/lib/actions/staff.ts`
- `getStaffList(organizationId)` — fetch all staff in org (server component can query directly, but a shared action is cleaner for reuse)
- `updateStaffMember({ staffId, name, role, jobTitle, phone, officeLocation })` — admin updates a staff member's profile + syncs `organization_members.role` if role changed
- `removeStaffMember(staffId)` — admin removes staff from org (deletes staff row + organization_members row)
- `updateMyProfile({ name, jobTitle, phone, officeLocation })` — self-service profile update (uses authenticated user's supabase client, leveraging the existing RLS policy)

Authorization:
- `updateStaffMember` and `removeStaffMember`: require `activeRole === 'ADMIN'` or superadmin
- `updateMyProfile`: any authenticated user (RLS handles it)
- Role sync: when admin changes `staff.role`, also update `organization_members.role` for the same user+org (if `user_id` is set)

### 3. Staff List Page (master-detail layout)
**Create:** `src/app/(app)/staff/page.tsx`
- Server component that fetches staff list for the user's active org
- Renders the `StaffPageClient` component with the staff data
- Guards: redirect to `/` if user has no active org

### 4. Staff Page Client Component (master-detail)
**Create:** `src/app/components/staff/staff-page-client.tsx`
- Client component managing the list-detail state
- **Left panel:** Staff list with search filter, role badges (color-coded), "My profile" section at top (like Bookings screenshot)
- **Right panel:** Selected staff member's detail/edit view
- Clicking a staff member in the list shows their details on the right
- Default: show the current user's own profile selected

### 5. Staff List Component
**Create:** `src/app/components/staff/staff-list.tsx`
- Client component receiving staff array as prop
- Search input at top (filters by name/email client-side)
- "My profile" section showing current user, separated from "Other staff"
- Each row: avatar placeholder (initials), name, email, role badge
- Role badges: Admin (teal), Presenter (orange/accent), Viewer (gray)
- Active item highlighted with left border or background
- Role filter dropdown ("All roles" / Admin / Presenter / Viewer)

### 6. Staff Detail Panel
**Create:** `src/app/components/staff/staff-detail.tsx`
- Shows selected staff member's full info
- Two modes based on permissions:
  - **Admin viewing any member OR user viewing themselves:** Editable form (name, role [admin only], job title, phone, office location)
  - **Non-admin viewing another member:** Read-only view
- "Save changes" button calls `updateStaffMember` (admin) or `updateMyProfile` (self)
- Email shown but read-only (cannot be changed)
- Role dropdown only visible/enabled for admins (and not on their own record — can't demote yourself)
- **Danger zone** at bottom (admin only, not on self): "Remove staff member" with confirmation

### 7. Profile Page (self-service shortcut)
**Create:** `src/app/(app)/profile/page.tsx`
- Simple page that fetches the current user's staff record and renders an edit form
- Uses `updateMyProfile` server action
- Fields: name, job title, phone, office location
- This gives users a direct link to edit their own info without going through the staff list

## Architecture Decisions

### Why master-detail instead of separate pages?
Both reference screenshots use this pattern. It keeps context (the staff list) visible while editing, reduces navigation clicks, and feels more like an app than a website.

### Why client-side search filtering?
For MVP with small team sizes (< 100 staff per org), client-side filtering is instant and avoids server round-trips. We fetch all staff once and filter in the browser.

### Role sync between staff and organization_members
When an admin changes a staff member's role, we update BOTH tables in a single server action using the admin client. The `staff.role` is the display/business role; `organization_members.role` is what RLS policies check for access control. They must stay in sync.

### Self-edit via RLS
The existing RLS policy `"Users can update own staff record"` already allows `UPDATE WHERE user_id = auth.uid()`. For self-edits, we use the regular Supabase client (not admin), so RLS naturally enforces that users can only edit their own record.

## Implementation Order

1. **App layout sidebar upgrade** — sets the stage for all future pages
2. **Server actions** (`staff.ts`) — the backend logic
3. **Staff list page + client component** — the master-detail shell
4. **Staff list component** — left panel with search and role badges
5. **Staff detail panel** — right panel with edit form
6. **Profile page** — self-service shortcut
7. **Build & test**
