# CLAUDE.md — Project Intelligence

## What This Project Is

**Naada / BeatAcademy** is a Final-Year Research Project — a mobile-first platform for learning Sinhala Classical music. It combines a **React Native** front-end with a **Spring Boot** API gateway, backed by **MySQL** and **Firebase** for dual-token authentication. The app features AI-powered tools (audio engine, smart lyrics) and gamification (streaks, learning progress).

> The brand name appears as **"Naada"** on the login screen and **"BeatAcademy"** on the home screen header.

---

## Repository Map

```
Final-Year-Research-Project-/
├── apps/
│   ├── mobile/           # React Native (JS, RN 0.87, React 19)
│   │   ├── App.js        # Root: wraps <AuthProvider> → <AppNavigator>
│   │   ├── index.js      # Entry point (AppRegistry)
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── axiosClient.js    # Axios instance, bearer interceptor
│   │   │   ├── context/
│   │   │   │   └── AuthContext.js     # login/logout/deleteAccount + session
│   │   │   ├── navigation/
│   │   │   │   └── AppNavigator.js    # Native-stack: auth vs main stacks
│   │   │   └── screens/
│   │   │       ├── LoginScreen.js
│   │   │       ├── SignupScreen.js
│   │   │       ├── HomeScreen.js
│   │   │       └── DashboardScreen.js
│   │   └── package.json
│   │
│   └── apigateway/       # Java 17 / Spring Boot 3.1.1
│       ├── pom.xml
│       ├── mvnw.cmd / mvnw
│       └── src/main/java/com/naada/apigateway/
│           ├── ApigatewayApplication.java
│           ├── config/
│           │   ├── SecurityConfig.java     # BCrypt, CORS *, /api/auth/** permitAll
│           │   └── FirebaseConfig.java     # Reads serviceAccountKey.json from classpath
│           ├── controller/
│           │   └── AuthController.java     # POST /signup, POST /login, DELETE /user
│           ├── entity/
│           │   └── User.java              # id, name, email, password, firebaseUid
│           ├── repository/
│           │   └── UserRepository.java    # JPA: findByEmail
│           └── service/
│               └── JwtService.java        # HMAC-SHA256, in-memory key, 24h expiry
│
├── Screenshots/          # App screenshot PNGs
├── AGENTS.md             # Agent conventions (also in user rules)
├── .gitignore
└── README.md
```

---

## Authentication Flow

The auth system uses **dual tokens** — a Spring JWT for API access and a Firebase custom token for Firebase services.

```
┌──────────────┐        POST /api/auth/login         ┌──────────────────┐
│  Mobile App  │  ─────────────────────────────────►  │   AuthController │
│              │  { email, password }                  │                  │
│              │                                       │  ① Validate creds│
│              │  ◄─────────────────────────────────  │  ② Issue Spring  │
│              │  { springToken,                       │     JWT (24h)    │
│              │    firebaseToken,                     │  ③ Issue Firebase│
│              │    userData }                         │     custom token │
└──────┬───────┘                                       └──────────────────┘
       │
       │  Stores in AsyncStorage:
       │   • 'springToken' → Bearer auth header
       │   • 'userData'    → user context
       │
       │  axiosClient interceptor auto-attaches
       │  Authorization: Bearer <springToken>
```

### Key Details
- **Password storage**: BCrypt via `PasswordEncoder`
- **JWT signing**: In-memory HMAC-SHA256 key (regenerates on server restart — all tokens invalidate)
- **Firebase**: Optional — the mobile client gracefully handles missing Firebase Auth module
- **Session restore**: On app launch, `AuthContext.checkLocalSession()` loads springToken + userData from AsyncStorage
- **Account deletion**: `DELETE /api/auth/user` extracts email from JWT, deletes from MySQL + Firebase

---

## Navigation Structure

```
AppNavigator (NativeStackNavigator, no headers)
├── Unauthenticated (user === null)
│   ├── Login
│   └── Signup
└── Authenticated (user !== null)
    ├── Home       ← initial route
    └── Dashboard  ← accessed via Profile tab
```

