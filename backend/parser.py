import re
import pandas as pd

def parse_chat(filepath):
    pattern = r'(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2}\s?[apm]{2})\s-\s(.*?):\s(.*)'
    
    messages = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            match = re.match(pattern, line)
            if match:
                date, time, sender, message = match.groups()
                messages.append({
                    'date': date,
                    'time': time,
                    'sender': sender,
                    'message': message
                })
    
    df = pd.DataFrame(messages)
    return df

# Test it
df = parse_chat('chat.txt')
print(df.head(10))
print(f"\nTotal messages: {len(df)}")