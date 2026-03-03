# CareerOS Troubleshooting Guide

Common issues and solutions for CareerOS development and deployment.

---

## 🔴 Frontend Issues

### Issue: Port 5173 Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::5173
```

**Solutions:**

1. **Kill the process using the port**

   ```bash
   # macOS/Linux
   lsof -ti:5173 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. **Use a different port**

   ```bash
   npm run dev -- --port 3000
   ```

3. **Check what's using the port**

   ```bash
   lsof -i :5173
   ```

---

### Issue: Environment Variables Not Loading

**Error:**

```
Uncaught ReferenceError: import.meta.env is undefined
```

**Solutions:**

1. **Verify .env file location**
   - Must be in `frontend/.env` (not in `src/`)
   - Restart dev server after creating/modifying

2. **Check variable naming**
   - All vars must start with `VITE_` prefix

   ```env
   # ✅ Correct
   VITE_FIREBASE_API_KEY=abc123
   
   # ❌ Wrong
   FIREBASE_API_KEY=abc123
   ```

3. **Reload browser**

   ```bash
   # Stop dev server (Ctrl+C)
   # Clear cache: Ctrl+Shift+R or Cmd+Shift+R
   # Restart: npm run dev
   ```

4. **Check .gitignore**
   - Ensure `.env` is NOT in .gitignore (for development)
   - `.env.local` is typically ignored

---

### Issue: React Router Not Working

**Error:**

```
Cannot read property 'pathname' of undefined
```

**Solutions:**

1. **Verify BrowserRouter is set up**

   ```javascript
   // frontend/src/main.jsx
   import { BrowserRouter } from 'react-router-dom';
   
   ReactDOM.createRoot(document.getElementById('root')).render(
     <BrowserRouter>
       <App />
     </BrowserRouter>
   );
   ```

2. **Check route definitions**
   - Ensure `App.jsx` has proper Route components
   - Verify path syntax (no typos)

