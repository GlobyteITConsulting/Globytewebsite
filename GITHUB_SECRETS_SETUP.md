# GitHub Secrets Setup Guide

This guide explains how to configure GitHub Secrets for the RAG system deployment.

## Required GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. Firebase Secrets (Already Configured)
- ✅ `FIREBASE_TOKEN` - Firebase CI token (get via `firebase login:ci`)
- ✅ `FIREBASE_SERVICE_ACCOUNT_GLOBYTE` - Service account JSON for hosting

### 2. RAG System Secrets (New - Add These)

#### For Cloud Functions (Backend):
- **`HUGGINGFACE_API_KEY`**
  - Get from: https://huggingface.co/settings/tokens
  - Create a token with "Read" permissions
  - Used for generating embeddings

- **`OPENAI_API_KEY`** (Optional - if using OpenAI embeddings instead)
  - Get from: https://platform.openai.com/api-keys
  - Only needed if you switch from Hugging Face to OpenAI

#### For Frontend Chatbot:
- **`GROQ_API_URL`**
  - Value: `https://api.groq.com/openai/v1/chat/completions`
  - Or leave as default in code

- **`GROQ_API_KEY_1`**
  - Get from: https://console.groq.com/keys
  - Primary API key for Groq

- **`GROQ_API_KEY_2`** (Optional)
  - Secondary API key for failover

- **`GROQ_API_KEY_3`** (Optional)
  - Tertiary API key for failover

- **`FIREBASE_FUNCTION_URL`**
  - Format: `https://YOUR_REGION-globyteus.cloudfunctions.net`
  - Example: `https://us-central1-globyteus.cloudfunctions.net`
  - You'll get this after first Cloud Functions deployment
  - Or check Firebase Console → Functions → searchDocuments → Copy URL

## How It Works

### During Deployment:

1. **GitHub Actions workflow runs** when you push to `main`
2. **Placeholders are replaced** in the code:
   - `__HUGGINGFACE_API_KEY__` → Your actual API key
   - `__GROQ_API_KEY_1__` → Your actual Groq key
   - etc.
3. **Functions are deployed** with the replaced values
4. **Frontend files are deployed** with the replaced values

### Placeholder Format:

The code uses placeholders like:
```javascript
const API_KEY = '__HUGGINGFACE_API_KEY__';
```

GitHub Actions replaces them with:
```javascript
const API_KEY = 'hf_abc123xyz...';
```

## Setting Up Secrets

### Step 1: Get Your API Keys

1. **Hugging Face**:
   ```bash
   # Visit https://huggingface.co/settings/tokens
   # Click "New token"
   # Name: "Globyte RAG"
   # Type: Read
   # Copy the token (starts with hf_)
   ```

2. **Groq**:
   ```bash
   # Visit https://console.groq.com/keys
   # Create API key
   # Copy the key
   ```

3. **Firebase Function URL**:
   ```bash
   # After first deployment, check:
   # Firebase Console → Functions → searchDocuments
   # Or run: firebase functions:list
   ```

### Step 2: Add to GitHub Secrets

1. Go to: `https://github.com/YOUR_USERNAME/Globytewebsite/settings/secrets/actions`
2. Click **"New repository secret"**
3. Add each secret:
   - Name: `HUGGINGFACE_API_KEY`
   - Value: `hf_your_token_here`
   - Click **"Add secret"**
4. Repeat for all secrets

### Step 3: Verify Secrets Are Set

You can verify secrets are configured (but not see their values) in:
- Repository → Settings → Secrets and variables → Actions

## Security Best Practices

1. ✅ **Never commit secrets** to the repository
2. ✅ **Use GitHub Secrets** for all sensitive values
3. ✅ **Rotate keys regularly** (every 90 days recommended)
4. ✅ **Use different keys** for development and production if needed
5. ✅ **Limit key permissions** (e.g., Hugging Face "Read" only)

## Troubleshooting

### "Placeholder not replaced"
- Check secret name matches exactly (case-sensitive)
- Verify secret is set in GitHub repository settings
- Check workflow logs for replacement step

### "API key invalid"
- Verify the key is correct (no extra spaces)
- Check key hasn't expired
- Verify key has correct permissions

### "Function URL not found"
- Deploy functions first: `firebase deploy --only functions`
- Check Firebase Console for the actual URL
- Update the `FIREBASE_FUNCTION_URL` secret

## Local Development

For local development, create a `.env` file (not committed):

```env
HUGGINGFACE_API_KEY=hf_your_key_here
GROQ_API_KEY_1=your_groq_key_here
GROQ_API_KEY_2=your_groq_key_2_here
GROQ_API_KEY_3=your_groq_key_3_here
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
FIREBASE_FUNCTION_URL=https://us-central1-globyteus.cloudfunctions.net
```

Then run the replacement script:
```bash
chmod +x scripts/replace-secrets.sh
source .env
./scripts/replace-secrets.sh
```

## Example: Complete Secret List

Here's a checklist of all secrets you need:

- [ ] `FIREBASE_TOKEN`
- [ ] `FIREBASE_SERVICE_ACCOUNT_GLOBYTE`
- [ ] `HUGGINGFACE_API_KEY`
- [ ] `GROQ_API_URL` (optional, has default)
- [ ] `GROQ_API_KEY_1`
- [ ] `GROQ_API_KEY_2` (optional)
- [ ] `GROQ_API_KEY_3` (optional)
- [ ] `FIREBASE_FUNCTION_URL`

## Next Steps

After setting up secrets:
1. Push to `main` branch
2. GitHub Actions will automatically deploy
3. Check deployment logs to verify placeholders were replaced
4. Test the chatbot on your live site
