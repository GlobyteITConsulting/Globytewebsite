/**
 * Document Processing Script
 * 
 * This script processes the GlobyteBusinessPlan.docx file,
 * splits it into chunks, and stores them in Firestore.
 * Uses keyword-based search instead of embeddings for simplicity.
 * 
 * Run: node scripts/processDocument.js
 */

const admin = require('firebase-admin');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Extract keywords from text for search indexing
 */
function extractKeywords(text) {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom',
    'their', 'its', 'his', 'her', 'our', 'your', 'my', 'more', 'most', 'other', 'into'
  ]);
  
  // Extract words, convert to lowercase, filter stop words and short words
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  // Count word frequency and return unique keywords
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Return top keywords sorted by frequency
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
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
    
    // Move forward, but ensure we always make progress
    if (end >= text.length) {
      break; // We've reached the end
    }
    
    start = start + chunkSize - overlap;
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
    console.log('🔄 Processing chunks and extracting keywords...');
    let processed = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Extract keywords for search
        const keywords = extractKeywords(chunk);
        
        // Store in Firestore
        await db.collection('documentChunks').add({
          text: chunk,
          keywords: keywords,
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
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error.message);
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