3. **Clear storage and reload**

   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   // Then refresh browser
   ```

---

### Issue: Connection Refused to Firebase

**Error:**

```
Error: Failed to fetch from database
Uncaught Error: Timeout: no response from server
```

**Solutions:**

1. **Verify Firebase Emulator is running**

   ```bash
   # Terminal 2
   firebase emulators:start
   
   # Check: http://localhost:4000
   ```

2. **Check emulator connection in code**

   ```javascript
   // frontend/src/config/firebase.js
   if (location.hostname === 'localhost') {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

3. **Use correct host (not 127.0.0.1)**
   - Must use `localhost` not `127.0.0.1`
   - Check firebase.json for correct ports

4. **Check firewall/VPN**
   - VPN might block emulator connections
   - Try disabling temporarily

---

### Issue: "Document is not defined" Error

**Error:**

```
Uncaught ReferenceError: document is not defined
```

**Solutions:**

1. **Move browser-only code**

   ```javascript
   // ❌ Wrong - runs on import
   const element = document.getElementById('root');
   
   // ✅ Correct - runs in component
   useEffect(() => {
     const element = document.getElementById('root');
   }, []);
   ```

2. **Check file type**
   - `.jsx` files are browser code
   - `.js` files (in services/) should be universal

---

### Issue: "Cannot find module" Error

**Error:**

```
Error: Cannot find module '@/components/Header'
```

**Solutions:**

1. **Verify vite.config.js aliases**

   ```javascript
   // frontend/vite.config.js
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       '@components': path.resolve(__dirname, './src/components'),
     },
   }
   ```

2. **Check file exists**
   - Verify path is correct
   - File names are case-sensitive on macOS/Linux

3. **Clear caches**

   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   npm run dev
   ```

---

## 🔴 Backend Issues

### Issue: Cloud Functions Won't Deploy

**Error:**

```
Error: Failed to deploy function
Error: Error code 3 (INVALID_ARGUMENT)
```

**Solutions:**

1. **Check Firebase setup**

   ```bash
   firebase projects:list
   firebase use <project_id>
   ```

2. **Verify .firebaserc**

   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

3. **Check Node version**

   ```bash
   node --version  # Should be 18+
   ```

4. **Check package.json**
   - Ensure main entry point is correct
   - Check all dependencies are installed

5. **Review logs**

   ```bash
   firebase functions:log
   ```

---

### Issue: Firestore Trigger Not Firing

**Error:**

```
Trigger doesn't execute when document is created/updated
```

**Solutions:**

1. **Check trigger syntax**

   ```javascript
   // ✅ Correct
   exports.myTrigger = functions
     .firestore
     .document('collections/{docId}')
     .onWrite(async (change, context) => {
       // Code
     });
   ```

2. **Verify collection path**
   - Collection must exist for trigger to work
   - Path must match exactly

3. **Check Cloud Function logs**

   ```bash
   firebase functions:log
   # Or in Firebase Console → Functions → Logs
   ```

4. **Ensure function is deployed**

   ```bash
   firebase deploy --only functions
   firebase functions:list
   ```

---

### Issue: Authentication Fails in Functions

**Error:**

```
Error: Error code 3 (UNAUTHENTICATED)
```

**Solutions:**

1. **Verify auth context**

   ```javascript
   if (!context.auth) {
     throw new functions.https.HttpsError(
       'unauthenticated',
       'User must be logged in'
     );
   }
   ```

2. **Check auth token**
   - Ensure user is logged in before calling function
   - Token must be valid

3. **Check security rules**
   - Firestore rules might be blocking access
   - Review firestore.rules file

---

## 🔴 Firebase Issues

### Issue: Firestore Emulator Won't Start

**Error:**

```
Error: Starting Firestore Emulator failed
Error: EADDRINUSE: address already in use :::8080
```

**Solutions:**

1. **Kill process using port 8080**

   ```bash
   # macOS/Linux
   lsof -ti:8080 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F
   ```

2. **Use different port**

   ```bash
   firebase emulators:start --firestore-port=9000
   ```

3. **Check firebase.json**

   ```json
   {
     "emulators": {
       "firestore": {
         "port": 8080
       }
     }
   }
   ```

---

### Issue: "Permission Denied" on Firestore

**Error:**

```
Error: Missing or insufficient permissions
Uncaught FirebaseError: [firestore/permission-denied]
```

**Solutions:**

1. **Check Firestore rules**

   ```javascript
   // ✅ Allow authenticated users
   allow read, write: if request.auth != null;
   
   // ❌ Deny all
   allow read, write: if false;
   ```

2. **Verify user authentication**

   ```javascript
   // Debug auth state
   authStateChanged(auth, (user) => {
     console.log('User:', user);
   });
   ```

3. **Check rule conditions**

   ```javascript
   // Make sure conditions match
   allow read: if request.auth.uid == resource.data.userId;
   ```

4. **Test with admin rules** (dev only)

   ```javascript
   allow read, write: if true; // Only for testing!
   ```

---

### Issue: Storage Upload Fails

**Error:**

```
Error: Not authenticated
Error: Unknown error occurred
```

**Solutions:**

1. **Check storage.rules**

   ```javascript
   match /b/{bucket}/o {
     match /{allPaths=**} {
       allow read, write: if request.auth != null;
     }
   }
   ```

2. **Verify file size limit**

   ```javascript
   // In frontend
   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
   if (file.size > MAX_FILE_SIZE) {
     throw new Error('File too large');
   }
   ```

3. **Check MIME type**
   - Ensure file type is allowed
   - server-side validation in Cloud Functions

---

### Issue: "Quota Exceeded"

**Error:**

```
Error: Quota exceeded
Error: Rate limited
```

**Solutions:**

1. **Check usage limits**
   - Go to Firebase Console → Usage
   - Upgrade to Blaze plan if needed

2. **Optimize queries**
   - Use composite indexes
   - Implement pagination
   - Add query limits

3. **Implement caching**

   ```javascript
   // Cache frequently accessed data
   const cache = new Map();
   
   function getCachedData(key) {
     if (cache.has(key)) return cache.get(key);
     // Fetch from Firestore
   }
   ```

4. **Batch operations**

   ```javascript
   const batch = writeBatch(db);
   // Multiple operations in one batch
   batch.commit();
   ```

---

## 🔴 Deployment Issues

### Issue: Deployment Fails

**Error:**

```
Error: Failed to deploy
Error: Resource 'projects/...' was not found
```

**Solutions:**

1. **Verify Firebase project**

   ```bash
   firebase projects:list
   firebase use <project_id>
   ```

2. **Check .firebaserc**

   ```json
   {
     "projects": {
       "default": "correct-project-id"
     }
   }
   ```

3. **Authenticate**

   ```bash
   firebase logout
   firebase login
   ```

4. **Check permissions**
   - Ensure you have Editor role in Firebase project
   - Check Firebase Console IAM settings

---

### Issue: Hosting Deployment Successful but Page Shows 404

**Error:**

```
404 Page Not Found
```

**Solutions:**

1. **Check build output**

   ```bash
   cd frontend
   npm run build
   ls -la dist/
   ```

2. **Verify firebase.json**

   ```json
   {
     "hosting": {
       "public": "frontend/dist",
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

3. **Clear CDN cache**
   - Firebase clears automatically
   - Wait 5-10 minutes for propagation

---

### Issue: Environment Variables Missing in Production

**Error:**

```
TypeError: Cannot read property of undefined
```

**Solutions:**

1. **Rebuild with new env vars**

   ```bash
   # Update .env
   # Rebuild
   npm run build
   # Redeploy
   firebase deploy
   ```

2. **Verify production env vars**

   ```bash
   # Check built index.html
   cat dist/index.html | grep VITE_
   ```

3. **Use Firebase Hosting environment variables**
   - Set in Firebase Console
   - Or in .env.production

---

## 🔴 Data Issues

### Issue: Firestore Data Corrupted

**Solution:**

1. **Export backup**

   ```bash
   gcloud firestore export gs://bucket-name/backup
   ```

2. **Restore from backup**

   ```bash
   gcloud firestore import gs://bucket-name/backup
   ```

3. **Manual fix (if small data)**
   - Use Firebase Console to fix data
   - Create migration script if needed

---

### Issue: Indexes Not Working

**Error:**

```
Error: The query requires an index
```

**Solutions:**

1. **Build missing indexes**
   - Click link in error
   - Or manually in Firebase Console

2. **Update firestore.indexes.json**

   ```bash
   firebase firestore:indexes
   ```

3. **Redeploy indexes**

   ```bash
   firebase deploy --only firestore:indexes
   ```

---

## ✅ Verification Checklist

After fixing an issue, verify:

- [ ] Clear browser cache (Cmd+Shift+R)
- [ ] Restart dev server
- [ ] Restart Firebase emulator
- [ ] Check browser console (F12)
- [ ] Check terminal for errors
- [ ] Test in incognito window
- [ ] Test on different browser
- [ ] Rebuild frontend

---

## 📝 Getting Help

1. **Check documentation**
   - [docs/](../docs/) folder
   - [Firebase Docs](https://firebase.google.com/docs)

2. **Google the error message**
   - Include exact error text
   - Include stack trace

3. **Check logs**

   ```bash
   firebase functions:log
   ```

4. **Open an issue**
   - Include reproduction steps
   - Include environment info
   - Include error messages

5. **Common fixes**
   - Restart dev server
   - Clear node_modules and reinstall
   - Clear browser cache
   - Check for typos

---

## 🆘 Emergency Reset

If all else fails, perform a clean reset:

```bash
# Frontend
cd frontend
rm -rf node_modules dist
npm install
npm run dev

# Backend
cd ../backend/functions
rm -rf node_modules
npm install

# Firebase
firebase emulators:start
```

---

## 📞 Still Need Help?

1. Check [docs/API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md)
2. Review [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Check [GitHub Issues](https://github.com/yourusername/CareerOS/issues)
4. Email: <support@careeros.com>

---

**Last Updated:** 2024  
**Firebase CLI Version:** 13.0+  
**Node Version:** 18+
