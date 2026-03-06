-- Staff role enum shared by organization_members and staff tables.
-- ADMIN: full org management (invite users, manage staff, settings)
-- PRESENTER: can run and manage sessions
-- VIEWER: read-only access to sessions and reports

CREATE TYPE public.staff_role AS ENUM ('ADMIN', 'PRESENTER', 'VIEWER');
