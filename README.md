# Globyte - IT & Business Consulting Website

Globyte is a professional IT and business consulting firm dedicated to helping organizations modernize their technology, strengthen cybersecurity, streamline operations, and achieve sustainable growth. This repository contains the source code for the Globyte company website.

## 🚀 Project Overview

The website serves as a digital gateway for Globyte's services, providing potential clients with insights into the firm's expertise, team, and strategic approach to digital transformation.

### Key Features
- **Responsive Design**: Optimized for all devices, from desktop to mobile.
- **Service Showcases**: Detailed sections for IT Strategy, Systems Integration, Cybersecurity, Cloud Computing, and more.
- **Interactive Team Section**: Engagement-focused team profiles with flippable cards and mobile-friendly carousels.
- **AI-Powered Chatbot**: An integrated "Globyte Assistant" powered by the Groq API (LLaMA 3.1) to provide instant answers to visitor queries.
- **Modern UI/UX**: Built with a clean aesthetic, smooth transitions, and intuitive navigation.

## 🛠️ Tech Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript.
- **Icons & Fonts**: Font Awesome, Google Fonts (PT Sans).
- **Backend/Integration**: Groq API (for Chatbot), Firebase (for Hosting).
- **CI/CD**: GitHub Actions for automated deployment to Firebase.

## 📁 Project Structure
- `index.html`: Main landing page content and layout.
- `chatbot.js`: Logic for the AI-powered chatbot.
- `firebase.json`: Configuration for Firebase Hosting.
- `.github/workflows/`: CI/CD pipelines for automated deployment.
- `Globyte images/`: Visual assets and team member photography.

## ⚙️ Local Development

### Prerequisites
- A local web server (e.g., Live Server extension for VS Code).
- (Optional) [Firebase CLI](https://firebase.google.com/docs/cli) for hosting management.

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/GlobyteITConsulting/Globytewebsite.git
   ```
2. Navigate to the project folder:
   ```bash
   cd Globytewebsite
   ```
3. Open `index.html` in your browser via a local server.

### Chatbot Configuration
The chatbot requires valid Groq API keys to function. For local testing, ensure your environment variables (`GROQ_API_URL`, `GROQ_API_KEY_1`, etc.) are configured if you're using a local development environment that supports `process.env`.

## 🚢 Deployment

The project is configured for automated deployment to Firebase Hosting.
- **Staging/PRs**: Pull requests trigger a preview deployment via `.github/workflows/firebase-hosting-pull-request.yml`.
- **Production**: Merges to the `main` branch trigger a production deployment via `.github/workflows/firebase-hosting-merge.yml`.

## 🤝 Contact
- **Email**: globytesolution@gmail.com
- **Phone**: +1 (720) 280-3704
- **Website**: [www.globytesolution.com](https://www.globytesolution.com)

---
© 2026 GLOBYTE. All rights reserved.
