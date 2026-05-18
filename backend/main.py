from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import re
from collections import Counter
from transformers import pipeline
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

print("Loading sentiment model...")
sentiment_model_en = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
    max_length=512,
    truncation=True
)
sentiment_model_multi = sentiment_model_en
print("Model loaded!")

def parse_chat(filepath):
    patterns = [
        r'\[(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2}:\d{2}\s?[AaPp][Mm])\]\s(.*?):\s(.*)',
        r'\[(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2}\s?[AaPp][Mm])\]\s(.*?):\s(.*)',
        r'(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2}\s?[apm]{2})\s-\s(.*?):\s(.*)',
        r'(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2})\s-\s(.*?):\s(.*)',
    ]

    messages = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            for pattern in patterns:
                match = re.match(pattern, line)
                if match:
                    date, time, sender, message = match.groups()
                    messages.append({
                        'date': date,
                        'time': time,
                        'sender': sender,
                        'message': message
                    })
                    break

    if not messages:
        return pd.DataFrame(columns=['date', 'time', 'sender', 'message'])

    return pd.DataFrame(messages)

def clean_dataframe(df):
    df = df.dropna(subset=['sender', 'message'])
    df['sender'] = df['sender'].str.replace('\u200e', '', regex=False).str.strip()
    df = df[~df['sender'].str.lower().isin(['you'])]
    system_starts = (
        'you created', 'you changed', 'messages and calls',
        'you added', 'missed voice', 'missed video',
        'end-to-end encrypted', 'you removed', 'left',
        'added you', 'changed the group'
    )
    df = df[~df['message'].str.lower().str.startswith(system_starts)]
    df = df[df['sender'].str.len() < 50]
    df = df.reset_index(drop=True)
    return df

hindi_words = {
    'nhi', 'haa', 'bhai', 'yaar', 'kar', 'rha', 'kya',
    'mai', 'tera', 'mera', 'acha', 'thik', 'bas', 'abhi',
    'kuch', 'toh', 'bhi', 'aur', 'haan', 'nahi', 'tha',
    'raha', 'gaya', 'bol', 'sun', 'dekh', 'chal', 'bata'
}

def get_sentiment(message):
    words = set(str(message).lower().split())
    is_hinglish = len(words.intersection(hindi_words)) > 0
    try:
        if is_hinglish:
            result = sentiment_model_multi([message])[0]
        else:
            result = sentiment_model_en([message])[0]
        return result['label'].lower()
    except:
        return 'neutral'

