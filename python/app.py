from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)

WEBHOOK_URL = os.environ.get("WEBHOOK_URL")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/submit", methods=["POST"])
def submit():
    data = request.json

    payload = {
        "The Main Topic": data.get("mainTopic"),
        "Duration": data.get("duration"),
        "Video Type": data.get("videoType"),
        "Generative Style": "In the style of should be soft purple or dominant purple to complement the theme and recess blue neon color theme, colorful dreams. filmstock: Sony a7R IV camera, Meike dreams 85mm F1.8 --ar 1:1 --v 6.0",
        "TTS Voice": data.get("ttsVoice"),
        "Image Provider": "together.ai",
        "BGM music": os.environ.get("BGM_MUSIC"),
        "Watermark Logo": os.environ.get("WATERMARK_LOGO"),
    }

    try:
        response = requests.post(WEBHOOK_URL, json=payload)
        return jsonify({"message": "Sent to n8n", "status": response.status_code, "n8n_response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

latest_video_url = None

BASEROW_TOKEN = os.environ.get("BASEROW_TOKEN")
BASEROW_TABLE_API = os.environ.get("BASEROW_TABLE_API")
WEBHOOK_URL = os.environ.get("WEBHOOK_URL")
VIDEO_FIELD = os.environ.get("VIDEO_FIELD")

@app.route("/set_video", methods=["POST"])
def set_video():
    global latest_video_url
    data = request.json
    video_url = data.get("video_url")
    if not video_url:
        return jsonify({"error": "Missing video_url"}), 400
    return jsonify({"message": "Video URL stored successfully."})

@app.route("/get_video", methods=["GET"])
def get_video():
    headers = {"Authorization": f"Token {BASEROW_TOKEN}"}
    try:
        resp = requests.get(BASEROW_TABLE_API, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        rows = data.get("results", [])
        print(f"[DEBUG] Number of rows fetched from Baserow: {len(rows)}")
        if not rows:
            print("[DEBUG] No rows found in Baserow.")
            return jsonify({"error": "No videos found."}), 404
        latest_row = max(rows, key=lambda r: r.get("id", 0))
        print(f"[DEBUG] Latest row: {latest_row}")
        video_url = latest_row.get(VIDEO_FIELD)
        title = latest_row.get("Title", "")
        description = latest_row.get("Description", "")
        print(f"[DEBUG] Video URL in 'Video With Watermark': {video_url}")
        print(f"[DEBUG] Title: {title}")
        print(f"[DEBUG] Description: {description}")
        if not video_url:
            print("[DEBUG] No video URL found in the latest row.")
            return jsonify({"error": "No video URL available."}), 404
        return jsonify({"video_url": video_url, "title": title, "description": description})
    except Exception as e:
        print(f"[DEBUG] Exception in /get_video: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/videos", methods=["GET"])
def get_all_videos():
    headers = {
        "Authorization": f"Token {BASEROW_TOKEN}"
    }
    try:
        resp = requests.get(BASEROW_TABLE_API, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for row in data.get("results", []):
            video_url = row.get(VIDEO_FIELD)
            title = row.get("Title", "")
            description = row.get("Description", "")
            if video_url:
                results.append({
                    "id": row.get("id"),
                    "video_url": video_url,
                    "title": title,
                    "description": description,
                    "main_topic": row.get("Main Topic", ""),
                    "duration": row.get("Duration", ""),
                    "status": row.get("Status", "")
                })
        return jsonify({"videos": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)