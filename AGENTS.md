# AGENTS.md - Developer & Agent Guide for SportSphere

This document provides essential instructions, architectural conventions, running commands, and operational rules for AI coding agents and human developers working in this repository.

---

## 1. Tech Stack Overview

### Frontend (`client/`)
- **Core:** React 18.2.0 (Single Page Application via Create React App / `react-scripts 5.0.1`)
- **State Management:** Redux Toolkit 1.9.7 (store with slices for auth, tournaments, matches, videos, fitness, teams, ui, posts, notifications, profile, chat)
- **Routing:** React Router DOM 6.17.0
- **Styling:** Tailwind CSS 3.3.5, Autoprefixer, PostCSS
- **Real-Time Client:** Socket.io-client 4.7.2
- **Maps & Geolocation:** Leaflet 1.9.4, React-Leaflet 4.2.1
- **Icons & Animation:** Lucide React, React Icons, Framer Motion
- **Charts & Media:** Chart.js, React-Chartjs-2, Recharts, React Player, React Dropzone
- **HTTP Client:** Axios 1.5.1 with central interceptor at `client/src/services/api.js`

### Backend (`server/`)
- **Runtime:** Node.js using ES Modules (`"type": "module"`)
- **Framework:** Express.js 4.18.2
- **Database & ODM:** MongoDB Atlas with Mongoose 8.0.0
- **Real-Time Engine:** Socket.io 4.7.2 (integrated with Express HTTP server)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Passport.js (`passport-google-oauth20`, `passport-jwt`)
- **File Upload & Cloud Storage:** Cloudinary SDK, `express-fileupload`, `multer`
- **Security & Utilities:** Helmet, `express-rate-limit`, CORS, `express-validator`, Nodemailer (Gmail SMTP)
- **Testing:** Jest (needs ESM flag), Supertest

### Testing Workspace (`tests/`)
- Headless browser automation via Puppeteer and validation scripts.

---

## 2. Workspace Folder Structure

```
.
├── AGENTS.md                             # This guide
├── PROJECT_MASTER_DOCUMENT.txt            # Deep architectural audit & PRD
├── tests/                                # Automated Puppeteer and browser verification scripts
│   ├── check_form.cjs                    # Puppeteer form validation test
│   ├── e2e.js                            # Browser E2E navigation test
│   └── verify.js                         # Browser screenshot and live board verification
├── client/                               # React 18 Frontend
│   ├── public/                           # HTML shell & static assets
│   ├── src/
│   │   ├── components/                   # UI atoms and feature components (Auth, Posts, Scoring, Tournament, UI, etc.)
│   │   ├── context/                      # Active ThemeContext.js
│   │   ├── pages/                        # Screen views (Tournament, Matches, Team, Posts, Fitness, Admin, Profile, Auth)
│   │   ├── redux/                        # Redux store and domain slices
│   │   ├── services/                     # API client (api.js), socket.js, and domain services
│   │   ├── utils/                        # Helpers (auth.js, toast.js)
│   │   ├── App.js                        # Primary React Router tree
│   │   └── index.js                      # React DOM root entry
│   ├── .env                              # Frontend environment config
│   └── package.json
└── server/                               # Express.js Backend API
    ├── src/
    │   ├── config/                       # Database, passport, and cloud configurations
    │   ├── controllers/                  # Business logic & request handlers
    │   ├── middleware/                   # JWT auth guard (protect, authorize, optionalAuth), errorHandler
    │   ├── models/                       # Mongoose schemas (Tournament, Team, Match, User, Post, etc.)
    │   ├── routes/                       # Express routes and express-validator chains
    │   ├── utils/                        # Sockets (socketHandlers.js), emailService, notificationUtils
    │   └── server.js                     # HTTP server startup & middleware chain
    ├── .env                              # Backend environment secrets
    ├── package.json
    ├── e2e_workflow.mjs                  # Comprehensive 17-point automated API test suite
    ├── test_tournament_flow.mjs          # Standalone tournament lifecycle workflow test
    └── test-login.js                     # Direct DB credential verification test
```

---

## 3. How to Run Client, Server, and Tests

### 3.1 Running the Server (Backend)
```powershell
# From the workspace root:
cd server
npm start
# Server listens on port 5000 (with automatic fallback to 5001-5004 if occupied)
```
*Health Check:* `GET http://localhost:5000/health` returns `{ "status": "OK", "message": "SportSphere API is running" }`.

### 3.2 Running the Client (Frontend)
```powershell
# From the workspace root:
cd client
npm start
# Launches Webpack development server (default port 3000, or set $env:PORT="3001" if 3000 is occupied)
```
*Production Build:*
```powershell
cd client
npm run build
```

### 3.3 Running Automated Tests
```powershell
# Execute the primary 17-point backend API integration test suite:
cd server
node e2e_workflow.mjs

# Execute direct DB credential check:
cd server
node test-login.js

# Execute standalone tournament workflow script:
cd server
node test_tournament_flow.mjs
```

