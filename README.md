# ChatAnalyzer

AI-powered WhatsApp conversation analytics. Upload any chat and get deep insights about communication patterns, sentiment trends, and relationship dynamics.

**Live Demo → [chat-analyzer-nine.vercel.app](https://chat-analyzer-nine.vercel.app)**

---

## What it does

Upload a WhatsApp `.txt` export and get:

- **Sentiment Analysis** — positive, neutral, negative breakdown using RoBERTa transformer
- **AI Summary** — brutally honest conversation analysis powered by Llama 3.3 via Groq
- **Reply Time Analysis** — who responds faster on average
- **Conversation Starters** — who initiates more
- **Compatibility Score** — formula based on message balance, positivity, reply time, and toxicity
- **Top Words** — most used words with stop word filtering for Hinglish
- **Active Hours** — when the conversation is most active
- **Message Distribution** — visual breakdown per participant

Works with personal chats, group chats, and Hinglish conversations.

---

## Tech Stack

**Frontend** — Next.js, Tailwind CSS, Recharts

**Backend** — FastAPI, pandas, Python

**AI/NLP** — HuggingFace Transformers (RoBERTa), Groq API (Llama 3.3 70B)

**Deployment** — Vercel (frontend), HuggingFace Spaces (backend)

---

## Local Setup

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:
```
GROQ_API_KEY=your_groq_api_key
```

```bash
uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## How to Export WhatsApp Chat

WhatsApp → Open any chat → Three dots → More → Export Chat → Without Media

You'll get a `.txt` file. Upload that directly.

---

## Project Structure

```
chat-analyzer/
├── backend/
│   ├── main.py          # FastAPI server, all endpoints
│   ├── parser.py        # WhatsApp chat parser
│   └── requirements.txt
└── frontend/
    └── app/
        └── page.js      # Full dashboard UI
```

---

## Sentiment Model

Uses `cardiffnlp/twitter-roberta-base-sentiment-latest` — a RoBERTa model trained on 58M tweets. Runs inference on a 100-message sample per upload. Hinglish detection routes messages to the appropriate model path.

---

## Compatibility Score Formula

```
score = (message_balance × 0.4) + (positivity × 0.3) + (reply_balance × 0.3) − toxicity_penalty
```

Only calculated for 1-on-1 chats.

---

## Live Links

| Service | URL |
|---------|-----|
| Frontend | https://chat-analyzer-nine.vercel.app |
| Backend API | https://prashik4629-chat-analyzer-backend.hf.space |
| GitHub | https://github.com/prashik4629/chat-analyzer |
