# N8N Short Video Generator (Python/Flask Version)

## Overview
This backend uses Python Flask to interface with n8n (for video generation) and Baserow (for storing/retrieving video info). The frontend is shared with the TypeScript version.

---

## How to Run (Python/Flask)

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables**
   - Put `.env` file in the python folder

3. **Run the Flask server**
   ```bash
   python python/app.py
   ```
   The server will run at http://localhost:5000 by default.

4. **Access the app**
   - Open your browser to http://localhost:5000

---

## Notes
- Frontend files are in `python/static/` and `python/templates/` (or shared at root if you use both backends).
- Make sure your `.env` file is present and correct.