---

## 4. Naming and Code Conventions

### 4.1 ES Modules
- Both frontend and backend use standard ES Modules (`import` and `export`).
- Backend files must use explicit `.js` extensions on relative imports:
  ```javascript
  import connectDB from './config/database.js';
  import Tournament from '../models/Tournament.js';
  ```

### 4.2 Controller / Route / Model Architecture
- **Routes (`server/src/routes/*.js`):**
  - Define endpoint paths, attach auth middleware (`protect`, `authorize`), and declare validation rules using `express-validator`:
  ```javascript
  router.post('/', protect, tournamentValidation, createTournament);
  ```
  - **Route Ordering Rule:** Always register specific static routes (e.g., `/stats`, `/search`, `/my`, `/invitations`) **before** parameterized routes (e.g., `/:id`). Failing to do so causes Express to treat `/stats` as an `:id` parameter and trigger a Mongoose ObjectId `CastError`.
- **Controllers (`server/src/controllers/*.js`):**
  - Encapsulate business logic, database queries, and real-time WebSocket emissions.
  - Forward unhandled errors to `next(error)`.
- **Models (`server/src/models/*.js`):**
  - Define Mongoose schemas with strict validations, virtual getters, and timestamps.
  - Export the model as default: `export default mongoose.model('ModelName', modelSchema);`.

### 4.3 Error Handling Pattern
- Server uses a centralized error handler (`server/src/middleware/errorHandler.js`).
- Handled error types:
  - Mongoose `CastError`: Returns HTTP 404 `{ success: false, error: 'Resource not found' }`
  - Duplicate key `11000`: Returns HTTP 400 `{ success: false, error: '<field> already exists' }`
  - `ValidationError`: Returns HTTP 400 `{ success: false, error: '<validation messages>' }`
  - `JsonWebTokenError` / `TokenExpiredError`: Returns HTTP 401 `{ success: false, error: 'Invalid/expired token' }`
- Stack traces are returned only when `NODE_ENV === 'development'`.

### 4.4 API Response Shape
All endpoints must strictly follow standard JSON response shapes:

* **Success (Single item or operation):**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
* **Success (Paginated list):**
  ```json
  {
    "success": true,
    "count": 10,
    "total": 34,
    "pagination": {
      "next": { "page": 2, "limit": 10 }
    },
    "data": [ ... ]
  }
  ```
* **Error:**
  ```json
  {
    "success": false,
    "error": "Error description message"
  }
  ```

---

## 5. Server Environment Variables (Names Only)

The backend expects the following environment variable names configured in `server/.env`:

- `PORT` - Port for Express HTTP & WebSocket server (defaults to 5000)
- `NODE_ENV` - Environment mode (`development` | `production`)
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for signing JSON Web Tokens
- `JWT_EXPIRE` - Token expiration timeframe (e.g., `7d`)
- `JWT_COOKIE_EXPIRE` - Expiration timeframe for auth cookie
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for media storage
- `CLOUDINARY_API_KEY` - Cloudinary public API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `CLOUDINARY_URL` - Cloudinary full connection URL
- `EMAIL_HOST` - SMTP host for system notifications (e.g., `smtp.gmail.com`)
- `EMAIL_PORT` - SMTP port (e.g., `587`)
- `EMAIL_USER` - SMTP sender account username
- `EMAIL_PASS` - SMTP app-specific password
- `EMAIL_FROM` - Sender email address displayed in outgoing notifications
- `CLIENT_URL` - Allowed frontend client origin for CORS whitelist
- `FRONTEND_URL` - Client URL used in OAuth redirect callbacks
- `RATE_LIMIT_WINDOW_MS` - Rate limit window duration in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests allowed per window per IP
- `GOOGLE_CLIENT_ID` - Google Cloud Console OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET` - Google Cloud Console OAuth 2.0 client secret

---

## 6. Rules for Future Work

Whenever an agent or developer works in this codebase, the following rules **must be strictly followed**:

1. **Do not modify files unrelated to the current task:**
   - Keep diffs minimal, hyper-targeted, and scoped solely to the issue or feature at hand.
   - Do not refactor or reformat unaffected files.

2. **Do not add new dependencies without stating the technical justification:**
   - Always prefer existing workspace dependencies (`lucide-react`, `axios`, `mongoose`, `socket.io`, etc.).
   - If a new dependency is required, explicitly explain why existing packages are insufficient before installing.

3. **Always keep existing API response shapes backward compatible:**
   - Never alter the standard structure (`{ success: true, data: ... }`).
   - Do not rename or remove existing model fields that client components or test suites rely upon.

4. **Always run the E2E verification test after backend changes:**
   - After altering any backend route, controller, middleware, or model, execute:
     ```powershell
     cd server
     node e2e_workflow.mjs
     ```
   - All 17 verification points must pass with zero regressions before considering a backend task complete.