---

## Tech Stack Summary

| Layer      | Technology                    | Version    |
|------------|-------------------------------|------------|
| Mobile     | React Native (JS, no TS)     | 0.87.1     |
| React      | React                        | 19.1.0     |
| Navigation | React Navigation Native Stack | 7.x        |
| HTTP       | Axios                        | 1.20.0     |
| Storage    | AsyncStorage                 | 3.1.1      |
| Firebase   | RN Firebase (app + auth)     | 26.4.0     |
| API        | Spring Boot                  | 3.1.1      |
| Java       | Java                         | 17         |
| Security   | Spring Security + JJWT 0.11.5| —          |
| Database   | MySQL (via JPA/Hibernate)    | —          |
| Firebase   | Firebase Admin SDK (Java)    | 9.2.0      |

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable baseline |
| `ashen-ai-tutor` | **Current** — AI tutor feature development |
| `feature/core-auth` | Core authentication work |
| `Dev` | Development integration |
| `Difficulty-level-Calculation-mohiru` | ML-based difficulty level calculation |
| `Emotion-Percentage-Dharana` | Emotion percentage analysis |
| `feature/IT23308084-Shalika` | Team member feature branch |
| `test` | Testing |

This is a **multi-member research team** — branch names indicate individual ownership.

---

## Local Development Prerequisites

### API Gateway (`apps/apigateway/`)
1. **Java 17** on PATH
2. **MySQL** running locally on port 3306
   - Database: `naada_db` (auto-created via `createDatabaseIfNotExist=true`)
   - User: `root`, password: empty (configure in `application.properties`)
3. **Firebase service account**: Place `serviceAccountKey.json` in `src/main/resources/` (gitignored)
4. Run: `./mvnw.cmd spring-boot:run` (Windows) or `./mvnw spring-boot:run` (Unix)
5. Tests: `./mvnw.cmd test` — requires MySQL + Firebase config

### Mobile App (`apps/mobile/`)
1. **Node.js** with npm
2. `npm install` from `apps/mobile/`
3. **Android**: Android SDK, emulator or device. Run `npm run android`
4. **iOS**: Xcode + CocoaPods. Run `npm run ios`
5. Metro bundler: `npm start`
6. API must be running on port 8080 (emulator uses `10.0.2.2:8080`)
7. No test or lint scripts exist — do not claim they ran

---

## Design Language

The app uses a **dark theme** with a curated color palette:

| Color     | Hex       | Usage                                   |
|-----------|-----------|-----------------------------------------|
| Background| `#121212` | Main background                         |
| Surface   | `#1a1a1a` | Cards, inputs                           |
| Border    | `#333`    | Subtle borders                          |
| Cyan      | `#00e5ff` | Accents, active states, progress bars   |
| Purple    | `#c074ff` | Secondary accent, borders               |
| Lavender  | `#d6a3ff` | Play button, highlights                 |
| Deep Purple| `#9b51e0`| Primary buttons (Sign In)               |
| White     | `#fff`    | Primary text                            |
| Grey      | `#aaa`    | Secondary text                          |

---

## Important Gotchas

1. **JWT key is in-memory** — server restart invalidates all tokens. Clients show "invalid token" until re-login.
2. **`node_modules/` is partially committed** on some branches — long iOS file paths cause checkout errors (Windows). These are harmless; the app still builds.
3. **No TypeScript** — the mobile app is pure JavaScript. Don't introduce `.ts`/`.tsx` files.
4. **No test/lint scripts** in the mobile project — `package.json` has no `test` or `lint` entries.
5. **CORS is fully open** (`*`) — acceptable for development, not for production.
6. **Firebase is optional** — `AuthContext.js` safely catches missing Firebase modules. The app works without Firebase configured.
7. **`firebaseUid`** on `User` entity defaults to a random UUID, not an actual Firebase UID — it's a placeholder for Firebase sync.
8. **Passwords** in `application.properties` are defaults (`root` / empty) — never commit real credentials.
