# ServiceRegistry

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.14.0-339933?logo=node.js)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

An educational web application for registering and tracking equipment service history. Built with modern technologies using AI-driven development practices.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

ServiceRegistry is an open-source, single-tenant web application designed to help service businesses maintain a complete history of equipment servicing. The application addresses the common problem of incomplete service records by providing a simple yet comprehensive tool for registering all service activities for each piece of equipment.

### Key Features

- **Authentication & Authorization** - Email/password login powered by Supabase Auth with role-based access control
- **User Roles**
  - **Owner**: Full permissions including user management, equipment/entry deletion
  - **Worker**: Can add and edit equipment and service entries, but cannot delete or manage accounts
- **Equipment Management (CRUD)** - Register equipment with auto-generated unique IDs (format: `EQ-{YEAR}-{NUMBER}`)
- **Service Entry Tracking** - Log maintenance, repairs, and inspections with full audit history
- **Search Functionality** - Quick equipment lookup by unique ID
- **Row Level Security** - Data protection enforced at the database level via Supabase RLS

## Tech Stack

### Frontend

| Technology | Description |
|------------|-------------|
| [Astro 5](https://astro.build/) | Fast, content-focused web framework with minimal JavaScript |
| [React 19](https://react.dev/) | Interactive UI components where needed |
| [TypeScript 5](https://www.typescriptlang.org/) | Static typing for better code quality and IDE support |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| [Shadcn/ui](https://ui.shadcn.com/) | Accessible React component library built on Radix UI |

### Backend

| Technology | Description |
|------------|-------------|
| [Supabase](https://supabase.com/) | Backend-as-a-Service with PostgreSQL, Auth, and Row Level Security |

### DevOps & Tooling

| Technology | Description |
|------------|-------------|
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipelines for build and E2E testing |
| [Playwright](https://playwright.dev/) | End-to-end testing framework |
| [ESLint](https://eslint.org/) | Code linting |
| [Prettier](https://prettier.io/) | Code formatting |
| [Husky](https://typicode.github.io/husky/) | Git hooks for pre-commit checks |
| [DigitalOcean](https://www.digitalocean.com/) | Cloud hosting via Docker images |

## Getting Started Locally

### Prerequisites

- **Node.js** `22.14.0` (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **npm** (comes with Node.js)
- **Supabase account** - for backend services

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/ServiceRegistry.git
   cd ServiceRegistry
   ```

2. **Set Node.js version** (if using nvm)

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:4321`

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start the Astro development server with hot reload |
| `build` | `npm run build` | Build the application for production |
| `preview` | `npm run preview` | Preview the production build locally |
| `lint` | `npm run lint` | Run ESLint to check for code issues |
| `lint:fix` | `npm run lint:fix` | Run ESLint and automatically fix issues |
| `format` | `npm run format` | Format code using Prettier |

## Project Scope

### Included in MVP

- ✅ User authentication with Supabase Auth
- ✅ Role-based access control (Owner/Worker)
- ✅ Full CRUD operations for equipment
- ✅ Full CRUD operations for service entries
- ✅ Equipment search by unique ID
- ✅ Auto-generated equipment IDs (`EQ-{YEAR}-{NUMBER}`)
- ✅ Row Level Security (RLS) in Supabase
- ✅ Minimal E2E test with Playwright
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Basic deployment on DigitalOcean

### Not Included in MVP

- ❌ QR codes and label printing
- ❌ Docker Compose / self-hosted orchestration
- ❌ Unit tests (Vitest)
- ❌ Notifications
- ❌ File attachments
- ❌ Multi-tenancy
- ❌ Mobile applications
- ❌ Offline mode

## Project Status

**Version:** `0.0.1` (MVP in Development)

This is an educational project developed using AI-driven development methodology. The primary goals are:

1. Building a functional service registry application
2. Learning and practicing AI-assisted coding techniques
3. Exploring prompt engineering and iterative AI debugging

### Success Criteria

- Functional authentication and role management
- Working CRUD operations for equipment and service entries
- Configured and tested Row Level Security
- Passing E2E Playwright tests
- Functional CI/CD pipeline
- Deployed application on DigitalOcean

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ using AI-driven development
</p>
