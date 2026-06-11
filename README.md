# AI Tax Notice Response Draft Generator

**Client**: P.Suuresh & Associates (Chartered Accountancy Firm)

## Project Abstract

The "AI Tax Notice Response Draft Generator" is an automated solution designed to assist Chartered Accountants in efficiently drafting responses to routine tax notices. Handling notices from income tax and GST authorities is a critical but time-consuming task that requires legal precision and formal structuring. Currently, this manual process creates bottlenecks for senior CAs. 

This system leverages advanced Large Language Models (LLMs), specifically Google's Gemini Flash and Groq models, to automate the creation of these documents. The CA provides key inputs through a structured user interface: the notice type, the specific issue raised, relevant client facts and financial amounts, and the desired response strategy (e.g., contest, seek extension). Utilizing prompt engineering tailored to Indian tax law and formal letter formatting, the AI processes these inputs and instantaneously generates a complete, professionally structured draft response letter. 

The application is built using a modern technology stack comprising a React (Vite) frontend for a dynamic, user-friendly interface, and a Node.js/Express backend paired with a MySQL database for secure generation history storage, feedback tracking, and analytics. By reducing the initial drafting time from several hours to mere minutes, this tool empowers junior staff to initiate responses under supervision and enables senior CAs to dedicate their bandwidth to higher-value advisory services, while ensuring consistent, high-quality, and legally robust communications with tax authorities.

---

## Problem Statement

**Background**: 
P.Suuresh & Associates handles 10-15 tax notice responses per month for various clients including individuals, SMEs, and NRIs. Each response requires referencing applicable sections, structuring factual submissions, citing case law or circulars, and adhering to strict formal language required by tax authorities.

**The Problem**:
Currently, drafting tax notice response letters requires 2-3 hours of senior CA time per notice. This process is entirely manual and bottlenecked by the need for legally precise language and structured presentation. Junior staff cannot draft these letters independently due to the legal complexity, forcing senior CAs to spend valuable time on routine drafting rather than higher-value advisory work. Furthermore, inconsistent formatting and time pressures during assessment deadlines can lead to rushed responses and missed factual submissions.

**How We Solve It**:
The AI Tax Notice Response Draft Generator automates the initial drafting of these response letters. By inputting the notice type, specific issue, client facts, and desired response strategy, the AI instantly generates a professionally structured, legally accurate draft response letter. This reduces the drafting time from 2-3 hours to under 10 minutes per notice, streamlining the workflow, ensuring consistent quality, and significantly freeing up senior CA bandwidth.

---

## Key Features

- **AI-Powered Drafting**: Instant generation of structured, legally precise response letters using Google's Gemini Flash and Groq.
- **Smart Document Extraction**: Upload tax notices (PDF, JPG, PNG) and automatically extract key details to pre-fill the case details form.
- **Voice Assistant Integration**: Hands-free form filling using integrated speech-to-text capabilities.
- **Multi-language Support**: Generate response drafts in English or Hindi based on client requirements.
- **Template Management**: Save, manage, and quickly apply frequently used case details as templates.
- **Export & Share Options**: Download generated drafts as PDF or TXT, and share directly via WhatsApp, Telegram, or Email.
- **Analytics & History Dashboard**: Track generation history, view past drafts, and monitor user feedback (ratings & thumbs up/down) through an admin analytics dashboard.

---

## Technology Stack

- **Frontend**: React.js (via Vite), React Router
- **Styling & Icons**: Vanilla CSS (Modern Glassmorphism UI) & Lucide-React
- **Frontend Libraries**: Axios (API calls), jsPDF (PDF export), react-share (Social sharing)
- **Backend**: Node.js & Express.js, Multer (File uploads)
- **Database**: MySQL (using `mysql2` pool connections)
- **AI Integration**: `@google/generative-ai` (Gemini Flash) and Groq API

---

## Local Setup & Installation

If you want to run this application on your own local machine, follow the steps below:

### Prerequisites
1. **Node.js**: Ensure Node.js (v18 or higher) is installed on your system.
2. **MySQL**: A running MySQL server instance (e.g., via XAMPP, WAMP, or standalone MySQL).
3. **API Keys**: You need active API keys from Google AI Studio and Groq.

### 1. Database Configuration
1. Open your MySQL client (e.g., MySQL Workbench or phpMyAdmin).
2. The application will automatically create the required database (`tax_notice_db`) and tables on the first run, but ensure your MySQL credentials match what will be in the backend.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```
   cd backend
   ```
2. Install the backend dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add the following configuration:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=tax_notice_db
   GEMINI_API_KEY=your_google_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```
4. Start the backend server:
   ```
   npm start
   ```

### 3. Frontend Setup
1. Open a **new, separate terminal window** and navigate to the `frontend` directory:
   ```
   cd frontend
   ```
2. Install the frontend dependencies:
   ```
   npm install
   ```
3. Start the Vite development server:
   ```
   npm run dev
   ```
4. The terminal will provide a local URL (usually `http://localhost:5173`). Open this URL in your web browser to use the application!
