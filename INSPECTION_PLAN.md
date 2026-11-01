# SportSphere — Master Page-by-Page Inspection & Audit Plan

This document provides a systematic, sequential inspection roadmap for auditing the entire SportSphere platform. Use this checklist stage-by-stage to detect UI glitches, broken links, missing validation rules, edge cases, and role permission loopholes.

---

## 🎯 Inspection Methodology

For every page audited, verify across these **4 Core Pillars**:
1. **Visual & UI Consistency:** Does it match the soft-blue glassmorphic theme (`glass-panel bg-white/60`, `#3b82f6` brand blue, rounded corners, responsive layout on mobile + desktop)?
2. **Functional Logic:** Do all buttons, dropdowns, forms, modals, and tab switches work without throwing unhandled console errors?
3. **Empty States & Error Handling:** If there are 0 items (e.g., 0 tournaments, 0 workouts, 0 notifications), is there a clean, informative placeholder instead of a blank or broken screen?
4. **Role Permissions & Security:** Can an unauthenticated user or normal player perform unauthorized actions (e.g., edit someone else's tournament or score)?

---

## 🧭 Pre-Loaded Test Accounts & Credentials

Keep these login credentials handy for role switching during inspection:

| Role | Email | Password | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Organizer** | `organizer@chamkings.com` | `ChamPass123!` | Create & manage tournaments, approve teams, generate brackets |
| **Player / Athlete** | `player@chamkings.com` | `ChamPass123!` | Register teams, record workout stats, update bio, live scoring |
| **Admin** | `admin@sportsphere.com` | `Admin123!` | Platform settings, user moderation, tournament verifications |

---

## 📋 Stage 1: Entry, Authentication & Landing Experience

### 1.1 Root Landing / Home Page
* **URL:** `http://localhost:3000/`
* **Access Role:** Guest (Logged-out) & Authenticated (Player / Organizer)
* **Checklist:**
  - [ ] Hero Banner renders properly with headline, subtext, and call-to-action buttons.
  - [ ] When logged out: Displays "Sign Up Free" and "Explore Tournaments".
  - [ ] When logged in: Displays Athlete Quick Bar with athlete name, role pill, and "Passport & Stats" link.
  - [ ] Feature Highlight cards (Brackets, Live Scoring, Squads, Fitness) render with glassmorphism backgrounds.
  - [ ] Trending Tournaments grid displays cards with images, sport tags, and "Register Here" action.
  - [ ] Sports pills ticker (Football, Basketball, Cricket, etc.) are clean and responsive.
  - [ ] Floating mobile bottom bar correctly keeps the blue active indicator on the Home icon.

### 1.2 Sign In Page
* **URL:** `http://localhost:3000/login`
* **Access Role:** Guest
* **Checklist:**
  - [ ] Email and password input fields have floating focus states.
  - [ ] Password visibility toggle (eye icon) switches input between text and password.
  - [ ] Submitting empty fields triggers inline validation errors.
  - [ ] Submitting invalid credentials shows red toast/alert message without page crash.
  - [ ] Successful login redirects smoothly to **Home Page (`/`)** instead of dumping into dashboard.
  - [ ] If already authenticated, visiting `/login` immediately redirects to `/`.

### 1.3 Sign Up / Registration Page
* **URL:** `http://localhost:3000/register`
* **Access Role:** Guest
* **Checklist:**
  - [ ] Role selector allows choosing between **Player/Athlete** and **Tournament Organizer**.
  - [ ] Validation checks for password length, email format, and required names.
  - [ ] Submitting duplicate email displays friendly error message.
  - [ ] Successful registration auto-authenticates and navigates to `/`.

### 1.4 Forgot Password & Token Reset Flow
* **URL:** `http://localhost:3000/login` -> "Forgot Password?"
* **Checklist:**
  - [ ] Submitting email sends reset token request cleanly.
  - [ ] API does not leak whether email exists in database (security check).
  - [ ] Reset password page with token resets password and allows login with new credential.

---

## 📋 Stage 2: Athlete Command Center & Unified Profile

### 2.1 Unified Dashboard & Athlete Passport
* **URL:** `http://localhost:3000/dashboard`
* **Access Role:** Authenticated Athlete / Organizer
* **Checklist:**
  - [ ] Hero Athlete Passport displays initials avatar, full name, email, role badge (`ATHLETE` / `ORGANIZER`), and bio.
  - [ ] 4 Core KPI Stat Cards render:
    - *Tournaments Entered*
    - *Active Squads*
    - *Win Ratio %*
    - *Training Streak Days*
  - [ ] "Edit Profile" button opens inline glassmorphism modal:
    - [ ] Update first name, last name, phone, bio, sport, skill level.
    - [ ] Saving updates Redux auth state and persists to database without page refresh.
  - [ ] Mobile bottom navigation bar shifts blue circular shade onto the **Profile/Dashboard icon (5th icon)**.

### 2.2 Dashboard Sub-Tabs
* **URL:** `http://localhost:3000/dashboard?tab={tabName}`
* **Checklist:**
  - [ ] **Tab 1: Command Center (`?tab=overview`):**
    - [ ] Quick action cards (My Registered Tournaments, Create/Find Squads).
    - [ ] Performance Radar & Career Wins Chart (Recharts) renders without SVG distortion.
    - [ ] Recent tournament activity timeline shows real user activities.
  - [ ] **Tab 2: Profile & Bio (`?tab=profile`):**
    - [ ] Displays physical stats (Height, Weight, Dominant Hand/Foot, Jersey Number).
    - [ ] Sports preferences tags list correctly.
    - [ ] Social handles (Instagram, Twitter, Strava) display with clickable links.
  - [ ] **Tab 3: Analytics & Career (`?tab=analytics`):**
    - [ ] Win/Loss ratio visual gauge.
    - [ ] Monthly match performance bars.
  - [ ] **Tab 4: Squads & Invitations (`?tab=teams`):**
    - [ ] Team Invitations component renders pending invitations with "Accept" / "Decline" buttons.
    - [ ] Displays teams user is currently a member or captain of.

### 2.3 Legacy Profile Route Redirect
* **URL:** `http://localhost:3000/profile`
* **Checklist:**
  - [ ] Visiting `/profile` automatically redirects to `/dashboard?tab=profile` smoothly.

### 2.4 User Settings
* **URL:** `http://localhost:3000/settings`
* **Checklist:**
  - [ ] Notification preferences toggles (Email notifications, Match alerts, Chat pings).
  - [ ] Privacy settings (Public vs Squad-only profile visibility).
  - [ ] Change password section with current password verification.

---

## 📋 Stage 3: Tournaments Lifecycle (Discovery, Creation, Brackets & Approvals)

### 3.1 Tournaments Hub
* **URL:** `http://localhost:3000/tournaments`
* **Access Role:** Public / Authenticated
* **Checklist:**
  - [ ] Search input filters tournaments in real time by name, organizer, or location.
  - [ ] Sports filter tabs (All Sports, Cricket, Basketball, Soccer, Volleyball, etc.).
  - [ ] Status filters (All Tournaments, Open for Registration, In Progress, Completed).
  - [ ] Switch between **List View** and **Interactive Leaflet Map View**:
    - [ ] Map renders venue pins without tile errors.
    - [ ] Clicking pin opens popup with tournament summary and link.
  - [ ] Tournament card displays sport badge, entry fee, prize pool, date, venue, and "Register Here" button.

### 3.2 Tournament Details Page
* **URL:** `http://localhost:3000/tournaments/:id` (e.g. CHAM KINGS)
* **Checklist:**
  - [ ] Hero banner displays tournament banner image, title, organizer name, and status badge.
  - [ ] Details breakdown: Format (Single Elim / Double Elim / Round Robin), Max Teams, Entry Fee, Schedule.
  - [ ] Registered Teams list displays approved and pending teams.
  - [ ] If logged in as Player: "Register Team" button allows selecting one of user's squads.
  - [ ] If logged in as Organizer: "Manage Tournament" button opens Organizer Control Center.

### 3.3 Tournament Creation Form (Organizer Only)
* **URL:** `http://localhost:3000/tournaments/create`
* **Access Role:** Organizer (If Player tries to access, should warn or redirect)
* **Checklist:**
  - [ ] Step 1: Basic Information (Name, Sport, Description, Venue Address, Start/End Dates).
  - [ ] Step 2: Format & Rules (Single Elimination, Double Elimination, Round Robin, Max Teams limit: 2 to 64).
  - [ ] Step 3: Financials & Fees (Entry fee amount, Prize pool, Currency).
  - [ ] Form validation prevents negative prize fees, invalid dates (end date before start date), or blank names.
  - [ ] Submitting creates tournament in MongoDB and redirects to tournament dashboard.

### 3.4 Organizer Tournament Dashboard
* **URL:** `http://localhost:3000/tournaments/:id/dashboard`
* **Access Role:** Tournament Owner / Organizer
* **Checklist:**
  - [ ] Quick stat metrics: Registered Teams Count, Bracket Readiness %, Matches Played.
  - [ ] Quick navigation pills to: *Participants*, *Brackets*, *Communication*, *Live Board*, *Financials*.

### 3.5 Participant & Registration Management
* **URL:** `http://localhost:3000/tournaments/:id/participants`
* **Checklist:**
  - [ ] List of pending team registration requests.
  - [ ] Organizer can click "Approve" or "Reject".
  - [ ] Approving updates team status in DB and increments tournament's `registeredTeams` count.
  - [ ] Rejected teams show feedback note.

### 3.6 Automated Tournament Brackets
* **URL:** `http://localhost:3000/tournaments/:id/brackets`
* **Checklist:**
  - [ ] "Generate Brackets" button seeds approved teams automatically.
  - [ ] Supports **Single Elimination** tree view (Quarterfinals -> Semifinals -> Finals).
  - [ ] Supports **Double Elimination** (Winners Bracket + Losers Bracket + Grand Finals).
  - [ ] Advancing a winner updates the next bracket node in real-time.

### 3.7 Live Tournament Public Board
* **URL:** `http://localhost:3000/tournaments/:id/live`
* **Checklist:**
  - [ ] Real-time public scoreboard for spectators.
  - [ ] Live matches ticker with current scores and status badge (`LIVE`, `FINISHED`).

---

## 📋 Stage 4: Matches & Live Multi-Sport Scoring Engine

### 4.1 Matches Hub
* **URL:** `http://localhost:3000/matches`
* **Checklist:**
  - [ ] Filter by match status: `All`, `Live Now`, `Upcoming`, `Completed`.
  - [ ] Sport filter selector.
  - [ ] Match card displays Team A vs Team B, scheduled time, venue, and score summary.

### 4.2 Match Creation Wizard
* **URL:** `http://localhost:3000/matches/create`
* **Checklist:**
  - [ ] Select Sport -> Select Tournament (optional) -> Select Team 1 vs Team 2 -> Set Date/Time.
  - [ ] Validation ensures Team 1 != Team 2.

### 4.3 Multi-Sport Real-Time Scoring Engines
Audit the scoring engine for each supported sport:

#### A. Cricket Scoring Engine
* **URL:** `http://localhost:3000/matches/score/cricket/:matchId` or `http://localhost:3000/cricket`
* **Checklist:**
  - [ ] Runs buttons: `0, 1, 2, 3, 4, 6`.
  - [ ] Extras buttons: `Wide`, `No Ball`, `Bye`, `Leg Bye`.
  - [ ] Wicket modal: select dismissal type (Bowled, Caught, Run Out, LBW) and outgoing batsman.
  - [ ] Overs calculation updates properly (e.g. 5.5 -> 6.0 over transition).
  - [ ] Live commentary / ball-by-ball timeline appends new balls in real-time.
  - [ ] WebSocket broadcasts score to all connected spectators without reload.

#### B. Badminton Scoring Engine
* **URL:** `http://localhost:3000/matches/score/badminton/:matchId`
* **Checklist:**
  - [ ] Point increment for Player/Team 1 and Player/Team 2.
  - [ ] Deuce handling at 20-20 (must win by 2 points up to 30 max).
  - [ ] Set transitions (Best of 3 sets).
  - [ ] Service indicator arrow toggles to serving side.

#### C. Volleyball Scoring Engine
* **URL:** `http://localhost:3000/matches/score/volleyball/:matchId`
* **Checklist:**
  - [ ] 25-point set scoring logic with 2-point lead rule.
  - [ ] Decider set (15 points).
  - [ ] Rotation tracker and timeout counters.

#### D. Kabaddi Scoring Engine
* **URL:** `http://localhost:3000/matches/score/kabaddi/:matchId`
* **Checklist:**
  - [ ] Raid points (Touch, Bonus, Super Raid).
  - [ ] Tackle points (Super Tackle bonus).
  - [ ] All-Out (+2 bonus points) and timer controls.

---

## 📋 Stage 5: Squads, Teams & Real-Time Chat

### 5.1 Teams Hub
* **URL:** `http://localhost:3000/teams`
* **Checklist:**
  - [ ] Search teams by name, sport, or city.
  - [ ] Team cards show logo, sport tag, captain name, and member count.
  - [ ] "Create Squad" button for authenticated athletes.

### 5.2 Team Creation Form
* **URL:** `http://localhost:3000/teams/create`
* **Checklist:**
  - [ ] Team Name, Sport, Home City, Bio.
  - [ ] Team Logo upload (Cloudinary integration) or fallback initial badge.
  - [ ] Validation prevents duplicate team names.

### 5.3 Team Details & Roster Management
* **URL:** `http://localhost:3000/teams/:id` (e.g. CHAM Strikers)
* **Checklist:**
  - [ ] Team Captain badge highlighted.
  - [ ] Player roster table with roles (e.g., Batsman, Bowler, All-Rounder).
  - [ ] If user is Captain: "Invite Player" modal (search athletes by email/username and send invitation).
  - [ ] If user is Guest/Non-member: "Request to Join" button.

### 5.4 Team Real-Time Squad Chat
* **URL:** `http://localhost:3000/teams/:id/chat`
* **Checklist:**
  - [ ] Socket.io room joins on page mount.
  - [ ] Messages send instantly and append to chat window without page refresh.
  - [ ] Timestamp, sender avatar, and message bubbles formatted cleanly.
  - [ ] Online presence indicator shows active teammates.

---

## 📋 Stage 6: Fitness, Workouts & Athletic Progress

### 6.1 Fitness Hub
* **URL:** `http://localhost:3000/fitness`
* **Checklist:**
  - [ ] Daily workout streak counter.
  - [ ] Calorie burn and active minutes summary widgets.
  - [ ] Quick shortcut buttons to: *Browse Workouts*, *Workout Builder*, *Interactive Timer*, *Nutrition Guide*, *Progress Tracker*.

### 6.2 Browse Workouts
* **URL:** `http://localhost:3000/fitness/browse-workouts`
* **Checklist:**
  - [ ] Filter workouts by muscle group (Chest, Legs, Core, Arms, Full Body) and difficulty (Beginner, Intermediate, Advanced).
  - [ ] Workout cards display estimated duration, calories, and exercise count.

### 6.3 Workout Details & Interactive Timer
* **URL:** `http://localhost:3000/fitness/workout/:id` & `/fitness/timer`
* **Checklist:**
  - [ ] Step-by-step exercise breakdown with set/rep recommendations.
  - [ ] Interactive interval timer: Start, Pause, Reset, Interval Beep sounds.
  - [ ] "Complete Workout" button logs session to user's database history and increments stats.

### 6.4 Custom Workout Builder
* **URL:** `http://localhost:3000/fitness/workout-builder`
* **Checklist:**
  - [ ] Add custom exercises with target sets, reps, and rest intervals.
  - [ ] Save custom routine to user profile.

### 6.5 Athletic Progress & Nutrition Tracker
* **URL:** `http://localhost:3000/fitness/progress` & `/fitness/nutrition`
* **Checklist:**
  - [ ] Line chart showing weight or performance volume progression over time.
  - [ ] Nutrition macro calculator (Carbs, Protein, Fats) and hydration water tracker.

---

## 📋 Stage 7: Community Social Feed, Notifications & Media

### 7.1 Community Posts Hub
* **URL:** `http://localhost:3000/posts`
* **Checklist:**
  - [ ] Create Post bar: Text input, sport tag selector, photo/video media upload.
  - [ ] Social feed stream: Author avatar, timestamp, post caption, media gallery.
  - [ ] Like button: Toggling increments count instantly and animates heart icon.
  - [ ] Comment section: Add comment, view existing comments list with author avatars.
  - [ ] Filter feed by media type: `All Posts`, `Videos Only`, `Photos Only`.

### 7.2 Post Details Screen
* **URL:** `http://localhost:3000/posts/:id`
* **Checklist:**
  - [ ] Full resolution media preview.
  - [ ] Share button copies post URL to clipboard with confirmation toast.

### 7.3 Real-Time Notification Bell
* **URL:** Accessible from top Navbar bell icon on all pages
* **Checklist:**
  - [ ] Unread notification count badge (e.g. `3`) on bell icon.
  - [ ] Clicking bell opens glassmorphic notification dropdown panel.
  - [ ] Lists notifications: Team invitations, match updates, score pings.
  - [ ] "Mark All as Read" clears unread counter.
  - [ ] Clicking a notification navigates to the relevant entity.

### 7.4 Global Chat Hub
* **URL:** `http://localhost:3000/chat`
* **Checklist:**
  - [ ] Direct messages list between athletes.
  - [ ] Message history loads and auto-scrolls to bottom.

---

## 📋 Stage 8: Admin Portal & Platform Governance (Admin Only)

### 8.1 Admin Dashboard
* **URL:** `http://localhost:3000/admin`
* **Access Role:** Admin (`admin@sportsphere.com` / `Admin123!`)
* **Checklist:**
  - [ ] If logged in as Player/Organizer: ProtectedRoute rejects with 403 or redirects.
  - [ ] If Admin: Displays platform KPI widgets (Total Users, Total Tournaments, Active Matches, Revenue).

### 8.2 User Management
* **URL:** `http://localhost:3000/admin/users`
* **Checklist:**
  - [ ] Search and filter all registered users.
  - [ ] Promote/Demote user roles (`athlete` <-> `organizer` <-> `admin`).
  - [ ] Ban/Deactivate account controls.

### 8.3 Tournament Verification & Content Moderation
* **URL:** `http://localhost:3000/admin/verification` & `/admin/moderation`
* **Checklist:**
  - [ ] Review pending tournaments for official verification badge.
  - [ ] Content moderation queue for reported posts or offensive comments.

---

## 📋 Stage 9: Static, Legal & Error Fallbacks

### 9.1 Static Information Pages
* **URLs:** 
  - `http://localhost:3000/about` (Platform mission, sports philosophy)
  - `http://localhost:3000/contact` (Contact form, support inquiry)
  - `http://localhost:3000/help` (FAQ accordion, organizer guide)
  - `http://localhost:3000/privacy` (Privacy Policy)
  - `http://localhost:3000/terms` (Terms of Service)
* **Checklist:**
  - [ ] All pages load without 404.
  - [ ] Clean glassmorphic typography and layout.

### 9.2 404 Not Found & Unknown Route Handling
* **URL:** `http://localhost:3000/random-non-existent-page`
* **Checklist:**
  - [ ] Redirects cleanly to `/` or shows friendly 404 illustration with "Back to Home" button.
  - [ ] No blank white screen or React boundary crash.

---

## 🔍 How to Record and Report Any Found Issues

When you find any issue or loophole during your inspection, record it in this simple 3-line format:
```markdown
- **Page / URL:** [e.g. /tournaments/create]
- **Issue:** [e.g. Description input doesn't show character count limit]
- **Expected Behavior:** [e.g. Should show 0/1000 characters and disable submit if empty]
```
Share it directly here in the chat, and I will fix it immediately with hyper-targeted code patches and verify it!
