# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn check` - Run Svelte type checking
- `yarn check:watch` - Run type checking in watch mode

## Database Commands

- `yarn db:push` - Push schema changes to database
- `yarn db:generate` - Generate migrations
- `yarn db:migrate` - Run migrations
- `yarn db:studio` - Open Drizzle Studio

## Architecture

This is a SvelteKit application with the following key components:

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL (Neon serverless)
- **Schema**: Located at `src/lib/server/db/schema.ts`
- **Connection**: Database client in `src/lib/server/db/index.ts`
- **Schema Structure**: 
  - `user` table with id and age fields
  - `session` table for authentication with user references

### Authentication System
- **Session-based authentication** using cookies
- **Token generation**: Uses `@oslojs/crypto` for secure session tokens
- **Session management**: 30-day expiration with 15-day renewal window
- **Implementation**: `src/lib/server/auth.ts` contains all auth utilities
- **Hooks**: `src/hooks.server.ts` handles session validation on every request
- **Types**: User and session types are available in `event.locals`

### Project Structure
- **Routes**: Standard SvelteKit structure in `src/routes/`
- **Server code**: Database and auth logic in `src/lib/server/`
- **Types**: Global app types in `src/app.d.ts`

## Environment Variables

- `DATABASE_URL` - Required PostgreSQL connection string (Neon serverless)
- `ANTHROPIC_KEY` - Required API key for Claude/Anthropic recipe generation

## Authentication Usage

**Domain Restriction**: Only @danielokita.com emails are allowed to register/login.

Sessions are automatically validated on every request. Access user data via:
```typescript
// In server-side code (hooks, actions, API routes)
const { user, session } = event.locals;
```

The auth system provides these utilities:
- `generateSessionToken()` - Create new session token
- `createSession(token, userId)` - Store session in database
- `validateSessionToken(token)` - Validate and refresh session
- `invalidateSession(sessionId)` - Delete session
- `setSessionTokenCookie()` / `deleteSessionTokenCookie()` - Manage cookies
- `loginUser(email)` - Login or create user with domain validation
- `validateEmail(email)` - Check if email ends with @danielokita.com

## Application Features

### Recipe Generation
- Uses Anthropic Claude API with LangChain for vegan recipe generation
- Generates 5 recipes based on selected ingredients
- Results are cached for 24 hours to avoid redundant API calls
- Integration: `src/lib/server/recipe-generator.ts`

### Ingredient Management
- Photo capture using device camera (environment/rear camera preferred)
- Manual ingredient entry with OpenFoodFacts API search
- Ingredient availability tracking (available/unavailable)
- CRUD operations for user ingredients
- Integration: `src/lib/server/ingredient-service.ts`, `src/lib/server/ingredient-api.ts`

### Recipe Bank
- Save generated recipes to personal collection
- Rate recipes (1-5 stars)
- Search and filter saved recipes
- Full recipe details with ingredients and instructions
- Integration: `src/lib/server/recipe-service.ts`

### PWA Features
- Full Progressive Web App with offline support
- Service worker caches essential pages for offline access
- Install prompt for mobile/desktop app experience
- Offline page with connection retry functionality
- Web app manifest with shortcuts and icons

## Key Routes

- `/` - Kitchen dashboard (requires auth)
- `/login` - Domain-restricted authentication
- `/logout` - Session cleanup and redirect
- `/ingredients` - Photo capture, search, and ingredient management
- `/recipes/generate` - AI recipe generation interface
- `/recipes` - Recipe bank with search/filter/rating
- `/offline` - Offline fallback page

## Development Notes

- All user data is scoped by user ID
- Kitchen-themed UI with warm color palette (#8b4513, #f7f3f0, etc.)
- Mobile-first responsive design
- Animations and smooth transitions throughout
- UNIX/KISS principles: single-purpose components, clear separation of concerns