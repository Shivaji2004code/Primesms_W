# Prime SMS Server

Express.js server that serves the Prime SMS application with both API endpoints and static client files in a single container.

## Architecture

This server uses Option A deployment strategy:
- **SPA Serving**: Express serves the React client as static files
- **API Routes**: All API endpoints are mounted under `/api/*`
- **Single Container**: One container serves both the client and API

## Build Process

The build process consists of three stages:

1. **TypeScript Compilation**: `tsc` compiles server source code to `dist/`
2. **Client Build**: Builds the React client in `../client/dist/`  
3. **Static Copy**: Copies client build to `server/dist/client-static/`

```bash
npm run build  # Runs all three stages
```

### Build Scripts

- `build:client` - Builds the React client with npm ci fallback
- `copy:client` - Copies client build files to server's static directory
- `build` - Full build pipeline (TypeScript + client + copy)

## Static File Serving

### Caching Strategy
- **HTML files**: No cache (`no-cache, no-store, must-revalidate`)
- **Static assets**: 1 year cache (`max-age=31536000, immutable`)

### SPA Routing
- `GET /` → serves `index.html` from client-static
- `GET /any-spa-route` → SPA fallback to `index.html`
- `GET /api/*` → API routes (bypasses SPA fallback)

### Static Directory Structure
```
server/dist/
├── index.js           # Server entry point
├── db/               # Database modules
├── routes/           # API route handlers
└── client-static/    # Built client files
    ├── index.html
    ├── assets/       # CSS, JS, images
    └── vite.svg
```

## API Endpoints

All API routes are prefixed with `/api`:

- `GET /health` - Health check (lightweight)
- `GET /healthz` - Health check alias  
- `GET /api/health` - Detailed health check
- `GET /api/auth/*` - Authentication routes
- `GET /api/admin/*` - Admin routes
- `GET /api/templates/*` - Template management
- `GET /api/whatsapp/*` - WhatsApp integration
- `GET /api/send/*` - Message sending
- `GET /api/credits/*` - Credit system
- `GET /api/logs/*` - Logging routes

## CORS Configuration

Tightened CORS for production security:

```typescript
const allowed = [
  process.env.APP_ORIGIN || 'https://primesms.app',
  'http://localhost:5173', // dev
  'http://localhost:3000'  // dev
];
```

Set `APP_ORIGIN=https://primesms.app` in production environment.

## Docker/Nixpacks Deployment

The server is designed for single-container deployment:

1. **Build**: Nixpacks runs `npm run build` in server directory
2. **Dependencies**: Only server sources needed (client is built during server build)
3. **Start**: `npm start` → `node dist/index.js`
4. **Static Serving**: Express serves client from `dist/client-static/`

### Environment Variables

Required for production:
```
NODE_ENV=production
PORT=3000
APP_ORIGIN=https://primesms.app
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=PrimeSMS_W
DB_USER=your-db-user  
DB_PASSWORD=your-db-password
SESSION_SECRET=your-session-secret
```

## Development

```bash
# Development server (TypeScript)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Health checks
npm run health:smoke
npm run db:smoke
```

## File Structure

```
server/
├── src/                 # TypeScript sources
│   ├── index.ts        # Main server file
│   ├── db/             # Database connection
│   ├── routes/         # API route handlers
│   ├── middleware/     # Express middleware
│   └── utils/          # Utilities (env, logger, etc.)
├── dist/               # Compiled JavaScript (build output)
│   ├── client-static/  # Built client files (copied during build)
│   └── *.js           # Compiled server files
├── package.json        # Build scripts and dependencies
└── tsconfig.json       # TypeScript configuration
```

This setup ensures the client and server are deployed as a single unit while maintaining clear separation between API and static serving concerns.