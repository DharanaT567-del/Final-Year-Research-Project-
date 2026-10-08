# Repository guidance for coding agents

## Project layout

- `apps/mobile/` is a React Native JavaScript app. Its entry point is `index.js`; `App.js` mounts the navigation and authentication providers. Screens, navigation, API access, and session state live under `src/`.
- `apps/apigateway/` is a Java 17 Spring Boot API. Controllers, security and Firebase configuration, persistence, and JWT handling live under `src/main/java/com/naada/apigateway/`.
- `docs/` and `infra/` are reserved for project documentation and infrastructure work. Check their contents before adding files there.

## Working conventions

- Keep changes scoped to the requested feature or fix. The working tree may already contain user changes, including generated native projects and dependencies; inspect `git status` and do not overwrite or clean them.
- Do not edit `apps/mobile/node_modules/` or generated build output. Update package manifests or source files instead.
- Keep the mobile and API authentication contract aligned. The mobile client calls `/api/auth` through `src/api/axiosClient.js` and stores `springToken` and `userData`; login also consumes `firebaseToken` when available.
- Treat credentials and tokens as secrets. Do not print, copy into documentation, or commit local Firebase service account files, signing keys, or database passwords. Use local configuration or environment variables for new secrets.
- Preserve the existing Java and JavaScript styles in the files you touch. Add focused tests when changing behavior that can be tested.

## Validation

- For API changes, run `./mvnw.cmd test` from `apps/apigateway/` on Windows (or `./mvnw test` on Unix). The Spring context test may require local database and Firebase configuration; report those prerequisites if they prevent it from running.
- For mobile changes, run the relevant `npm run android`, `npm run ios`, or `npm start` command from `apps/mobile/` when the environment supports it. The package currently has no test or lint script, so do not claim those checks ran.
- Review `git diff` and `git status` before finishing, and report which checks ran and any blockers.
