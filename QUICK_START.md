# CareerOS - Quick Start Guide

Get up and running with CareerOS in 10 minutes.

## 🚀 5-Step Quick Start

### Step 1: Clone & Install (2 min)

```bash
git clone https://github.com/yourusername/CareerOS.git
cd CareerOS

# Install all dependencies
npm --prefix frontend install
npm --prefix backend/functions install
```

### Step 2: Firebase Setup (2 min)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init
```

Create a new project at [Firebase Console](https://console.firebase.google.com) and select it.

### Step 3: Configure Env Variables (1 min)

Create `frontend/.env` with your Firebase config from the Firebase Console:

```env
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=careeros-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=careeros-xxx
VITE_FIREBASE_STORAGE_BUCKET=careeros-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

### Step 4: Deploy Firebase Rules (2 min)

```bash
firebase deploy --only firestore:rules,storage
```

### Step 5: Start Development (3 min)

**Terminal 1 - Frontend:**

```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

**Terminal 2 - Firebase Emulators:**

```bash
firebase emulators:start
# UI at http://localhost:4000
```

---

## ✅ Verify Installation

Visit <http://localhost:5173> and:

1. Click "Get Started"
2. Create a test account (Student role)
3. You should see the student dashboard

---

## 📁 Project Structure Overview

```
frontend/
├── src/
│   ├── pages/          # Page components (student, recruiter, admin)
│   ├── services/       # Firebase service layer
│   ├── layouts/        # Navigation layouts
│   └── context/        # Authentication context

backend/
├── functions/src/
│   ├── controllers/    # Cloud Function handlers
│   └── triggers/       # Firestore event triggers
```

---

## 🔑 Common Commands

```bash
# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality

# Backend
cd backend/functions
npm run deploy       # Deploy Cloud Functions
npm run serve        # Emulate functions locally

# Firebase
firebase deploy      # Deploy everything
firebase login       # Authenticate with Firebase
firebase init        # Initialize Firebase project
```

---

## 🎯 Next Steps

1. **Read Architecture** - See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
2. **Review Database** - See [docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)
3. **Explore Code** - Check the service layer in `frontend/src/services/`
4. **Create Test Data** - Use Firebase Console to add sample data
5. **Read Implementation Plan** - See [docs/IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md)

---

## 🐛 Troubleshooting

### Port 5173 Already in Use

```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9
# Or use a different port
npm run dev -- --port 3000
```

### Firebase Emulator Connection Issues

```bash
# Check if Firebase CLI is installed
firebase --version

# Restart emulator
firebase emulators:start --force
```

### Environment Variables Not Loading

```bash
# Make sure .env is in frontend/ directory
# And use VITE_ prefix for all variables
# Restart dev server after changes
```

### Authentication Errors

```bash
# Clear browser cache and cookies
# Or use incognito/private window
# Check Firebase Console for auth configuration
```

---

## 📊 Architecture Overview (30 seconds)

```
┌─────────────────────────┐
│   React SPA (Vite)      │
│  (Student/Recruiter/    │
│   Admin Dashboard)      │
└────────────┬────────────┘
             │
             ↓ HTTPS
┌─────────────────────────────────────┐
│      Firebase Services              │
├─────────────────────────────────────┤
│ • Authentication (Auth)             │
│ • Database (Cloud Firestore)        │
│ • File Storage (Cloud Storage)      │
│ • Serverless Functions              │
│ • Hosting (CDN)                     │
└─────────────────────────────────────┘
```

---

## 🔑 Test Accounts (After Signup)

Create these accounts for testing:

1. **Student Account**
   - Email: <student@example.com>
   - Password: Test@123
   - Role: Student

2. **Recruiter Account**
   - Email: <recruiter@example.com>
   - Password: Test@123
   - Role: Recruiter

3. **Admin Account**
   - Create via Firebase Console → Users
   - Set custom claims: `{ "role": "admin" }`

---

## 📚 Most Important Files

| File | Purpose |
|------|---------|
| `frontend/src/context/AuthContext.jsx` | Authentication & user state |
| `frontend/src/services/jobService.js` | Job-related Firebase calls |
| `frontend/src/services/applicationService.js` | Application tracking |
| `frontend/src/App.jsx` | Routing configuration |
| `firestore.rules` | Database security rules |
| `docs/DATABASE_SCHEMA.md` | Data structure reference |

---

## ✨ Features You Can Test

1. **Sign Up** - Create student/recruiter accounts
2. **Dashboard** - View role-specific dashboard
3. **Profile** - Update user profile
4. **Job Posting** (Recruiter) - Create job listings
5. **Applications** (Admin) - View all applications
6. **Analytics** - View stats and metrics
7. **Real-time Updates** - Open same page in two windows, watch updates

---

## 🆘 Need Help?

1. Check [docs/](../docs/) for detailed guides
2. Review [docs/API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md)
3. Check Firebase Console for errors
4. Review browser console (F12) for JavaScript errors
5. Check terminal output for backend errors

---

## 📞 Support Resources

- **Firebase Docs:** <https://firebase.google.com/docs>
- **React Docs:** <https://react.dev>
- **Tailwind Docs:** <https://tailwindcss.com/docs>
- **Vite Docs:** <https://vitejs.dev/guide/>

---

Happy coding! 🚀