def get_best_context(df):
    # Layer 1: First 50 — how it started
    first = df.head(50)

    # Layer 2: Evenly spaced 100 — overall vibe
    step = max(1, len(df) // 100)
    evenly_spaced = df.iloc[::step].head(100)

    # Layer 3: Middle 50 — peak period
    mid = len(df) // 2
    middle = df.iloc[max(0, mid-25):mid+25]

    # Layer 4: Last 100 — recent dynamic
    last = df.tail(100)

    # Merge, deduplicate, sort
    context_df = pd.concat([first, evenly_spaced, middle, last])
    context_df = context_df.drop_duplicates()
    context_df = context_df.sort_values('datetime')

    sample_text = "\n".join([
        f"{row['sender']}: {row['message']}"
        for _, row in context_df.iterrows()
        if str(row['message']).strip() not in ['', 'None', 'nan']
    ])

    return sample_text

def generate_ai_summary(stats: dict, sample_text: str) -> str:
    is_group = len(stats['senders']) > 2

    prompt = f"""You are a razor-sharp conversation analyst — part psychologist, part roast comedian, part honest friend. You read between the lines and say what others won't.

HARD DATA:
- Participants: {', '.join(stats['senders'])}
- Total Messages: {stats['total_messages']}
- Message breakdown: {stats['messages_per_sender']}
- Sentiment: {stats['sentiment']['positive']}% positive, {stats['sentiment']['neutral']}% neutral, {stats['sentiment']['negative']}% negative
- Average reply times: {stats['avg_reply_time']} minutes
- Who starts conversations: {stats['conversation_starter']}
- Most used words: {list(stats['top_words'].keys())[:7]}
- Peak hours: {list(stats['hourly_activity'].keys())[:5]}
{"- Compatibility Score: " + str(stats.get('compatibility_score')) + "%" if not is_group else "- This is a group chat"}

ACTUAL CONVERSATION SAMPLE (300 messages from across the entire chat timeline):
{sample_text}

Your job: Write a 6-8 line paragraph that feels like a smart friend who read their whole chat and has OPINIONS.

Must include:
- Who is putting more effort and what that says about the dynamic
- The real vibe/energy of this conversation (not just "neutral" — dig deeper from actual messages)
- One thing that stands out about how these people communicate
- Whether this conversation has grown, stayed same, or declined over time (you can tell from first vs recent messages)
- One brutally honest observation they probably haven't noticed
- End with one genuine suggestion that could actually help

Tone rules:
- Funny but not mean
- Honest but not harsh  
- Like a wise friend — not a robot
- Use their actual names
- Simple English — no jargon
- NO bullet points, NO headers, just one flowing paragraph
- NO asterisks or markdown formatting
- Max 8 lines"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=600
    )

    return response.choices[0].message.content

@app.post("/upload")
async def upload_chat(file: UploadFile = File(...)):
    contents = await file.read()
    with open("uploaded_chat.txt", "wb") as f:
        f.write(contents)

    df = parse_chat("uploaded_chat.txt")
    df = clean_dataframe(df)

    if len(df) == 0:
        return {"error": "Could not parse chat. Please check file format."}

    stop_words = {
        'ok', 'hi', 'haha', 'lol', 'the', 'a', 'is', 'it',
        'to', 'and', 'of', 'in', 'i', 'you', 'that', 'ha',
        'kar', 'hai', 'nahi', 'bhi', 'kya', 'ye', 'ho', 'me',
        'toh', 'na', 'ka', 'ki', 'ke', 'aur', 'tha', 'thi'
    }

    all_words = []
    for msg in df['message']:
        words = re.findall(r'\b[a-zA-Z]{3,}\b', str(msg).lower())
        all_words.extend([w for w in words if w not in stop_words])

    word_freq = dict(Counter(all_words).most_common(10))

    df['hour'] = df['time'].str.extract(r'(\d+):').astype(float)
    hourly = df.groupby('hour').size().to_dict()
    hourly_activity = {str(int(k)): int(v) for k, v in hourly.items()}

    sample_msgs = df['message'].dropna().sample(min(100, len(df))).tolist()
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for msg in sample_msgs:
        label = get_sentiment(msg)
        if 'pos' in label:
            counts['positive'] += 1
        elif 'neg' in label:
            counts['negative'] += 1
        else:
            counts['neutral'] += 1
    total = sum(counts.values())
    sentiment = {
        "positive": round(counts['positive'] / total * 100),
        "negative": round(counts['negative'] / total * 100),
        "neutral": round(counts['neutral'] / total * 100)
    }

    df['datetime'] = pd.to_datetime(df['date'] + ' ' + df['time'], errors='coerce')
    df = df.sort_values('datetime').reset_index(drop=True)

    reply_times = {sender: [] for sender in df['sender'].unique()}
    for i in range(1, len(df)):
        curr = df.iloc[i]
        prev = df.iloc[i-1]
        if curr['sender'] != prev['sender']:
            diff = (curr['datetime'] - prev['datetime']).total_seconds() / 60
            if 0 < diff < 1440:
                reply_times[curr['sender']].append(diff)

    avg_reply_time = {}
    for sender, times in reply_times.items():
        if times:
            avg_reply_time[sender] = round(sum(times) / len(times), 1)
        else:
            avg_reply_time[sender] = 0

    starter_counts = {}
    prev_date = None
    for _, row in df.iterrows():
        if row['date'] != prev_date:
            sender = row['sender']
            starter_counts[sender] = starter_counts.get(sender, 0) + 1
            prev_date = row['date']

    sender_list = df['sender'].unique().tolist()
    msg_counts = df['sender'].value_counts().to_dict()
    compatibility = None

    if len(sender_list) == 2:
        a, b = sender_list[0], sender_list[1]
        ratio = min(msg_counts.get(a, 0), msg_counts.get(b, 0)) / max(msg_counts.get(a, 1), msg_counts.get(b, 1))
        balance = round(ratio * 100)
        positivity = sentiment['positive']
        times = list(avg_reply_time.values())
        reply_balance = round(min(times) / max(times) * 100) if max(times) > 0 else 0
        toxicity_penalty = sentiment['negative']
        compatibility = round((balance * 0.4) + (positivity * 0.3) + (reply_balance * 0.3) - toxicity_penalty)
        compatibility = max(0, min(100, compatibility))

    stats = {
        "total_messages": len(df),
        "senders": sender_list,
        "messages_per_sender": msg_counts,
        "sentiment": sentiment,
        "avg_reply_time": avg_reply_time,
        "conversation_starter": starter_counts,
        "top_words": word_freq,
        "hourly_activity": hourly_activity,
        "compatibility_score": compatibility
    }

    sample_text = get_best_context(df)
    ai_summary = generate_ai_summary(stats, sample_text)

    return {
        **stats,
        "preview": df.head(5).to_dict(orient='records'),
        "ai_summary": ai_summary
    }