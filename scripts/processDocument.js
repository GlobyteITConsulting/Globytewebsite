/**
 * Document Processing Script
 * 
 * This script processes the GlobyteBusinessPlan.docx file,
 * splits it into chunks, generates embeddings, and stores them in Firestore.
 * 
 * Run: node scripts/processDocument.js
 */

const admin = require('firebase-admin');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configuration
// For local processing, use .env file or environment variables
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
if (!HUGGINGFACE_API_KEY) {
  console.error('❌ HUGGINGFACE_API_KEY not found in environment variables');
  console.error('   Create a .env file or set the environment variable');
  process.exit(1);
}
const HUGGINGFACE_EMBEDDING_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';

// Alternative: Use OpenAI embeddings
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
  try {
    const response = await axios.post(
      HUGGINGFACE_EMBEDDING_URL,
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    // Handle response format
    if (Array.isArray(response.data)) {
      return response.data[0];
    }
    return response.data;
  } catch (error) {
    console.error('Error generating embedding:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Split text into chunks with overlap
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap; // Overlap to maintain context
  }
  
  return chunks;
}

/**
 * Process document and store in Firestore
 */
async function processDocument() {
  try {
    console.log('📄 Starting document processing...');
    
    // Read the .docx file
    const docPath = path.join(__dirname, '..', 'GlobyteBusinessPlan.docx');
    
    if (!fs.existsSync(docPath)) {
      throw new Error(`Document not found at: ${docPath}`);
    }

    console.log('📖 Extracting text from document...');
    const result = await mammoth.extractRawText({ path: docPath });
    const text = result.value;

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document');
    }

    console.log(`✅ Extracted ${text.length} characters`);
    
    // Split into chunks
    console.log('✂️ Splitting text into chunks...');
    const chunks = chunkText(text, 500, 50);
    console.log(`✅ Created ${chunks.length} chunks`);

    // Clear existing chunks (optional - comment out if you want to keep old data)
    console.log('🗑️ Clearing existing chunks...');
    const existingChunks = await db.collection('documentChunks').get();
    const batch = db.batch();
    existingChunks.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ Cleared existing chunks');

    // Process each chunk
    console.log('🔄 Processing chunks and generating embeddings...');
    let processed = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        
        // Store in Firestore
        await db.collection('documentChunks').add({
          text: chunk,
          embedding: embedding,
          chunkIndex: i,
          metadata: {
            source: 'GlobyteBusinessPlan.docx',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            chunkSize: chunk.length
          }
        });
        
        processed++;
        if (processed % 10 === 0) {
          console.log(`   Processed ${processed}/${chunks.length} chunks...`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error.message);
        // Continue with next chunk
      }
    }

    console.log(`✅ Successfully processed ${processed}/${chunks.length} chunks`);
    console.log('🎉 Document processing complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error processing document:', error);
    process.exit(1);
  }
}

// Run the script
processDocument();
