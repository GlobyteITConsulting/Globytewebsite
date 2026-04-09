# RAG System Deployment Summary

## ✅ What's Been Set Up

Your RAG system is now configured to use **GitHub Secrets** for secure API key management. All sensitive values are replaced during deployment via GitHub Actions.

## 📁 Files Created/Modified

### New Files:
- `functions/index.js` - Cloud Functions for vector search
- `functions/package.json` - Functions dependencies
- `chatbot-rag.js` - RAG-enabled chatbot (replaces `chatbot.js`)
- `scripts/processDocument.js` - Document processing script
- `scripts/package.json` - Script dependencies
- `RAG_SETUP.md` - Complete setup guide
- `GITHUB_SECRETS_SETUP.md` - Secrets configuration guide
- `scripts/replace-secrets.sh` - Local development helper

### Modified Files:
- `.github/workflows/firebase-hosting-merge.yml` - Added Functions deployment + placeholder replacement
- `.github/workflows/firebase-hosting-pull-request.yml` - Updated for Functions
- `firebase.json` - Added Functions configuration
- `.gitignore` - Added security exclusions

## 🔐 GitHub Secrets Required

Add these in: **Repository → Settings → Secrets and variables → Actions**

### Backend (Cloud Functions):
- `HUGGINGFACE_API_KEY` - For embeddings generation

### Frontend (Chatbot):
- `GROQ_API_KEY_1` - Primary Groq API key
- `GROQ_API_KEY_2` - Secondary (optional)
- `GROQ_API_KEY_3` - Tertiary (optional)
- `GROQ_API_URL` - Default: `https://api.groq.com/openai/v1/chat/completions`
- `FIREBASE_FUNCTION_URL` - Set after first deployment (or auto-extracted)

### Existing (Already Set):
- `FIREBASE_TOKEN` - For Firebase CLI
- `FIREBASE_SERVICE_ACCOUNT_GLOBYTE` - For hosting

## 🚀 Deployment Flow

1. **Push to `main` branch**
2. **GitHub Actions runs**:
   - Installs dependencies
   - Replaces placeholders in `functions/index.js` with secrets
   - Deploys Cloud Functions
   - Extracts function URL
   - Replaces placeholders in `chatbot-rag.js` with secrets
   - Deploys Firebase Hosting

## 🔄 Placeholder Replacement

### In Code:
```javascript
const API_KEY = '__HUGGINGFACE_API_KEY__';
```

### After Deployment:
```javascript
const API_KEY = 'hf_actual_key_here';
```

## 📝 Next Steps

1. **Add GitHub Secrets** (see `GITHUB_SECRETS_SETUP.md`)
2. **Process the document** (run `scripts/processDocument.js` locally first)
3. **Update HTML** to use `chatbot-rag.js` instead of `chatbot.js`
4. **Push to main** - Deployment happens automatically
5. **Test the chatbot** on your live site

## 🔍 How to Switch to RAG Chatbot

In your `index.html`, replace:
```html
<script src="chatbot.js"></script>
```

With:
```html
<!-- Firebase SDK (if not already included) -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js"></script>
<script>
  // Firebase config (get from Firebase Console)
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "globyteus.firebaseapp.com",
    projectId: "globyteus",
    // ... other config
  };
  firebase.initializeApp(firebaseConfig);
</script>
<script src="chatbot-rag.js"></script>
```

## 🛠️ Local Development

1. Create `.env` file in `scripts/` directory
2. Add your API keys
3. Run document processing: `cd scripts && node processDocument.js`
4. For frontend testing, use `scripts/replace-secrets.sh`

## 📚 Documentation

- **`RAG_SETUP.md`** - Complete RAG system setup guide
- **`GITHUB_SECRETS_SETUP.md`** - Detailed secrets configuration
- **`DEPLOYMENT_SUMMARY.md`** - This file

## ⚠️ Important Notes

1. **Never commit** `.env` files or `serviceAccountKey.json`
2. **All secrets** must be in GitHub Secrets, not in code
3. **Function URL** can be auto-extracted or manually set as secret
4. **Document processing** must be run locally before first deployment
5. **Test locally** before pushing to production

## 🐛 Troubleshooting

### Placeholders not replaced?
- Check secret names match exactly (case-sensitive)
- Verify secrets are set in GitHub
- Check workflow logs

### Functions not deploying?
- Verify `FIREBASE_TOKEN` secret is set
- Check Firebase project ID is correct
- Review function logs in Firebase Console

### Chatbot not working?
- Verify `chatbot-rag.js` is loaded in HTML
- Check browser console for errors
- Verify Firebase config is correct
- Ensure document chunks exist in Firestore
