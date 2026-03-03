# Authentication Fix Guide

## Issues Identified

Your authentication is not working due to several configuration issues. Follow these steps to fix them.

---

## Step 1: Enable Firebase Authentication

### In Firebase Console (https://console.firebase.google.com):

1. **Go to your Firebase project**: `placementportal-2e73c`
2. **Navigate to**: Build → Authentication
3. **Click**: Get Started (if not already enabled)
4. **Enable Sign-in methods**:
   - Click on "Sign-in method" tab
   - Enable **Email/Password** authentication
   - Click Save

---

## Step 2: Verify Firestore Database

1. **In Firebase Console**: Build → Firestore Database
2. **Check if database exists**:
   - If not created, click "Create database"
   - Choose **Start in test mode** (for development) or **Production mode** (for production)
   - Select a location close to your users

---

## Step 3: Update Firestore Rules (If needed)

The current rules require users to exist before they can be created (circular dependency issue).

**Temporary Fix for Development:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow user creation during signup
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }

    // Allow student profile creation
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == studentId;
      allow update: if request.auth != null && request.auth.uid == studentId;
      allow delete: if false;
    }

    // Allow recruiter profile creation
    match /recruiters/{recruiterId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == recruiterId;
      allow update: if request.auth != null && request.auth.uid == recruiterId;
      allow delete: if false;
    }

    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**To deploy rules:**
```bash
firebase login
firebase use placementportal-2e73c
firebase deploy --only firestore:rules
```

---

## Step 4: Test Authentication

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser** to: http://localhost:3000

3. **Try to register** a new user:
   - Go to /register
   - Fill in the form
   - Submit

4. **Check browser console (F12)** for any errors

---

## Step 5: Common Errors & Solutions

### Error: "Firebase: Error (auth/operation-not-allowed)"
**Solution:** Enable Email/Password authentication in Firebase Console

### Error: "Missing or insufficient permissions"
**Solution:** Update Firestore rules (see Step 3)

### Error: "Firebase: Error (auth/invalid-api-key)"
**Solution:** Verify your `.env` file has correct Firebase credentials

### Error: "Firebase: Error (auth/network-request-failed)"
**Solution:** Check your internet connection and Firebase project status

---

## Step 6: Check Firebase Project Status

Run these commands to verify setup:

```bash
# Login to Firebase
firebase login

# Check current project
firebase projects:list

# Use your project
firebase use placementportal-2e73c

# Check project info
firebase use
```

---

## Step 7: Alternative - Use Test Account

If you want to test immediately, you can:

1. **Manually create a user in Firebase Console:**
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Save

2. **Manually create user document in Firestore:**
   - Go to Firestore Database
   - Create collection: `users`
   - Add document with ID = the user's UID
   - Add fields:
     ```json
     {
       "uid": "user-uid-from-auth",
       "email": "test@example.com",
       "fullName": "Test User",
       "role": "student",
       "createdAt": "2026-03-03T00:00:00.000Z",
       "updatedAt": "2026-03-03T00:00:00.000Z"
     }
     ```

3. **Try logging in** with this test account

---

## Need More Help?

Check these files for more information:
- [README.md](README.md) - Project overview
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [QUICK_START.md](QUICK_START.md) - Setup guide

Or check the browser console and Firebase logs for specific error messages.
