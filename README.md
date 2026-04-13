# Server Portal

A modern home server user portal with Plex OAuth authentication and service dashboard.

## Features

- **Plex OAuth Login** - Users can sign in with their Plex credentials
- **Local Fallback** - Email/password login for users without Plex
- **Self-Enrollment** - Users can request access, you approve/deny in admin panel
- **Remember Me** - 30-day persistent sessions
- **Dark/Light Mode** - System preference + manual toggle
- **Service Dashboard** - Three clickable service cards (Plex, Overseerr, Nextcloud)
- **Admin Panel** - Manage users, approve/deny requests

## Quick Start

### 1. Install Node.js 20

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Or directly from nodejs.org
# https://nodejs.org/
```

### 2. Clone & Install

```bash
git clone https://github.com/shark1991/server-portal.git
cd server-portal
npm install
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env with your settings
```

Required variables in `.env`:
```env
SESSION_SECRET=your-random-secret-key
DB_PASSWORD=your-mysql-password

# Plex OAuth
PLEX_CLIENT_ID=your-plex-client-id
PLEX_CLIENT_SECRET=your-plex-client-secret
PLEX_REDIRECT_URL=https://portal.yourdomain.com/auth/plex/callback

# Email notifications
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=your-email@example.com
```

### 4. Setup Database

```bash
mysql -u root -p < database/schema.sql
```

Or manually:
```bash
mysql -u root -p -e "CREATE DATABASE server_portal"
mysql -u root -p server_portal < database/schema.sql
```

### 5. Set Admin Password

```bash
# The default admin is 'eakinben@gmail.com' with placeholder password
# Update via admin panel or directly in MySQL:
```

### 6. Run

```bash
npm start
# Or with PM2:
pm2 start app.js --name server-portal
```

### 7. Nginx Config

Add to your nginx config:
```nginx
server {
    server_name portal.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    server_name admin.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then: `nginx -t && nginx -s reload`

## Usage

1. Visit your portal domain (e.g., portal.yourdomain.com)
2. Click "Register" to create an account
3. You'll receive an email notification (check your email)
4. Login to admin panel (e.g., admin.yourdomain.com)
5. Approve the new user
6. User can now access the dashboard

## Service URLs

Update these in `.env`:
- `PLEX_SERVER_URL` - Your Plex server (default: http://localhost:32400)
- `OVERSEERR_URL` - Overseerr (default: http://localhost:5055)
- `NEXTCLOUD_URL` - Nextcloud (default: http://localhost:8080)

## PM2 Management

```bash
pm2 start app.js --name server-portal
pm2 logs server-portal
pm2 restart server-portal
pm2 stop server-portal
```

## Getting Plex OAuth Credentials

1. Go to https://www.plex.tv/claim
2. Sign in with your Plex account
3. Copy the claim token
4. Add to `.env` as `PLEX_CLIENT_ID`

For development, you can generate a client ID using the UUID package included.

## Tech Stack

- Node.js 20
- Express.js
- MySQL
- EJS templates
- Custom CSS (dark/light mode)
- PM2 process manager

## License

MIT