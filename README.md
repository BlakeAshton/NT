# NT

Multi-tenant Discord moderation bot and management dashboard. **Foundation release (v0.1), not a finished MEE6/ProBot replacement.**

## Requirements
- Node.js 24.17+ and npm
- Docker / Docker Compose (or your own PostgreSQL)
- Discord developer application

## Setup
1. Copy `.env.example` to `.env` and set the Discord bot token, application ID, OAuth client secret, and a long random `SESSION_SECRET`. Never commit `.env`.
2. In Discord Developer Portal enable **Server Members Intent**, enable public installation and add `http://localhost:3000/api/auth/callback` to OAuth2 redirects. Configure Guild Install with `bot` and `applications.commands` scopes and permissions Ban Members, Kick Members, Moderate Members, View Channels, Send Messages. Avoid Administrator.
3. Run `docker compose up -d`.
4. Run `npm install` then `npm run db:generate` and `npm run db:migrate` (enter a migration name when prompted).
5. Run `npm run register -w @sentinel/bot`. Set `DEV_GUILD_ID` for rapid test-guild registration; omit it for global registration.
6. In two terminals run `npm run dev:bot` and `npm run dev:web`. Visit http://localhost:3000.
7. Invite the bot using the installation URL generated in the Discord Developer Portal, with only the permissions required for enabled features.

## Features shipped
- Guild-aware `/ping`, `/ban`, `/kick`, `/timeout`, `/warn`, `/cases`
- PostgreSQL moderation cases, per-guild settings and security event history
- Guild join-rate alert detection (no automatic punishments)
- Discord OAuth2 login with state validation and signed HttpOnly session cookie
- Dashboard server list filtered by Manage Guild/Administrator/ownership
- Server settings API with runtime guild permission checks and Zod validation

## Known limitations before public production launch
- This is a development-ready foundation, not an audited production deployment.
- Dashboard must also verify that the bot is actually installed in a guild before accepting settings (currently validates user's Manage Guild permission only).
- OAuth access token is stored in a signed (not encrypted) cookie; replace with server-side encrypted session storage before production.
- Add CSRF protection / Origin checks for settings updates, API rate limiting, and OAuth refresh-token handling.
- Implement persistent/distributed anti-raid counters for horizontal scaling; current counters are process-local.
- Add structured audit logs, metrics, health checks, automated tests, CI, backups, reverse proxy HTTPS, and deployment secrets management.
- Add command confirmation for destructive operations, moderation reason redaction, retention policies and privacy documentation.
- Discord rate limits, permission hierarchy and privileged-intent approval requirements apply.
