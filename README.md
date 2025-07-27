# User Auth Service

NestJS authentication service with PostgreSQL, Redis and Drizzle ORM.

## Quick Start

### 1. Run Docker Compose
```bash
docker-compose up -d
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create `.env` file:
```
DATABASE_URL=postgresql://service:servicepwd@localhost:5432/auth
```

### 4. Run Drizzle migrations
```bash
npx drizzle-kit push
```

### 5. Start the project
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## API Endpoints

### POST /auth/register
Register new user
- Body: `{ username: string, email: string, password: string, fullName: string }`
- Response: `UserResponseDto`

### POST /auth/login  
User login
- Body: `{ email: string, password: string }`
- Response: `LoginResponseDto` (with JWT token)

### GET /auth/profile
Get user profile (requires JWT token)
- Headers: `Authorization: Bearer <token>`
- Response: `UserResponseDto`