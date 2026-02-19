# Yayasan Sahabat Khairat Indonesia - Project Conventions

## Project Overview

This is the **Yayasan Sahabat Khairat Indonesia** mobile application for Yayasan Sahabat Khairat (YSKI), built with:
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Mobile**: React Native + Expo SDK 52 + NativeWind v4
- **Infrastructure**: Docker + Docker Compose

## Directory Structure

```
yski-app/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/v1/       # API endpoints organized by resource
│   │   ├── core/         # Config, security, database, celery
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Business logic layer
│   │   └── utils/        # Helper utilities
│   ├── alembic/          # Database migrations
│   └── tests/            # Pytest test suite
├── mobile/               # React Native + Expo
│   ├── app/              # Expo Router file-based routing
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client
│   └── stores/           # Zustand state stores
└── wp-plugin/            # WordPress plugin (Phase 6)
```

## Coding Conventions

### Python (Backend)

1. **Imports Order**:
   ```python
   # 1. Standard library
   import uuid
   from datetime import datetime
   
   # 2. Third-party
   from fastapi import APIRouter
   from sqlalchemy import select
   
   # 3. Local
   from app.core.database import get_db
   from app.models.user import User
   ```

2. **Type Hints**: Always use type hints
   ```python
   async def get_user(user_id: str) -> Optional[User]:
       ...
   ```

3. **Docstrings**: Use Google-style docstrings
   ```python
   def create_user(user_data: UserCreate) -> User:
       """Create a new user.
       
       Args:
           user_data: User creation schema
           
       Returns:
           Created user instance
       """
   ```

4. **Naming**:
   - Classes: `PascalCase` (e.g., `UserService`)
   - Functions/Variables: `snake_case` (e.g., `get_user_by_email`)
   - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
   - Private: `_leading_underscore`

5. **Async/Await**: Use async/await for all I/O operations

### TypeScript/React Native (Mobile)

1. **Imports**:
   ```typescript
   // 1. React/React Native
   import React from 'react';
   import { View, Text } from 'react-native';
   
   // 2. Third-party
   import { useQuery } from '@tanstack/react-query';
   
   // 3. Local (absolute imports with @/)
   import { Button } from '@/components/Button';
   import { useAuth } from '@/hooks/useAuth';
   ```

2. **Component Structure**:
   ```typescript
   // Props interface first
   interface MyComponentProps {
       title: string;
       onPress: () => void;
   }
   
   // Component
   export function MyComponent({ title, onPress }: MyComponentProps) {
       // hooks
       // handlers
       // render
   }
   ```

3. **Naming**:
   - Components: `PascalCase` (e.g., `UserCard`)
   - Hooks: `camelCase` with `use` prefix (e.g., `useAuth`)
   - Files: Match the exported name

4. **Styling with NativeWind**:
   ```tsx
   <View className="flex-1 bg-white p-4">
       <Text className="text-lg font-semibold text-gray-900">
           Hello World
       </Text>
   </View>
   ```

## Database Conventions

1. **Table Names**: Plural, snake_case (e.g., `users`, `bookings`)
2. **Primary Keys**: UUID v4, column name `id`
3. **Timestamps**: All tables have `created_at` and `updated_at`
4. **Soft Delete**: Use `is_active` boolean instead of hard delete
5. **Foreign Keys**: Format `{table}_id` (e.g., `user_id`)

### Migrations

Always use Alembic for schema changes:
```bash
alembic revision --autogenerate -m "Add user table"
alembic upgrade head
```

## API Conventions

1. **RESTful Endpoints**:
   - `GET /api/v1/users` - List
   - `GET /api/v1/users/{id}` - Get one
   - `POST /api/v1/users` - Create
   - `PUT /api/v1/users/{id}` - Update
   - `DELETE /api/v1/users/{id}` - Delete

2. **Response Format**:
   ```json
   {
       "data": { ... },
       "message": "Success",
       "meta": {
           "page": 1,
           "limit": 20,
           "total": 100
       }
   }
   ```

3. **Error Format**:
   ```json
   {
       "detail": "Error message",
       "code": "ERROR_CODE"
   }
   ```

## Git Workflow

1. **Branch Naming**:
   - Feature: `feature/short-description`
   - Bugfix: `fix/short-description`
   - Hotfix: `hotfix/short-description`

2. **Commit Messages**:
   ```
   type(scope): subject
   
   body (optional)
   
   footer (optional)
   ```
   
   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

3. **Example**:
   ```
   feat(auth): add JWT refresh token endpoint
   
   - Implement refresh token rotation
   - Add token blacklist in Redis
   - Update tests
   ```

## Environment Variables

All configuration goes through environment variables:
- `.env` - Local development (gitignored)
- `.env.example` - Template with dummy values (committed)

Never commit secrets or production credentials!

## Testing

### Backend
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Mobile
```bash
cd mobile
npm test
```

## Security Guidelines

1. **Authentication**: JWT tokens with short expiry + refresh tokens
2. **Passwords**: Hashed with bcrypt (12+ rounds)
3. **SQL Injection**: Use parameterized queries (SQLAlchemy ORM)
4. **CORS**: Whitelist specific origins only
5. **Rate Limiting**: Implement on auth endpoints
6. **File Uploads**: Validate type, size, content; store in MinIO
7. **Secrets**: Never hardcode, use environment variables

## Code Review Checklist

- [ ] Code follows style conventions
- [ ] Tests pass locally
- [ ] Type hints are correct
- [ ] No hardcoded secrets
- [ ] Error handling is comprehensive
- [ ] Documentation is updated
- [ ] Migrations are included (if schema changed)

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/)
- [Expo Docs](https://docs.expo.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
