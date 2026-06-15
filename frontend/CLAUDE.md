# FE Working Notes

Use this frontend as the source of truth for the enterprise asset management UI.

## Core rules

- Work inside `frontend/`.
- Prefer `src/api/client.js` and `src/api/*` for new API work.
- Treat `src/services/*` as legacy compatibility unless you are editing the OTP login / reset-password flow.
- Keep the admin and employee portals separated.
- Do not change localStorage keys without checking all consumers.

## Important keys

- Auth token: `eam_access_token`
- Current user: `eam_current_user`
- Theme: `eam_theme`
- Locale: `eam_locale`

## Important files

- `src/App.jsx`
- `src/routes/AppRoutes.jsx`
- `src/auth/AuthContext.jsx`
- `src/api/client.js`
- `src/api/notifications.js`
- `src/notifications/NotificationsContext.jsx`
- `src/hooks/useTheme.jsx`
- `src/hooks/useLanguage.jsx`
- `tests/ui-smoke.spec.js`

## Workflow

1. Read the relevant page, route, and API module before editing.
2. Preserve protected route behavior for `ADMIN` and `USER`.
3. Preserve notification stream behavior and toast handling.
4. Run `npm run lint` after changes.
5. Run `npm run test:ui` for any auth, routing, or settings changes.

## Notes

- Login and forgot-password flows still use some code in `src/services/auth.service.js`.
- The language layer mutates text nodes and attributes at runtime when locale is `en`.
- Theme is applied via the `dark` class on the document root.

