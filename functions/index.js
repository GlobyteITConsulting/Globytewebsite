const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const db = admin.firestore();

// Configuration - Placeholders will be replaced by GitHub Actions
// GitHub Secrets: HUGGINGFACE_API_KEY, OPENAI_API_KEY (optional)
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '__HUGGINGFACE_API_KEY__';
const HUGGINGFACE_EMBEDDING_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';

// Alternative: Use OpenAI embeddings (uncomment if preferred)
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '__OPENAI_API_KEY__';
// const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';

/**
 * Generate embedding for text using Hugging Face API
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
        }
      }
    );
    
    // Hugging Face returns array of embeddings, take first one
    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    console.error('Error generating embedding:', error.response?.data || error.message);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for relevant document chunks using vector similarity
 */
exports.searchDocuments = functions.https.onCall(async (data, context) => {
  try {
    const { query, topK = 3 } = data;
    
    if (!query || typeof query !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Query is required');
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Get all document chunks from Firestore
    const chunksSnapshot = await db.collection('documentChunks').get();
    
    if (chunksSnapshot.empty) {
      return { chunks: [], message: 'No documents indexed yet. Please run the indexing script first.' };
    }

    // Calculate similarity scores
    const similarities = [];
    chunksSnapshot.forEach(doc => {
      const chunkData = doc.data();
      const chunkEmbedding = chunkData.embedding;
      
      if (chunkEmbedding && Array.isArray(chunkEmbedding)) {
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        similarities.push({
          id: doc.id,
          text: chunkData.text,
          metadata: chunkData.metadata || {},
          similarity: similarity
        });
      }
    });

    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topChunks = similarities.slice(0, topK).filter(item => item.similarity > 0.3); // Threshold

    return {
      chunks: topChunks,
      query: query,
      count: topChunks.length
    };
  } catch (error) {
    console.error('Error in searchDocuments:', error);
    throw new functions.https.HttpsError('internal', 'Search failed', error.message);
  }
});

/**
 * Health check endpoint
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.json({ status: 'ok', service: 'RAG Functions' });
});
