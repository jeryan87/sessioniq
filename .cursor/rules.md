# SessionIQ – Project Context & Rules

## Who I Am
I am a non-technical founder building this product. I am learning as I go.
Always explain what you are doing and why, not just what to type.
Assume I may not understand technical terms unless I have explicitly shown I do.

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (using new publishable/secret key format, not legacy anon/service_role)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Version Control:** GitHub (default branch is called `master`, not `main`)
- **Editor:** Cursor

## Project Structure
- Source files live in the `src/` directory
- Supabase client is initialized in `src/app/lib/supabase.ts`
- Environment variables are stored in `.env.local` (never commit this file)

## Environment Variables
The following environment variables are required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
These are stored in `.env.local` locally and in Vercel's environment variable settings for production.

## Workflow
- Code is written locally in Cursor and tested at localhost:3000
- Changes are committed and pushed to GitHub using Git
- Vercel automatically deploys on every push to `master`
- Preview deployments are available for all other branches

## Git Commit Habits
- Always commit before trying anything experimental
- Use clear, descriptive commit messages
- Run `git status` to check what is staged before committing
- Never commit `.env.local`

## Code Style Preferences
- Keep code simple and readable over clever
- Add comments explaining what code does, not just what it is
- Prefer explicit over implicit — clarity matters more than brevity

## When Helping Me
- Walk me through changes step by step
- Tell me which file to edit and where in the file
- Explain why a change is being made, not just what to change
- If something could break my setup, warn me first
- If there are multiple approaches, tell me the tradeoffs