const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * Extract keywords from query for matching
 */
function extractQueryKeywords(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'what', 'which', 'who', 'whom', 'how', 'why', 'when', 'where',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'
  ]);
  
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate keyword match score between query and chunk
 */
function calculateMatchScore(queryKeywords, chunkKeywords) {
  if (!chunkKeywords || chunkKeywords.length === 0) return 0;
  
  const chunkKeywordSet = new Set(chunkKeywords);
  let matches = 0;
  
  queryKeywords.forEach(keyword => {
    if (chunkKeywordSet.has(keyword)) {
      matches++;
    }
    // Also check for partial matches
    chunkKeywords.forEach(chunkKw => {
      if (chunkKw.includes(keyword) || keyword.includes(chunkKw)) {
        matches += 0.5;
      }
    });
  });
  
  return matches / Math.max(queryKeywords.length, 1);
}

/**
 * Search for relevant document chunks using keyword matching
 */
exports.searchDocuments = functions.https.onCall(async (data, context) => {
  try {
    // Log incoming data for debugging
    console.log('Received data:', JSON.stringify(data));
    
    // Handle different data formats (SDK vs HTTP call)
    const requestData = data || {};
    const query = requestData.query || (typeof data === 'string' ? data : null);
    const topK = requestData.topK || 5;
    
    console.log('Extracted query:', query);
    console.log('TopK:', topK);
    
    if (!query || typeof query !== 'string') {
      console.error('Query validation failed. Data received:', data);
      throw new functions.https.HttpsError('invalid-argument', 'Query is required');
    }

    // Extract keywords from query
    const queryKeywords = extractQueryKeywords(query);
    
    // Get all document chunks from Firestore
    const chunksSnapshot = await db.collection('documentChunks').get();
    
    if (chunksSnapshot.empty) {
      return { chunks: [], message: 'No documents indexed yet. Please run the indexing script first.' };
    }

    // Calculate match scores
    const matches = [];
    chunksSnapshot.forEach(doc => {
      const chunkData = doc.data();
      const chunkKeywords = chunkData.keywords || [];
      const chunkText = chunkData.text || '';
      
      // Calculate keyword match score
      let score = calculateMatchScore(queryKeywords, chunkKeywords);
      
      // Boost score if query words appear directly in text
      queryKeywords.forEach(kw => {
        if (chunkText.toLowerCase().includes(kw)) {
          score += 0.3;
        }
      });
      
      if (score > 0) {
        matches.push({
          id: doc.id,
          text: chunkData.text,
          metadata: chunkData.metadata || {},
          similarity: score
        });
      }
    });

    // Sort by score and return top K
    matches.sort((a, b) => b.similarity - a.similarity);
    const topChunks = matches.slice(0, topK);

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
