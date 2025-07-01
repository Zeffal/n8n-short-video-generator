# N8N Short Video Generator (TypeScript/Express Version)

## Overview
This backend uses Node.js with TypeScript and Express to interface with n8n (for video generation) and Baserow (for storing/retrieving video info). The frontend is shared with the Python version.

---

## How to Run (TypeScript/Express)

1. **Install dependencies**
   ```bash
   cd typescript
   npm install
   ```

2. **Configure environment variables**
   - Put `.env` file in the typescript folder

3. **Run the TypeScript server (with auto-reload)**
   ```bash
   npm start
   ```
   The server will run at http://localhost:5050 by default.

4. **Access the app**
   - Open your browser to http://localhost:5050

---

## Notes
- Frontend files are in `typescript/static/` and `typescript/templates/`.
- Make sure your `.env` file is present and correct
- You do not need Docker for this version.
- For production, use `npm run build` then run the compiled code with Node.
