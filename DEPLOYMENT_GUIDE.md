# Deployment Guide - Portal Fixes

## 📦 Quick Deployment (3 Steps)

### Step 1: Build the Project
```bash
npm run build
```
This compiles all your code and assets into the `dist` folder.

### Step 2: Test the Build Locally (Optional)
```bash
npm run preview
```
This lets you test the production build locally before deploying.

### Step 3: Deploy to Firebase Hosting
```bash
firebase deploy
```
This uploads your changes to Firebase Hosting.

---

## 🔧 Complete Deployment Process

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project initialized and authenticated
- All code changes committed (optional but recommended)

### Full Deployment Steps

#### 1. **Verify Changes Are Saved**
```bash
# Check git status to see what changed
git status
```

#### 2. **Install Dependencies (if needed)**
```bash
npm install
```

#### 3. **Build for Production**
```bash
npm run build
```
**What it does:**
- Compiles React/Vue components
- Bundles JavaScript
- Optimizes assets
- Outputs to `dist/` folder

**Expected output:**
```
✓ built in 2.3s

dist/index.html         12.5 kB │ gzip:  3.8 kB
dist/assets/main.js    542.3 kB │ gzip: 156.4 kB
```

#### 4. **Verify Build Succeeded**
```bash
# Check that dist folder was created with files
ls -la dist/
```

Should show:
- `dist/index.html` (main HTML file)
- `dist/assets/` (folder with JS/CSS)

#### 5. **Deploy to Firebase Hosting**
```bash
firebase deploy --only hosting
```

**What it does:**
- Uploads `dist` folder contents to Firebase
- Makes app publicly available
- Can take 1-2 minutes

**Success message:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

#### 6. **Verify Deployment**
- Open the hosting URL in browser
- Test login page (should be clean)
- Verify changes are live

---

## 🚀 Deployment Checklist

### Before Deploying
- [ ] All changes saved in files
- [ ] No console errors in dev server
- [ ] Tested locally (npm run start)
- [ ] Firebase credentials valid
- [ ] Internet connection stable

### During Deployment
- [ ] `npm run build` completes successfully
- [ ] No build errors shown
- [ ] `dist` folder created with files
- [ ] `firebase deploy` shows success message

### After Deployment
- [ ] Visit live URL
- [ ] Test login page displays correctly
- [ ] Test coach login flow
- [ ] Verify no activities visible before login
- [ ] Check browser console for errors

---

## 📋 What Gets Deployed

### Files Included:
✅ `/src/` - Your source code
✅ `/index.html` - Main HTML
✅ All CSS/styling
✅ All JavaScript
✅ All assets

### Files NOT Deployed:
❌ `/node_modules/` - Dependencies
❌ `.env.local` - Secret keys
❌ `/dist/` - Created by build

---

## 🔍 Deployment Details

### Build Output Location
- **Source**: `/Users/admin/Desktop/HearIsland/src/`
- **Build Output**: `/Users/admin/Desktop/HearIsland/dist/`
- **Firebase Deploys From**: `dist/` folder

### Firebase Configuration
```json
{
  "hosting": {
    "public": "dist",
    "cleanUrls": true,
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

### Browser Cache
HTML files have `no-cache` headers, so users get latest version automatically.

---

## 🛠️ Troubleshooting Deployment

### Issue: "firebase command not found"
**Solution:**
```bash
npm install -g firebase-tools
firebase login
```

### Issue: Build fails with errors
**Solution:**
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Issue: "Permission denied" for firebase deploy
**Solution:**
```bash
# Re-authenticate
firebase logout
firebase login
firebase deploy
```

### Issue: Changes not showing on live site
**Solution:**
1. Hard refresh browser: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`
2. Or use incognito/private window
3. Wait 5-10 seconds for CDN cache to clear

---

## 📊 Deployment Timeline

| Step | Duration | Description |
|------|----------|-------------|
| Build | 2-3 min | npm run build |
| Deploy | 1-2 min | firebase deploy |
| CDN Cache | 5-10 sec | Global distribution |
| **Total** | **~5-10 min** | Full deployment |

---

## ✅ Deployment Commands Summary

```bash
# Development
npm run start        # Start dev server on localhost:5173

# Production Build
npm run build        # Create optimized dist folder
npm run preview      # Test production build locally

# Deployment
firebase deploy      # Deploy to Firebase Hosting
firebase deploy --only hosting  # Deploy only hosting (skip database rules)

# Verification
firebase hosting:channel:deploy main  # Deploy to preview channel first
```

---

## 🔐 Security Notes

### Before Deploying
- Never commit `.env` files with secrets
- Check that API keys are in environment variables
- Verify Firebase security rules are in place

### Environment Variables
```bash
# Create .env file (NOT committed to git)
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx
```

---

## 📞 Post-Deployment Support

### Monitor Deployment
```bash
# Check deployment status
firebase hosting:list
```

### Rollback if Needed
```bash
# Deploy previous version
firebase hosting:channel:deploy main  # Use backup channel
```

### View Deployment History
```bash
firebase hosting:versions:list
```

---

## ✨ After Deployment

1. **Test All Features**
   - Login page (clean, no activities)
   - Coach login flow
   - Student login flow
   - Activity navigation

2. **Monitor for Issues**
   - Check browser console for errors
   - Monitor user feedback
   - Check Firebase analytics

3. **Update Documentation**
   - Document deployment date
   - Note any issues found
   - Update user guides if needed

---

## 📝 Quick Reference

```bash
# One-liner deployment (recommended)
npm run build && firebase deploy

# Step by step
npm run build                    # Build
npm run preview                  # Test
firebase deploy --only hosting   # Deploy
```

Done! Your changes are now live for all users. 🎉
