import { Database, CheckCircle, FileText, Download, Server, Terminal, Key, Shield } from 'lucide-react';
import { GuideContent } from '../types';

export const setupContent: GuideContent = {
  title: 'Setup & Installation',
  icon: Database,
  introduction:
    'This guide walks you through the complete setup process for the Hisham Traders ERP system. Follow these steps in order to install prerequisites, configure your environment, initialize the database, and start the application services.',
  tableOfContents: [
    { id: 'prerequisites', label: 'Prerequisites', level: 1 },
    { id: 'environment-setup', label: 'Environment Setup', level: 1 },
    { id: 'env-variables', label: 'Required Variables', level: 2 },
    { id: 'installation', label: 'Installation', level: 1 },
    { id: 'database-migration', label: 'Database Migration', level: 1 },
    { id: 'seed-data', label: 'Seed Data', level: 1 },
    { id: 'seed-details', label: 'What Gets Created', level: 2 },
    { id: 'gl-migration', label: 'GL Migration Script', level: 1 },
    { id: 'starting-services', label: 'Starting Services', level: 1 },
    { id: 'start-api', label: 'Start API Server', level: 2 },
    { id: 'start-web', label: 'Start Web Client', level: 2 },
    { id: 'default-credentials', label: 'Default Credentials', level: 1 },
  ],
  sections: [
    // ── Section 1: Prerequisites ──────────────────────────────────────
    {
      id: 'prerequisites',
      title: 'Prerequisites',
      icon: CheckCircle,
      content: [
        {
          type: 'paragraph',
          text: 'Before you begin the installation process, ensure that the following software is installed on your system. All three are required for the application to run correctly.',
        },
        {
          type: 'keyValue',
          pairs: [
            {
              key: 'Node.js',
              value: 'Version 18.0 or higher. Required to run the API server and build the web client. Download from https://nodejs.org.',
            },
            {
              key: 'pnpm',
              value: 'The pnpm package manager is used for dependency management across the monorepo workspaces. Install globally with: npm install -g pnpm',
            },
            {
              key: 'MySQL',
              value: 'Version 8.0 or higher. The application uses MySQL as its primary database. Ensure the MySQL server is running and you have credentials with permission to create databases.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Version Check',
          text: 'You can verify installed versions by running: node --version, pnpm --version, and mysql --version in your terminal. Ensure all meet the minimum requirements before proceeding.',
        },
      ],
    },

    // ── Section 2: Environment Setup ──────────────────────────────────
    {
      id: 'environment-setup',
      title: 'Environment Setup',
      icon: FileText,
      content: [
        {
          type: 'paragraph',
          text: 'The application uses a .env file in the project root to configure database connections, authentication secrets, and server settings. You must create this file before running any database commands or starting the application.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Create the .env File',
              description:
                'In the root directory of the project, create a new file named .env (note the leading dot). This file will hold all environment-specific configuration values.',
            },
            {
              title: 'Add Required Variables',
              description:
                'Copy the example configuration below into your .env file and replace the placeholder values with your actual database credentials and a secure JWT secret.',
            },
            {
              title: 'Save the File',
              description:
                'Save the .env file. It is already included in .gitignore, so it will not be committed to version control.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Keep .env Secure',
          text: 'The .env file contains sensitive credentials including your database password and JWT secret. Never share this file, commit it to version control, or expose it publicly. If you suspect your credentials have been compromised, rotate them immediately.',
        },
      ],
      subSections: [
        {
          id: 'env-variables',
          title: 'Required Variables',
          content: [
            {
              type: 'paragraph',
              text: 'The following environment variables must be defined in your .env file for the application to function correctly.',
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'DATABASE_URL',
                  fieldType: 'Connection String',
                  required: true,
                  description:
                    'MySQL connection string in the format: mysql://user:password@localhost:3306/hishamtraders. Replace user and password with your MySQL credentials.',
                },
                {
                  name: 'JWT_SECRET',
                  fieldType: 'String',
                  required: true,
                  description:
                    'A random, secure string used to sign and verify JWT authentication tokens. Use a long, random value (at least 32 characters).',
                },
                {
                  name: 'PORT',
                  fieldType: 'Number',
                  required: false,
                  description:
                    'The port on which the API server will listen. Defaults to 3001 if not specified.',
                },
              ],
            },
            {
              type: 'code',
              language: 'bash',
              code: `# .env - Hisham Traders ERP Configuration

DATABASE_URL="mysql://root:yourpassword@localhost:3306/hishamtraders"
JWT_SECRET="your-random-secret-string-at-least-32-characters-long"
PORT=3001`,
            },
          ],
        },
      ],
    },

    // ── Section 3: Installation ───────────────────────────────────────
    {
      id: 'installation',
      title: 'Installation',
      icon: Download,
      content: [
        {
          type: 'paragraph',
          text: 'Clone the repository and install all dependencies using pnpm. The monorepo uses pnpm workspaces to manage dependencies for both the API and web applications in a single install step.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Clone the repository
git clone <repository-url> hishamtraders
cd hishamtraders

# Install all dependencies (API + Web)
pnpm install`,
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Monorepo Structure',
          text: 'The project is structured as a monorepo with two main workspaces: apps/api (Express + TypeScript + Prisma backend) and apps/web (React + Vite + Tailwind CSS frontend). Running pnpm install at the root installs dependencies for both.',
        },
      ],
    },

    // ── Section 4: Database Migration ─────────────────────────────────
    {
      id: 'database-migration',
      title: 'Database Migration',
      icon: Database,
      content: [
        {
          type: 'paragraph',
          text: 'After installing dependencies and configuring your .env file, you need to run database migrations to create all required tables, indexes, and relationships in your MySQL database. Prisma ORM manages the database schema through migration files.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# For production / staging - apply all pending migrations
pnpm prisma migrate deploy

# For development - apply migrations and update Prisma Client
pnpm prisma migrate dev`,
        },
        {
          type: 'keyValue',
          pairs: [
            {
              key: 'migrate deploy',
              value:
                'Applies all pending migrations without creating new ones. Use this for production and staging environments.',
            },
            {
              key: 'migrate dev',
              value:
                'Applies pending migrations and regenerates the Prisma Client. Use this during development. It will also prompt you if the schema has drifted.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Database Must Exist',
          text: 'Ensure your MySQL database (e.g., hishamtraders) has been created before running migrations. You can create it manually with: CREATE DATABASE hishamtraders; in the MySQL CLI or your preferred database management tool.',
        },
      ],
    },

    // ── Section 5: Seed Data ──────────────────────────────────────────
    {
      id: 'seed-data',
      title: 'Seed Data',
      icon: Server,
      content: [
        {
          type: 'paragraph',
          text: 'The seed script populates the database with essential initial data that the application requires to function. This includes the default admin user, a sample warehouse, system settings, and foundational configuration records.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Run the seed script
pnpm prisma db seed`,
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Seed Data May Overwrite',
          text: 'Running the seed script on an existing database may overwrite or duplicate data. Only run it on a fresh database or when you are certain you want to reset to the initial state. Back up your data before re-seeding if you have made changes.',
        },
      ],
      subSections: [
        {
          id: 'seed-details',
          title: 'What Gets Created',
          content: [
            {
              type: 'paragraph',
              text: 'The seed script creates the following records in the database. These are the minimum required data for the system to operate.',
            },
            {
              type: 'keyValue',
              pairs: [
                {
                  key: 'Default Admin User',
                  value:
                    'Email: admin@hishamtraders.com, Password: admin123. This is the initial administrator account with full system access.',
                },
                {
                  key: 'Sample Warehouse',
                  value:
                    'A default warehouse record to allow immediate use of inventory features without manual warehouse setup.',
                },
                {
                  key: 'System Settings',
                  value:
                    'Default configuration entries in the SystemSetting table, including application-level preferences and defaults.',
                },
                {
                  key: 'Chart of Accounts',
                  value:
                    'Created by the GL migration script (see next section). Includes standard account heads for assets, liabilities, income, expenses, and equity.',
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Section 6: GL Migration Script ────────────────────────────────
    {
      id: 'gl-migration',
      title: 'GL Migration Script',
      icon: Terminal,
      content: [
        {
          type: 'paragraph',
          text: 'The General Ledger (GL) migration script sets up the chart of accounts and links existing transactions (invoices, payments, purchase orders) to their corresponding GL entries. This is essential for the accounting module to function correctly.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Run the GL migration script
cd apps/api
pnpm tsx src/scripts/gl-migration.ts`,
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Run After Seed',
          text: 'The GL migration script should be run after the initial database seed. It depends on seed data being present (such as system settings and the admin user). Running it before seeding may result in errors or incomplete account linkage.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Ensure Seed Data Exists',
              description:
                'Verify that you have already run pnpm prisma db seed successfully before proceeding with the GL migration.',
            },
            {
              title: 'Run the Migration',
              description:
                'Execute the GL migration script from the apps/api directory. The script will create all standard account heads and process any existing transactions.',
            },
            {
              title: 'Verify Completion',
              description:
                'The script will output progress messages as it processes. Ensure it completes without errors. You can verify by checking the Chart of Accounts page in the application after starting the services.',
            },
          ],
        },
      ],
    },

    // ── Section 7: Starting Services ──────────────────────────────────
    {
      id: 'starting-services',
      title: 'Starting Services',
      icon: Server,
      content: [
        {
          type: 'paragraph',
          text: 'The application consists of two services that need to be started separately: the API server (backend) and the Web client (frontend). Each runs in its own terminal window. Start the API server first, as the web client depends on it for data.',
        },
        {
          type: 'flow',
          steps: [
            'Start the API server (port 3001)',
            'Wait for "Server running" message',
            'Start the Web client (port 5173)',
            'Open browser to http://localhost:5173',
            'Log in with default credentials',
          ],
        },
      ],
      subSections: [
        {
          id: 'start-api',
          title: 'Start API Server',
          content: [
            {
              type: 'paragraph',
              text: 'The API server is an Express.js application running on TypeScript. It connects to the MySQL database and exposes RESTful endpoints consumed by the web client.',
            },
            {
              type: 'code',
              language: 'bash',
              code: `# Start the API server (runs on port 3001)
cd apps/api
pnpm dev`,
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'API Health Check',
              text: 'Once the API server is running, you can verify it by visiting http://localhost:3001/api/v1 in your browser or running: curl http://localhost:3001/api/v1. You should receive a JSON response confirming the API is operational.',
            },
          ],
        },
        {
          id: 'start-web',
          title: 'Start Web Client',
          content: [
            {
              type: 'paragraph',
              text: 'The web client is a React application built with Vite. It provides the user interface and communicates with the API server for all data operations.',
            },
            {
              type: 'code',
              language: 'bash',
              code: `# Start the web client (runs on port 5173)
cd apps/web
pnpm dev`,
            },
            {
              type: 'paragraph',
              text: 'After starting, open your browser and navigate to http://localhost:5173. You will be presented with the login page where you can authenticate using the default credentials.',
            },
          ],
        },
      ],
    },

    // ── Section 8: Default Credentials ────────────────────────────────
    {
      id: 'default-credentials',
      title: 'Default Credentials',
      icon: Key,
      content: [
        {
          type: 'paragraph',
          text: 'The seed script creates a default administrator account that you can use to log into the system for the first time. These credentials provide full access to all modules and settings.',
        },
        {
          type: 'keyValue',
          pairs: [
            {
              key: 'Email',
              value: 'admin@hishamtraders.com',
            },
            {
              key: 'Password',
              value: 'admin123',
            },
            {
              key: 'Role',
              value: 'ADMIN (full access to all modules)',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Change Default Password Immediately',
          text: 'The default password is publicly known and must be changed immediately after your first login. Navigate to your profile settings and use the Change Password feature to set a strong, unique password. Failing to change the default password is a serious security risk, especially if the application is accessible over a network.',
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Create Individual User Accounts',
          text: 'After securing the admin account, create individual user accounts for each team member with the appropriate role (Warehouse Manager, Sales Officer, Accountant, Recovery Agent). Avoid sharing the admin account across multiple users to maintain a proper audit trail.',
        },
      ],
    },
  ],
};
