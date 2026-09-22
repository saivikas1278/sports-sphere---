import json
import sys

transcript_path = r"C:\Users\Sai vikas\.gemini\antigravity-ide\brain\f7ef588d-dbfd-457b-8356-d07f44814036\.system_generated\logs\transcript.jsonl"

try:
    with open(transcript_path, 'r', encoding='utf-8', errors='ignore') as f:
        count = 0
        for line in f:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                print(f"--- USER REQUEST {count} ---")
                content = data.get("content", "")
                if isinstance(content, str):
                    print(content[:3000].encode('ascii', 'ignore').decode('ascii'))
                else:
                    print("Content is complex")
                count += 1
                if count > 5:
                    break
except Exception as e:
    print("Error:", e)
