# Dispatch Board — Setup Guide

## Quick Start

### 1. Install dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure the server

```bash
cd server
cp ../.env.example .env
# Edit .env with your Zoho credentials (see Zoho Setup below)
```

### 3. Run in development

```bash
# Terminal 1 — server
cd server
npm run dev

# Terminal 2 — client
cd client
npm run dev
```

Open http://localhost:5173 for the manager board.

---

## Zoho CRM Setup

### Step 1 — Create a Self-Client app

1. Go to https://api-console.zoho.com
2. Click **Add Client** → **Self Client**
3. Copy your **Client ID** and **Client Secret** into `.env`

### Step 2 — Get a Refresh Token (one-time)

1. In the Self Client console, go to **Generate Code**
2. Enter this scope:
   ```
   ZohoCRM.modules.ALL,ZohoCRM.users.READ
   ```
3. Set expiry to **10 minutes**, click **Create**
4. Copy the generated code, then run this in your terminal (replace values):

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://api-console.zoho.com" \
  -d "code=YOUR_CODE"
```

5. Copy the `refresh_token` from the response into `.env`

### Step 3 — Set up Zoho Webhook (Service Order → Board)

1. In Zoho CRM: **Setup → Automation → Workflow Rules**
2. Create a new rule on module **Service Orders**
3. Trigger: **Record Created**
4. Action: **Webhook**
   - Method: `POST`
   - URL: `https://your-domain.com/api/webhooks/zoho`
   - Post Parameters: Select fields you want to send (Subject, Contact Name, Address, Description, Phone)

### Step 4 — Map Zoho field API names

1. In Zoho CRM: **Setup → Developer → APIs → CRM API** or check via **Setup → Modules → Service Orders → Fields**
2. Update your `.env` with the correct API field names for:
   - The field that will show the assigned tech's name
   - The field for dispatch priority number
   - The field for scheduled time
   - The field for dispatch status

---

## Embedding in Zoho CRM

### Manager Board (Web Tab)

1. Zoho CRM → **Setup → Customization → Web Tabs**
2. Create new Web Tab:
   - URL: `https://your-domain.com/?view=manager`
   - Open in: **Same window / Tab**

### Tech View (Embedded Widget on User Profile or custom page)

URL format: `https://your-domain.com/?view=tech&techId=TECH_DB_ID`

To find the tech's DB ID after adding them, check the `/api/technicians` endpoint.

Alternatively, embed it as a Web Tab per tech using their ID in the URL.

---

## Production Deployment

Build the client:
```bash
cd client
npm run build
```

Then serve the `client/dist` folder as static files from the Express server.

Add to `server/index.js`:
```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  }
});
```

Deploy on any Node.js host (Render, Railway, DigitalOcean, your own server).
Use a reverse proxy (nginx/Caddy) with HTTPS — required for embedding in Zoho.
