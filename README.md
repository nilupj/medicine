# Medicine Information and Drug Interaction Checker

A comprehensive medicine information application that provides detailed insights into medications, their uses, and potential interactions. Features user authentication, medication reminders, and real-time drug interaction checking.

## Features

- Extensive medicine database with categorization (219 medicines across 38 categories)
- Powerful medicine search and filtering capabilities
- Detailed medication information including uses, side effects, and contraindications
- Real-time drug interaction checker using WebSockets (supports up to 5 medications at once)
- Support for pharmaceutical and natural medicines with herbal interactions
- User authentication for personalized experience
- Medication reminder system with customizable schedules
- Medication adherence tracking
- Mobile-responsive user interface

## Technology Stack

- Frontend: React with TypeScript, TailwindCSS, and Shadcn UI components
- Backend: Node.js with Express
- Database: PostgreSQL with Drizzle ORM
- Authentication: Express-session with bcrypt
- WebSockets for real-time drug interaction checking
- Responsive design that works on mobile, tablet, and desktop

## Deployment to Railway.app

### Prerequisites

1. Have a [Railway.app](https://railway.app) account
2. Fork or clone this repository to your GitHub account

### Direct Deployment from Replit

If you're working with this project in Replit:

1. Click the "Deploy" button in the upper right corner of your Replit workspace
2. Follow the prompts to connect to your Railway account
3. Railway will automatically provision a PostgreSQL database

### Manual Deployment Steps

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
   - Add `SESSION_SECRET=your-secure-random-string` for better security

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

## Troubleshooting Deployment Issues

If you encounter any issues during deployment:

1. Check database connection:
   - Ensure that DATABASE_URL is properly set
   - The application will automatically create tables if they don't exist

2. Check for schema changes:
   - If you've modified the database schema, you might need to manually run migrations
   - The application handles initial table creation on first deploy

3. Check environment variables:
   - Ensure NODE_ENV is set to "production"
   - Make sure SESSION_SECRET is properly set

4. Check Railway logs:
   - Review deployment logs for any specific errors
   - Check the application logs for runtime errors

5. WebSocket connections:
   - If drug interaction checker isn't working, ensure WebSocket connections are properly configured

## Important Notes

- The application will automatically create and seed the database tables on first deployment
- Database contains 219 medicines and 42 drug interactions by default
- WebSocket connections are used for real-time drug interaction checking
- Railway free tier has some usage limitations, check their documentation for details
- For persistent deployments, upgrade to a paid Railway plan