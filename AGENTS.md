<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SECOM ATLAS

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase
- GLPI integration

## Product Direction

SECOM ATLAS must evolve into the best technical CRM for service companies:
fast dispatch, reliable ticket history, strong customer context, mobile-first field work,
and safe integrations with GLPI.

## Engineering Rules

- Do not introduce `any` in new code. Prefer explicit domain types, narrow `unknown`, or typed DTOs.
- Mobile first: every new screen and workflow must be usable on phone before desktop polish.
- Do not break existing components or GLPI compatibility.
- Prefer reusable components and shared services over duplicating UI or query logic.
- Do not modify database schema without explicit user authorization.
- Keep API routes least-privilege: validate the user token and role before using service-role clients.
- Keep changes small, verifiable, and reversible.
- Preserve tenant isolation in every query and mutation.
