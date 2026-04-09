# RAG System Setup Guide

This guide will help you set up the Retrieval-Augmented Generation (RAG) system for the Globyte website chatbot.

## Architecture Overview

The RAG system consists of:
1. **Document Processing**: Extracts text from `GlobyteBusinessPlan.docx`, splits into chunks, and generates embeddings
2. **Vector Storage**: Stores embeddings in Firestore
3. **Search Function**: Cloud Function that performs vector similarity search
4. **Chatbot Integration**: Updated chatbot that retrieves relevant context and generates responses using Groq

## Prerequisites

1. **Firebase Project**: Set up a Firebase project with:
   - Firestore Database
   - Cloud Functions
   - Firebase Hosting

2. **API Keys**:
   - **Hugging Face API Key** (free): Get from https://huggingface.co/settings/tokens
   - **Groq API Keys**: Configure via GitHub Secrets (see `GITHUB_SECRETS_SETUP.md`)
   - **Firebase Service Account**: Already configured for GitHub Actions
   
   **📋 See `GITHUB_SECRETS_SETUP.md` for complete secrets configuration guide**

## Step 1: Install Dependencies

### For Cloud Functions:
```bash
cd functions
npm install
```

### For Document Processing Script:
```bash
cd scripts
npm install
```

## Step 2: Configure Firebase

1. **Set up Firestore**:
   - Go to Firebase Console → Firestore Database
   - Create database in production mode
   - Set up security rules (see Step 7)

2. **Configure GitHub Secrets** (for automated deployment):
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add `FIREBASE_TOKEN`: Run `firebase login:ci` locally and add the token
   - Verify `FIREBASE_SERVICE_ACCOUNT_GLOBYTE` is already set (for hosting)

**Note**: The project uses GitHub Actions for deployment, so manual Firebase CLI setup is optional unless you want to test locally.

## Step 3: Configure API Keys

### For GitHub Actions Deployment (Recommended):
All API keys are managed via GitHub Secrets. See `GITHUB_SECRETS_SETUP.md` for detailed instructions.

**Required Secrets:**
- `HUGGINGFACE_API_KEY` We might not need this
- `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3`
- `GROQ_API_URL` (optional, has default)
- `FIREBASE_FUNCTION_URL` (set after first deployment)

### For Local Document Processing:
Create a `.env` file in the `scripts` directory:
```env
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

## Step 4: Set Up Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccountKey.json` in the project root
4. **Important**: Add `serviceAccountKey.json` to `.gitignore` to keep it secure

## Step 5: Process the Document

Run the document processing script:
```bash
cd scripts
node processDocument.js
```

This will:
- Extract text from `GlobyteBusinessPlan.docx`
- Split it into chunks
- Generate embeddings using Hugging Face
- Store everything in Firestore

**Note**: Processing may take a few minutes depending on document size.

## Step 6: Deploy Cloud Functions

### Option A: Deploy via GitHub Actions (Recommended)

The project uses GitHub Actions for automated deployment. Cloud Functions are automatically deployed when you merge to the `main` branch.

**Required GitHub Secrets:**
1. `FIREBASE_TOKEN`: Get by running `firebase login:ci` locally and copying the token
2. `FIREBASE_SERVICE_ACCOUNT_GLOBYTE`: Already configured for hosting

**To set up FIREBASE_TOKEN:**
```bash
firebase login:ci
# Copy the token and add it to GitHub Secrets
```

The workflow will:
- Install dependencies
- Deploy Cloud Functions
- Deploy Firebase Hosting

### Option B: Manual Deployment

If you prefer to deploy manually:
```bash
firebase deploy --only functions
```

After deployment, note the function URL. You'll need it for the chatbot.

## Step 7: Update Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to document chunks
    match /documentChunks/{chunkId} {
      allow read: if true; // Public read for now, restrict in production
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

## Step 8: Update Your Website

### Option A: Using Firebase SDK (Recommended)

1. Add Firebase SDK to your `index.html` (before closing `</body>` tag):
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js"></script>
<script>
  // Your Firebase config (get from Firebase Console)
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
</script>
```

2. Replace `chatbot.js` with `chatbot-rag.js`:
```html
<script src="chatbot-rag.js"></script>
```

### Option B: Direct HTTP Calls

If you prefer not to use Firebase SDK, update `chatbot-rag.js` with your Cloud Function URL:

```javascript
const functionUrl = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/searchDocuments';
```

## Step 9: Test the System

1. Open your website
2. Open the chatbot
3. Ask a question like: "What services does Globyte offer?"
4. Check the browser console for logs
5. Verify the response uses information from your business plan

## Troubleshooting

### "No documents indexed yet"
- Run the document processing script again
- Check Firestore to see if `documentChunks` collection exists

### "Search function failed"
- Verify Cloud Functions are deployed
- Check function logs: `firebase functions:log`
- Verify API keys are set correctly

### "Failed to generate embedding"
- Check Hugging Face API key is valid
- Verify internet connection
- Check rate limits on Hugging Face

### Embeddings are slow
- Consider using a faster embedding model
- Or switch to OpenAI embeddings (requires API key)

## Alternative: Using OpenAI Embeddings

If you prefer OpenAI embeddings (faster, more reliable):

1. Update `functions/index.js`:
```javascript
const OPENAI_API_KEY = functions.config().openai?.api_key;
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';

async function generateEmbedding(text) {
  const response = await axios.post(
    OPENAI_EMBEDDING_URL,
    {
      input: text,
      model: 'text-embedding-3-small'
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.data[0].embedding;
}
```

2. Set the API key:
```bash
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"
```

## Production Considerations

1. **Security**: Restrict Firestore read access to authenticated users or use Cloud Functions only
2. **Rate Limiting**: Implement rate limiting for the search function
3. **Caching**: Cache frequently asked questions
4. **Monitoring**: Set up Firebase monitoring and alerts
5. **Costs**: Monitor Firestore read/write costs and API usage

## Support

For issues or questions, contact the development team or check Firebase documentation.
