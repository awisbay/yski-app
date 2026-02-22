# 🔧 GitHub Actions CI/CD Documentation

## 📋 Workflows Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push, PR | Run tests & lint |
| **Build APK** | Manual | Build mobile APK |
| **Deploy** | Push to main/tags | Deploy to server |
| **Release** | Tag push | Create release & assets |
| **DB Migration** | Manual | Run database migrations |
| **Backup** | Daily/Manual | Database backup |

## 🔐 Required Secrets

Go to **Settings > Secrets and variables > Actions** and add these secrets:

### Required for All

| Secret | Description | How to Get |
|--------|-------------|------------|
| `GITHUB_TOKEN` | Auto-generated | GitHub provides this automatically |

### Required for Deploy

| Secret | Description | Example |
|--------|-------------|---------|
| `SSH_HOST` | Server IP/hostname | `173.212.211.18` |
| `SSH_USER` | SSH username | `wisbay` |
| `SSH_PRIVATE_KEY` | SSH private key content | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` | SSH port (optional) | `22` |

### Required for Mobile Build

| Secret | Description | How to Get |
|--------|-------------|------------|
| `EXPO_TOKEN` | Expo access token | https://expo.dev/settings/access-tokens |
| `EXPO_ACCOUNT` | Expo account name | Your Expo username |
| `EXPO_PROJECT` | Expo project slug | `clicky-foundation` |
| `API_URL` | Backend API URL | `http://173.212.211.18:8080/api/v1` |

### Optional

| Secret | Description |
|--------|-------------|
| `SLACK_WEBHOOK_URL` | For deployment notifications |
| `DATABASE_URL` | For DB migrations (format: `postgresql+asyncpg://user:pass@host/db`) |
| `GHCR_TOKEN` | GitHub Container Registry token |

## 🚀 How to Use

### 1. CI Pipeline (Automatic)

Every push/PR triggers:
```
Backend Tests → Website Build → Mobile Check → Docker Build
```

### 2. Build APK (Manual)

1. Go to **Actions** tab
2. Click **"Build Mobile APK"**
3. Click **"Run workflow"**
4. Select:
   - **Profile**: `preview` (APK) or `production` (AAB)
   - **Platform**: `android` or `ios`
   - **Submit**: Check for Play Store submission
5. Wait ~15-20 minutes
6. Download APK from Expo Dashboard

### 3. Deploy to Production (Automatic/Manual)

**Automatic:**
- Push to `main` or `master` branch
- Push tags starting with `v`

**Manual:**
1. Go to **Actions** tab
2. Click **"Deploy to Production"**
3. Click **"Run workflow"**
4. Select environment

### 4. Database Migration (Manual)

1. Go to **Actions** tab
2. Click **"Database Migration"**
3. Select action:
   - `upgrade` - Run migrations
   - `downgrade` - Rollback
   - `history` - View history
   - `current` - Current version

## 🐳 Docker Images

Images are built and pushed to GitHub Container Registry:

```
ghcr.io/{owner}/yski-app/backend:latest
ghcr.io/{owner}/yski-app/website:latest
ghcr.io/{owner}/yski-app/nginx:latest
```

## 📝 Environment Protection

For production deployments, configure environment protection:

1. Go to **Settings > Environments**
2. Create `production` environment
3. Configure:
   - Required reviewers
   - Wait timer
   - Deployment branches

## 🔍 Troubleshooting

### Workflow Not Running
- Check if secrets are configured
- Check branch filters in workflow file
- Check if Actions are enabled in repository settings

### Deploy Failed
- Check SSH connection: `ssh -i ~/.ssh/key user@host`
- Check Docker is running on server
- Check disk space on server

### Build APK Failed
- Verify `EXPO_TOKEN` is valid
- Check Expo project exists
- Verify `API_URL` is accessible

## 📊 Monitoring

View workflow status:
- GitHub Actions tab: https://github.com/{owner}/{repo}/actions
- Expo Dashboard: https://expo.dev
- Server status: http://173.212.211.18:8080/health

## 🔄 Release Process

1. **Create Release Branch**: `git checkout -b release/v1.0.0`
2. **Update Version**: Update version in `mobile/app.json`
3. **Create PR**: Merge to `main`
4. **Create Tag**: `git tag v1.0.0 && git push origin v1.0.0`
5. **Auto-trigger**: Release workflow runs automatically
6. **Manual Build**: Run "Build Mobile APK" workflow
