# SessionIQ – Business Context

## What Is SessionIQ?

SessionIQ is a Customer Engagement platform that handles all of the overhead surrounding customer sessions — coordination, documentation, and analysis — so that teams can focus on delivering high-quality sessions and improving their programs rather than managing disconnected, tedious processes.

The primary focus is **enablement sessions**: training, onboarding, troubleshooting, trial, and demonstration sessions with customers. Most teams are great at delivery — SessionIQ handles everything around it.

---

## Who Is It For?

SessionIQ serves two distinct users within the same organization:

**Individual Contributors** — people who spend most of their time on calls with customers. This includes:
- Sales Engineers
- Onboarding Specialists
- Customer Success Managers
- Technical Account Managers
- Solutions Engineers
- Professional Services Consultants

Their goal: less process overhead, more time on delivery and relationships.

**Program Leaders / Managers** — people responsible for team performance, program health, and business impact. They need visibility into individual contributor performance, account health, portfolio health, and measurable outcomes.

---

## What Problem Does It Solve?

Teams are no longer evaluated just on delivery quality — they must now **prove business impact**. At the same time, sessions surface valuable insights (account signals, product feedback) that take significant time to distill and distribute.

Today, a single session requires operating across a fragmented tech stack:
- **Microsoft** (Teams, Outlook, SharePoint) — for communication and coordination
- **Salesforce** — for CRM account linking
- **NiceReply** — for feedback/CSAT
- **ProductBoard** — for product insights
- **Asana** — for task tracking

SessionIQ consolidates all of this. **Coordinate. Document. Measure. All in one place.**

---

## Core Features

### 1. Session Coordination
- **Session Types & Templates** — reusable session configurations with duration, email templates (invitation, reminder, follow-up with offset/delay settings), and feedback form associations
  - Email Template Editor with plain-text editing and dynamic tokens: `session_title`, `session_date`, `presenter_name`, `feedback_link`, `account_name`, `session_type`, `session_attributes`
- **Session Management** — full lifecycle management including attendee lists (internal + external), date/time selection, status tracking (Scheduled → Delivered → Cancelled), CRM account linking, and session editing with email update tracking
- **AI-Powered Insights** — transcript pulling with AI analysis to surface commercial signals and product feedback, with integrations to push findings into Salesforce and ProductBoard
- **Project Layer** — grouping sessions into larger project buckets (e.g. Onboarding, Pre-Sales Trial, Post-Sales Expansion)

### 2. Reporting & Analytics
- Home dashboard: total sessions, sessions this month, avg feedback score, active presenters, upcoming sessions, recent feedback
- Presenter analytics, account analytics, session type analytics
- Session Tracker (list view with filtering)
- CRM push capability — surface session data at the account level in Salesforce/HubSpot

### 3. Calendar
- Month, week, and work week views (custom Tailwind grid — no external library)
- Click-to-edit session drawer
- Session status color coding
- Today button + navigation arrows

### 4. Staff Management
- User list with search
- Role assignment: ADMIN, PRESENTER, VIEWER
- Permission matrix

### 5. Integrations Dashboard
- **CRMs:** Salesforce, HubSpot — account assignment, ARR/segment data for analysis
- **Email & Calendar:** Microsoft (Entra/Teams/Outlook), Google (Calendar/Meet) — invites, staff management, calendar sync
- Easy-to-use setup and configuration UI

---

## Where We Are

- A Version 1 proof-of-concept was built locally
- The real application is now being built fresh with the proper stack
- Current state: foundation is set up, no features built yet

**Tech Stack:**
- Framework: Next.js 15 (App Router, TypeScript)
- Styling: Tailwind CSS
- Database & Auth: Supabase
- Hosting: Vercel
- Version Control: GitHub
- Editor: Cursor

---

## What Success Looks Like in 12 Months

1. **Internal deployment at Maltego** — SessionIQ is fully in use within the current organization, meaning it is enterprise-ready and maintains compliance with SOC II and ISO 27001 certifications
2. **External pilots** — the product is being piloted in other organizations, requiring live integrations with Salesforce, HubSpot, Microsoft, Google, and Zoom

---

## Founder Context

- Ryan is a non-technical founder building this product
- He is learning development as he goes — explanations of "why" matter as much as "what"
- The goal is to build a real, sellable product, not just a prototype
- He is currently an employee at Maltego, making that the first target customer

## V1 Learnings

General

V1 is nice, but the UI is very generic and bland. I want to refine this and make the product feel unique and engaging. There are some design elements that are not perfect, like how close the section headers are to the left-side menu. Overall, though, I find the V1 UI easy to use and functional.

Home

This screen should be functional and also tell a story. It is currently designed as a "Team View," with a comprehensive overview. However, this would also be valuable as a "personal view," where this dashboard is focused on the currently signed-in user, reflecting similar widgets and statistics that are specific to that user (like their upcoming sessions, average CSAT, etc.)

Calendar

I like the V1 state. It is clean. The session view is also nice here.

Session Templates

This section works well. We don't need to track the number of this type of session delivered or upcoming in this section. That can be done in analytics if needed. There also doesn't need to be a Staff option here. Staff can be managed in the Staff section and during actual session creation. The email template creation is good, but I'd like the editor to be better. Perhaps this could be a pop-up for each email type (invitation, reminder, follow-up) that feels more robust.

Session Tracker

This section is really solid already. The design needs to be updated once we nail that down, but the functionality is strong.

Staff

This section is strong in the V1. No need for the Sync with Microsoft 365 button. This should be done in the Integrations section.

Surveys

This section is functional, but a bit weak. It should blow tools like NiceReply out of the water. Invest more time here.

Integrations

The V1 looks good, but very little time has been spent here. This will need work as we understand how this will actually work in practice.

Analytics

V1 looks fine. Additional work to be done here.

New Session

This is the section where a new session is created. This looks good overall, but what is critical is that this links to accounts in the CRM and that this allows the user to send internal and external invites to the attendees.