# Medicine Information and Drug Interaction Checker

A comprehensive medicine information application that provides detailed insights into medications, their uses, and categories.

## Features

- Extensive medicine database with categorization (219 medicines across 38 categories)
- Powerful medicine search and filtering capabilities
- Detailed medication information including uses, side effects, and contraindications
- Real-time drug interaction checker using WebSockets
- Support for pharmaceutical and natural medicines
- Mobile-responsive user interface

## Technology Stack

- Frontend: React with TypeScript, TailwindCSS, and Shadcn UI components
- Backend: Node.js with Express
- Database: PostgreSQL
- WebSockets for real-time drug interaction checking
- Drizzle ORM for database operations

## Deployment to Railway.app

### Prerequisites

1. Have a [Railway.app](https://railway.app) account
2. Fork or clone this repository to your GitHub account

### Steps to Deploy

1. Log in to [Railway.app](https://railway.app)

2. Create a new project:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose the repository containing this code
   - Railway will automatically detect it's a Node.js application

3. Add a PostgreSQL database:
   - In your project dashboard, click "New"
   - Select "Database" then "PostgreSQL"
   - Wait for the database to be provisioned

4. Set Environment Variables:
   - Railway will automatically set `DATABASE_URL` when you create a PostgreSQL database
   - Add `NODE_ENV=production` in the Variables section

5. Deploy your project:
   - Railway will automatically deploy your application
   - You can view deployment logs in the Deployments tab
   - Once deployed, click on "Domains" to get your application URL

### Alternative: Deploy via CLI

If you prefer using the command line:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link your local repository to the Railway project
railway link

# Deploy your application
railway up
```

### Important Notes

- The application will automatically create and seed the database tables on first deployment
- Database contains 219 medicines and 42 drug interactions by default
- WebSocket connections are used for real-time drug interaction checking
- Railway free tier has some usage limitations, check their documentation for details
- For persistent deployments, upgrade to a paid Railway plan