# 🚀 NEURONOTES Deployment on Render using Docker + PostgreSQL

This guide walks you through deploying **NeuroNotes** as a production-grade full-stack knowledge vault with a containerized frontend/backend and a persistent PostgreSQL database.

---

## PHASE 1 — PREPARE DATABASE

### STEP 1 — Create Free PostgreSQL Database
1. Go to: [https://neon.tech](https://neon.tech) and create a free account.
2. Create a new project:
   * **Project Name**: `neuronotes`
   * **Database Name**: `neuronotesdb`
3. Copy the database connection string from the Neon dashboard.
   * Example: `DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require`
   * Keep this safe.

---

## PHASE 2 — MODIFY BACKEND FOR POSTGRESQL

### STEP 2 — Install PostgreSQL Driver
Inside backend:
```bash
cd backend
npm install pg dotenv
```

### STEP 3 — Create .env
Create a `.env` file inside the `backend` folder:
```env
DATABASE_URL=your_neon_database_url
PORT=3000
```

### STEP 4 — Create database.js
Replace the SQLite pool configuration in [backend/database.js](file:///c:/Users/Amish%20Verma/Desktop/Home/Notes_web/backend/database.js) to use PostgreSQL pooling:
```javascript
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
```

### STEP 5 — Query Example
Standard SQL queries execute using pool wrappers:
```javascript
const result = await pool.query('SELECT * FROM notes');
console.log(result.rows);
```

### STEP 6 — Create Tables
Express will automatically execute creation tables on startup:
```javascript
await pool.query(`
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);
```

---

## PHASE 3 — SERVE FRONTEND THROUGH EXPRESS

### STEP 7 — Configure Express
At the end of [backend/server.js](file:///c:/Users/Amish%20Verma/Desktop/Home/Notes_web/backend/server.js), add the static asset serving logic:
```javascript
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDist = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
```

---

## PHASE 4 — DOCKERIZE APP

### STEP 8 — Root package.json
Configure the root-level scripts in [package.json](file:///c:/Users/Amish%20Verma/Desktop/Home/Notes_web/package.json):
```json
{
  "name": "neuronotes",
  "private": true,
  "scripts": {
    "install:all": "cd frontend && npm install && cd ../backend && npm install",
    "build": "cd frontend && npm run build",
    "start": "node backend/server.js"
  }
}
```

### STEP 9 — Create Dockerfile
Create [Dockerfile](file:///c:/Users/Amish%20Verma/Desktop/Home/Notes_web/Dockerfile) at the root:
```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm run install:all

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

### STEP 10 — Create .dockerignore
Create [.dockerignore](file:///c:/Users/Amish%20Verma/Desktop/Home/Notes_web/.dockerignore) at the root:
```
node_modules
frontend/node_modules
backend/node_modules
.git
```

---

## PHASE 5 — LOCAL TEST

### STEP 11 — Build Docker Image
```bash
docker build -t neuronotes .
```

### STEP 12 — Run Container
```bash
docker run -p 3000:3000 neuronotes
```
Open: [http://localhost:3000](http://localhost:3000) inside your browser. If the vault loads, your application is deployment-ready! ✅

---

## PHASE 6 — PUSH TO GITHUB

### STEP 13 — Initialize Git
```bash
git init
git add .
git commit -m "Initial commit"
```

### STEP 14 — Push Repository
```bash
git remote add origin YOUR_GITHUB_REPO
git branch -M main
git push -u origin main
```

---

## PHASE 7 — DEPLOY ON RENDER

### STEP 15 — Create Render Web Service
1. Go to: [https://render.com](https://render.com)
2. Click **New + > Web Service**.
3. Link your connected GitHub repository.

### STEP 16 — Configure Service
Configure the deployment details:
* **Runtime**: `Docker`
* **Branch**: `main`
*(Render will automatically pick up your Dockerfile and compile).*

### STEP 17 — Add Environment Variables
Inside the **Environment** tab on Render, add:
* `DATABASE_URL`: `your_neon_connection_string`
* `PORT`: `3000`

### STEP 18 — Deploy
Click **Create Web Service**. Render will now:
* Build the Docker image
* Compile the React client
* Connect the Neon PostgreSQL database
* Deploy your Cyberpunk Vault globally! 🌌

---

## PHASE 8 — CUSTOM DOMAIN (OPTIONAL)
Inside Render settings:
1. Navigate to **Settings > Custom Domains**.
2. Add your custom domain (e.g. `neuronotes.tech`).

---

## PHASE 9 — POST-DEPLOYMENT VERIFICATION & OPTIMIZATIONS

### STEP 19 — Verify Console Deploy Logs
Once the deploy finishes, click on **Logs** in the Render sidebar. You should witness the database initialization outputs:
```text
PostgreSQL database tables successfully initialized or checked.
Seeding initial Cyberpunk knowledge database into PostgreSQL...
Seed into PostgreSQL completed successfully.
===================================================
   NEURONOTES SECURE VAULT ENGINE STARTED          
   GATEWAY: http://localhost:3000               
===================================================
```

### STEP 20 — Prevent Free Tier "Cold Starts"
Render free-tier instances spin down after **15 minutes of inactivity**. The first visitor after a spin-down will experience a **50-60 second delay** while the Docker container boots back up.
* **Workaround**: Create a free account on [UptimeRobot](https://uptimerobot.com/) or a similar service.
* Add a **HTTP(s) Monitor** pointing to your API health check: `https://your-app-name.onrender.com/api/tree`.
* Set the interval to **every 10 or 12 minutes**. This sends a lightweight ping, keeping the container active and warm 24/7!

### STEP 21 — Address Ephemeral Image Uploads
Since Docker containers on Render free-tier are stateless and ephemeral, files uploaded using the local Multer system (saved under `backend/uploads/`) **will be lost** when the container sleeps or redeploys.
* **Free Strategy**: When inserting images, upload them to a free public hosting service (e.g., Imgur, PostImages, or your own GitHub repository) and paste the link in standard markdown syntax: `![Alt Text](https://imgur.com/your-image-link.png)`.
* **Pro Strategy**: Integrate cloud object storage like **Cloudinary** or **Supabase Storage** into `backend/server.js` using their Node SDKs to stream uploads directly to cloud storage.

### STEP 22 — Auto-Deploy on Push
Render connects to your GitHub repository and enables **Auto-Deploy** by default. Every time you push a commit (`git push origin main`), Render will automatically pull the changes, rebuild the Docker container, compile the React assets, and deploy the update with zero downtime!
* You can toggle this setting under **Settings > Auto-Deploy** to manage build frequency.

