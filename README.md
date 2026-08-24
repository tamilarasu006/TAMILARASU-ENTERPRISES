# Tamilarasu Enterprises - MERN Stack Architecture

This project consists of three parts:
- **/server** (Node.js, Express, PostgreSQL, Prisma, Socket.IO)
- **/client** (React, Vite, Tailwind CSS - Customer Frontend)
- **/admin** (React, Vite, Tailwind CSS - Admin Portal)

## 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Cloud like Supabase/Render)

## 2. Server Setup
1. Navigate to \`/server\`: \`cd server\`
2. Copy \`.env.example\` to \`.env\`: \`cp .env.example .env\`
3. Update the \`DATABASE_URL\` in \`.env\` with your PostgreSQL connection string.
4. Run migrations to create the database schema:
   \`\`\`bash
   npx prisma db push
   \`\`\`
5. Start the backend server:
   \`\`\`bash
   npm run start (or node src/app.js)
   \`\`\`
*(By default, the server runs on port 5000)*

## 3. Client Setup
1. Open a new terminal and navigate to \`/client\`: \`cd client\`
2. Start the customer frontend:
   \`\`\`bash
   npm run dev
   \`\`\`
*(By default, it runs on http://localhost:5173)*

## 4. Admin Setup
1. Open a new terminal and navigate to \`/admin\`: \`cd admin\`
2. Start the admin portal:
   \`\`\`bash
   npm run dev
   \`\`\`
*(By default, it runs on http://localhost:5174)*

## Deployment Instructions

### Frontend (/client) & Admin (/admin)
Both are static React applications built with Vite.
- **Vercel / Netlify**: 
  - Root Directory: \`client\` (and another project for \`admin\`)
  - Build Command: \`npm run build\`
  - Output Directory: \`dist\`

### Backend (/server)
- **Render / Railway**:
  - Root Directory: \`server\`
  - Build Command: \`npm install\`
  - Start Command: \`node src/app.js\`
  - Environment Variables: Set \`DATABASE_URL\`, \`JWT_SECRET\`, \`CLIENT_URL\`, \`ADMIN_URL\` in the platform's dashboard.

### Database
- Use a managed PostgreSQL service like **Supabase**, **Render Postgres**, or **AWS RDS**. Grab the connection string and supply it as \`DATABASE_URL\` to your backend.
