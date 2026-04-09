// =============================
// Chatbot - Globyte Assistant with RAG
// =============================

// Initialize Firebase (you'll need to add Firebase SDK to your HTML)
// Make sure to include: <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js"></script>

// DOM Elements
const chatbotFab = document.getElementById('chatbotFab');
const chatbotContainer = document.getElementById('chatbotContainer');
const closeChatbotBtn = document.getElementById('closeChatbot');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChat');

// Store chat history
let chatHistory = [];

// ===========================================
// GOOGLE GEMINI API CONFIGURATION
// ===========================================
const GEMINI_API_KEY_PLACEHOLDER = '__GEMINI_API_KEY__';
const GEMINI_API_KEY = (GEMINI_API_KEY_PLACEHOLDER.startsWith('__')) 
    ? '' // Will be replaced by GitHub Actions
    : GEMINI_API_KEY_PLACEHOLDER;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ===========================================
// GROQ API CONFIGURATION (COMMENTED OUT - KEPT FOR FUTURE USE)
// ===========================================
/*
// API Configuration - Placeholders will be replaced by GitHub Actions
// GitHub Secrets: GROQ_API_URL, GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3, FIREBASE_FUNCTION_URL
const GROQ_API_URL_PLACEHOLDER = '__GROQ_API_URL__';
const GROQ_API_URL = (GROQ_API_URL_PLACEHOLDER.startsWith('__')) 
    ? 'https://api.groq.com/openai/v1/chat/completions' 
    : GROQ_API_URL_PLACEHOLDER;
let currentKeyIndex = 0;

// Load API keys - placeholders will be replaced during deployment
const GROQ_API_KEYS = [
    '__GROQ_API_KEY_1__',
    '__GROQ_API_KEY_2__',
    '__GROQ_API_KEY_3__'
].filter(key => key && !key.startsWith('__') && !key.endsWith('__'));

// Get current API key
function getCurrentApiKey() {
    return GROQ_API_KEYS[currentKeyIndex];
}

// Move to next API key
function moveToNextApiKey() {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
    console.log(`🔑 Moved to API key index: ${currentKeyIndex}`);
}
*/

// Firebase Function URL - placeholder will be replaced
const FIREBASE_FUNCTION_URL_PLACEHOLDER = '__FIREBASE_FUNCTION_URL__';
const FIREBASE_FUNCTION_URL = (FIREBASE_FUNCTION_URL_PLACEHOLDER.startsWith('__'))
    ? ''
    : FIREBASE_FUNCTION_URL_PLACEHOLDER;

// Initialize Firebase Functions (if using Firebase SDK)
let searchDocumentsFunction = null;
if (typeof firebase !== 'undefined' && firebase.functions) {
    searchDocumentsFunction = firebase.functions().httpsCallable('searchDocuments');
}

// -----------------------------
// Utility Functions
// -----------------------------

// Toggle chatbot visibility
function toggleChatbot() {
    chatbotContainer.classList.toggle('hidden');
    if (!chatbotContainer.classList.contains('hidden')) {
        if (chatHistory.length === 0) {
            appendMessage('Hello! Welcome to Globyte. How can I help you today?', 'bot');
        }
        chatInput.focus();
    }
}

// Append messages with Tailwind styling
function appendMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('flex');

    const bubble = document.createElement('div');
    if (sender === 'user') {
        bubble.className = "bg-[#3A3E56] text-white px-3 py-2 rounded-lg w-fit ml-auto my-1";
    } else {
        bubble.className = "bg-[#85B8B2] text-white px-3 py-2 rounded-lg w-fit my-1";
    }
    bubble.textContent = text;

    messageElement.appendChild(bubble);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save history
    chatHistory.push({ text, sender });
}

// Show loading indicator
function showLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loadingIndicator';
    loadingElement.className = "flex space-x-1 mt-2";
    loadingElement.innerHTML = `
        <span class="w-2 h-2 bg-[#85B8B2] rounded-full animate-bounce"></span>
        <span class="w-2 h-2 bg-[#85B8B2] rounded-full animate-bounce delay-150"></span>
        <span class="w-2 h-2 bg-[#85B8B2] rounded-full animate-bounce delay-300"></span>
    `;
    chatMessages.appendChild(loadingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideLoadingIndicator() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) loadingElement.remove();
}

// -----------------------------
// RAG Functions
// -----------------------------

/**
 * Search for relevant document chunks using Firebase Cloud Function
 */
