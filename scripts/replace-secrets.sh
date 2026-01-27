#!/bin/bash
# Script to replace placeholders with actual values
# Used during local development or as a reference

# This script demonstrates how placeholders are replaced
# In GitHub Actions, this is done via sed commands

echo "Replacing placeholders with environment variables..."

# Functions
if [ -f "functions/index.js" ]; then
  sed -i.bak "s|__HUGGINGFACE_API_KEY__|${HUGGINGFACE_API_KEY}|g" functions/index.js
  echo "✅ Replaced placeholders in functions/index.js"
fi

# Frontend
if [ -f "chatbot-rag.js" ]; then
  sed -i.bak "s|__GROQ_API_URL__|${GROQ_API_URL:-https://api.groq.com/openai/v1/chat/completions}|g" chatbot-rag.js
  sed -i.bak "s|__GROQ_API_KEY_1__|${GROQ_API_KEY_1}|g" chatbot-rag.js
  sed -i.bak "s|__GROQ_API_KEY_2__|${GROQ_API_KEY_2}|g" chatbot-rag.js
  sed -i.bak "s|__GROQ_API_KEY_3__|${GROQ_API_KEY_3}|g" chatbot-rag.js
  sed -i.bak "s|__FIREBASE_FUNCTION_URL__|${FIREBASE_FUNCTION_URL}|g" chatbot-rag.js
  echo "✅ Replaced placeholders in chatbot-rag.js"
fi

echo "Done!"
