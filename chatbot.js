// =============================
// Chatbot - Globyte Assistant
// =============================

// DOM Elements
const chatbotFab = document.getElementById('chatbotFab');
const chatbotContainer = document.getElementById('chatbotContainer');
const closeChatbotBtn = document.getElementById('closeChatbot');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChat');

// Store chat history
let chatHistory = [];

// API Configuration
const GROQ_API_URL = process.env.GROQ_API_URL;
let currentKeyIndex = 0;

// Load API keys from environment variables
const GROQ_API_KEYS = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
].filter(key => key !== undefined && key !== null);

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

// Get next API key without incrementing the index
function getCurrentApiKey() {
    return GROQ_API_KEYS[currentKeyIndex];
}

// Move to next API key
function moveToNextApiKey() {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
    console.log(`🔑 Moved to API key index: ${currentKeyIndex}`);
}

// -----------------------------
// Knowledge Base
// -----------------------------
const knowledgeBase = {
  "Globyte": "Globyte is an IT and business consulting firm helping organizations modernize technology, strengthen cybersecurity, streamline operations, and achieve sustainable growth.",
  
  "Mission": "Driving Innovation. Powering Businesses. Globyte delivers IT and business consulting services aligned with long-term growth, resilience, and efficiency.",
  
  "Why Choose Globyte": "Our team is made up of cloud-certified architects, UI/UX designers, full-stack developers, and strategic partners, supported by interns and consultants. We deliver innovative, flexible, and customized solutions.",
  
  "Services": "We provide IT strategy & planning, systems integration, cybersecurity, cloud computing, managed IT services, software development, IT support, data management, analytics, training, emerging technologies consulting, AI/ML integration, and business consulting.",
  
  // --- Core Services ---
  "IT Strategy & Planning": "We align IT with business goals, ensuring technology supports long-term growth and strategic vision.",
  "Systems Integration": "We connect platforms and tools to create seamless, automated workflows across your organization.",
  "Cybersecurity Services": "We safeguard digital assets with risk assessments, encryption, firewalls, compliance, and incident response planning.",
  "Cloud Computing": "We help businesses adopt and manage AWS, Azure, and Google Cloud with scalable, cost-efficient solutions.",
  "Managed IT Services": "We proactively monitor, maintain, and optimize IT systems to prevent downtime and improve performance.",
  "Software Development": "We design and develop tailored applications to meet unique business needs, from concept to deployment.",
  "IT Support": "Reliable troubleshooting and technical support for issues that arise with your IT infrastructure.",
  "Data Management": "We implement secure storage, backup, governance, and advanced analytics for actionable business insights.",
  "AI & Machine Learning": "We integrate AI solutions like predictive analytics, workflow automation, and intelligent chatbots.",
  "Business Consulting": "We optimize processes to increase efficiency, reduce costs, and drive growth.",
  
  // --- Process Steps ---
  "Process": "Our consulting process includes 5 steps: Discovery & Assessment, Gap Analysis & Strategy Alignment, Solution Design, Implementation & Integration, Monitoring & Continuous Improvement.",
  "Discovery & Assessment": "Step 1. We review business goals, assess technology, interview stakeholders, and analyze data. Deliverables: current-state analysis, pain point map, opportunity matrix.",
  "Gap Analysis & Strategy Alignment": "Step 2. We identify operational inefficiencies, benchmark best practices, and align IT with business priorities. Deliverables: gap analysis report, roadmap, and initiatives.",
  "Solution Design": "Step 3. We design optimized workflows, IT architecture, and data strategies while ensuring compliance and security. Deliverables: future-state process maps and solution proposals.",
  "Implementation & Integration": "Step 4. We manage projects, integrate systems (ERP, CRM, data platforms), provide training, and test solutions. Deliverables: go-live plans, training docs, configurations.",
  "Monitoring & Continuous Improvement": "Step 5. We define KPIs, monitor systems, collect feedback, and maintain an innovation pipeline. Deliverables: post-implementation reviews, dashboards, improvement backlog.",
  
  // --- Team ---
  "Team": "Our leadership team includes: Hiruy Shita (Principal Architect & Data Solutions Lead), Ablante Legesse (Data & AI Strategist), Alex Belay (Business Process Optimization Lead), Michael Alemu (Tech Lead - Microsoft & Azure), and Befkadu Gebru (Cloud & DevOps Lead).",
  
  // --- Practical Info ---
  "Location": "please reach us at globyteconsulting@gmail.com or call +17202803704.",
  "Contact": "You can reach us at globyteconsulting@gmail.com or call +17202803704.",
  "Consultation": "To schedule a consultation, please reach out via email or phone. We'll be happy to discuss your project."
};

// Search FAQ
function searchFAQ(question) {
    const lowerQuestion = question.toLowerCase();
    for (const [key, value] of Object.entries(knowledgeBase)) {
        if (lowerQuestion.includes(key.toLowerCase())) {
            return value;
        }
    }
    return null;
}

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

        // Simple responses
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

        // Check knowledge base
        const faqResponse = searchFAQ(prompt);
        if (faqResponse) {
            hideLoadingIndicator();
            appendMessage(faqResponse, 'bot');
            return;
        }

        // Fallback: Use Groq API
        const context = Object.entries(knowledgeBase)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n\n");

        const messages = [
            {
                role: "system",
                content: `You are a helpful customer service assistant for Globyte It and Business consulting, a consulting firm dedicated to helping organizations. 
                Use the following information to answer questions accurately and helpfully:
                
                ${context}
                
                If you don't know the answer based on the provided information, politely say so and offer to connect the user with a human representative.
                Keep your responses concise and focused on the user's question.`
            },
            {
                role: "user",
                content: prompt
            }
        ];

        let data = null;
        let lastError = null;
        let attempts = 0;
        const maxAttempts = GROQ_API_KEYS.length;

        // Try all keys until we get a successful response
        while (attempts < maxAttempts) {
            const apiKey = getCurrentApiKey();
            console.log(`🔑 Attempt ${attempts + 1}: Using API key index: ${currentKeyIndex}`);
            
            try {
                const response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 1024
                    })
                });

                if (response.ok) {
                    data = await response.json();
                    break; // success, exit loop
                } else {
                    lastError = new Error(`API error: ${response.status} ${response.statusText}`);
                    console.warn(`⚠️ API key index ${currentKeyIndex} failed with status: ${response.status}`);
                    
                    // Move to next key for next attempt
                    moveToNextApiKey();
                    attempts++;
                }
            } catch (err) {
                lastError = err;
                console.warn(`⚠️ API key index ${currentKeyIndex} failed with error: ${err.message}`);
                
                // Move to next key for next attempt
                moveToNextApiKey();
                attempts++;
            }
        }

        hideLoadingIndicator();

        if (data && data.choices && data.choices.length > 0) {
            const botResponse = data.choices[0].message.content;
            appendMessage(botResponse, 'bot');
        } else {
            console.error('All API keys failed:', lastError);
            appendMessage("I'm not sure how to answer that. Would you like me to connect you with a human representative?", 'bot');
        }

    } catch (error) {
        console.error('Unexpected error:', error);
        hideLoadingIndicator();
        appendMessage("I'm having trouble connecting right now. Please try again later or contact us directly.", 'bot');
    }
}

// -----------------------------
// Event Listeners
// -----------------------------
chatbotFab.addEventListener('click', toggleChatbot);
closeChatbotBtn.addEventListener('click', toggleChatbot);
sendChatBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});