async function searchRelevantChunks(query) {
    try {
        console.log('🔍 Searching for:', query);
        console.log('📡 Firebase SDK available:', !!searchDocumentsFunction);
        console.log('🔗 Function URL:', FIREBASE_FUNCTION_URL);
        
        // Option 1: Using Firebase Functions SDK (if available)
        if (searchDocumentsFunction) {
            console.log('Using Firebase SDK...');
            const result = await searchDocumentsFunction({ query, topK: 5 });
            console.log('SDK Result:', result);
            return result.data.chunks || [];
        }
        
        // Option 2: Direct HTTP call to Cloud Function
        const functionUrl = FIREBASE_FUNCTION_URL;
        
        // Skip if URL is still a placeholder or empty
        if (!functionUrl || functionUrl.startsWith('__')) {
            console.error('❌ FIREBASE_FUNCTION_URL not configured');
            return [];
        }
        
        console.log('Using HTTP call to:', functionUrl);
        const response = await fetch(`${functionUrl}/searchDocuments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: { query, topK: 5 } })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error('Search function failed');
        }
        
        const result = await response.json();
        console.log('HTTP Result:', result);
        return result.result?.chunks || result.chunks || [];
    } catch (error) {
        console.error('Error searching documents:', error);
        return [];
    }
}

/**
 * Generate response using RAG + Google Gemini
 */
async function generateRAGResponse(query, relevantChunks) {
    // Build context from retrieved chunks
    const context = relevantChunks
        .map((chunk, index) => `[Document ${index + 1}]\n${chunk.text}`)
        .join('\n\n---\n\n');

    const prompt = `You are a helpful customer service assistant for Globyte IT and Business Consulting, a consulting firm dedicated to helping organizations modernize technology, strengthen cybersecurity, streamline operations, and achieve sustainable growth.

Use the following context from Globyte's business plan and documentation to answer questions accurately and helpfully:

${context}

Instructions:
- Answer based primarily on the provided context
- If the context doesn't contain relevant information, politely say so and offer to connect the user with a human representative
- Keep responses concise, professional, and focused on the user's question
- If asked about services, pricing, or specific details not in the context, suggest they contact the team directly
- Always maintain a friendly and professional tone

User Question: ${query}

Please provide a helpful response:`;

    console.log('📤 Using Google Gemini API');
    console.log('📤 API Key configured:', !!GEMINI_API_KEY);
    
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Gemini API error response:', errorBody);
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Gemini response:', data);

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response from Gemini');
        }
    } catch (err) {
        console.error('Error calling Gemini:', err);
        throw err;
    }
}

/*
// ===========================================
// GROQ GENERATE RESPONSE (COMMENTED OUT - KEPT FOR FUTURE USE)
// ===========================================
async function generateRAGResponseWithGroq(query, relevantChunks) {
    // Build context from retrieved chunks
    const context = relevantChunks
        .map((chunk, index) => `[Document ${index + 1}]\n${chunk.text}`)
        .join('\n\n---\n\n');

    const systemPrompt = `You are a helpful customer service assistant for Globyte IT and Business Consulting...`;

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
    ];

    let data = null;
    let lastError = null;
    let attempts = 0;
    const maxAttempts = GROQ_API_KEYS.length;

    while (attempts < maxAttempts) {
        const apiKey = getCurrentApiKey();
        
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama3-8b-8192",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (response.ok) {
                data = await response.json();
                break;
            } else {
                const errorBody = await response.text();
                console.error('Groq API error response:', errorBody);
                lastError = new Error(`API error: ${response.status}`);
                moveToNextApiKey();
                attempts++;
            }
        } catch (err) {
            lastError = err;
            moveToNextApiKey();
            attempts++;
        }
    }

    if (data && data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
    } else {
        throw lastError || new Error('All API keys failed');
    }
}
*/

// -----------------------------
// Chat Logic
// -----------------------------
async function sendMessage() {
    const prompt = chatInput.value.trim();
    if (prompt === '') return;

    appendMessage(prompt, 'user');
    chatInput.value = '';
    showLoadingIndicator();

    try {
        const lowerPrompt = prompt.toLowerCase();

        // Simple responses (no RAG needed)
        if (["hi", "hello", "hey", "hy"].some(g => lowerPrompt.includes(g))) {
            hideLoadingIndicator();
            appendMessage("Hello 👋! How can I assist you today?", 'bot');
            return;
        }
        if (["thank", "thanks"].some(t => lowerPrompt.includes(t))) {
            hideLoadingIndicator();
            appendMessage("You're welcome! 😊 Anything else I can help you with?", 'bot');
            return;
        }
        if (["bye", "goodbye"].some(b => lowerPrompt.includes(b))) {
            hideLoadingIndicator();
            appendMessage("Goodbye! 👋 Feel free to reach out anytime.", 'bot');
            return;
        }

        // RAG: Search for relevant chunks
        console.log('🔍 Searching for relevant documents...');
        const relevantChunks = await searchRelevantChunks(prompt);
        
        if (relevantChunks.length === 0) {
            console.warn('⚠️ No relevant chunks found, using fallback response');
            hideLoadingIndicator();
            appendMessage("I'm having trouble finding specific information about that. Would you like me to connect you with a human representative who can help?", 'bot');
            return;
        }

        console.log(`✅ Found ${relevantChunks.length} relevant chunks`);

        // Generate response using RAG + Gemini
        console.log('🤖 Generating response with RAG + Gemini...');
        const botResponse = await generateRAGResponse(prompt, relevantChunks);
        
        hideLoadingIndicator();
        appendMessage(botResponse, 'bot');

    } catch (error) {
        console.error('Unexpected error:', error);
        hideLoadingIndicator();
        appendMessage("I'm having trouble connecting right now. Please try again later or contact us directly at globyteconsulting@gmail.com.", 'bot');
    }
}

// -----------------------------
// Event Listeners
// -----------------------------
if (chatbotFab) chatbotFab.addEventListener('click', toggleChatbot);
if (closeChatbotBtn) closeChatbotBtn.addEventListener('click', toggleChatbot);
if (sendChatBtn) sendChatBtn.addEventListener('click', sendMessage);
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
}
