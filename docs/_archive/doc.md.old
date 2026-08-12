# Docker + VPS Deploy Guide

Stack: `backend` (Express/TS, port 3001) + `frontend` (Next.js, port 3000). DB = Supabase (external, no container needed).

Files added:
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

## 0. Security warning

`backend/.env.local` has real Supabase keys in plaintext in this repo. Before deploying anywhere public:
1. Rotate the Supabase secret key / DB password (Supabase dashboard → Settings → API / Database).
2. Never `git add` or `docker cp` the `.env.local` file. Compose uses `backend/.env` and `frontend/.env` (not `.env.local`) on purpose — keep those out of git too.

## 1. Get a VPS

Any Ubuntu 22.04+ VPS works (Hetzner, DigitalOcean, OVH...). Minimum 2GB RAM. Note its public IP.

## 2. Connect + install Docker

```bash
ssh root@YOUR_VPS_IP

# base updates
apt update && apt upgrade -y

# install Docker + compose plugin
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# check
docker --version
docker compose version
```

## 3. Create a non-root user (recommended)

```bash
adduser deploy
usermod -aG docker deploy
su - deploy
```

## 4. Get the code onto the VPS

Option A — git (preferred, if repo pushed somewhere private):
```bash
git clone <your-repo-url> unyt
cd unyt
```

Option B — copy from your PC (run this on your PC, not the VPS):
```bash
scp -r "C:\Users\alhar\Downloads\2-5\unyt system 1-5-2026\unyt-main" deploy@YOUR_VPS_IP:~/unyt
```

## 5. Create env files on the VPS

```bash
cd ~/unyt
nano backend/.env
```
Paste (use your ROTATED values, not the old exposed ones):
```
SUPABASE_DB_URL=postgresql://postgres.xxxx:PASSWORD@aws-1-eu-central-2.pooler.supabase.com:5432/postgres
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
SUPABASE_ANON_KEY=xxx
DATABASE_NAME=postgres
POSTGRES_SSL=true
BACKEND_PORT=3001
JWT_SECRET=generate-a-long-random-string
```

```bash
nano frontend/.env
```
Paste (use your VPS domain/IP, not localhost):
```
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3001/api
BACKEND_URL=http://backend:3001
NEXT_PUBLIC_ANALYTICS=false
NEXT_PUBLIC_APP_NAME=AR Company
NEXT_PUBLIC_APP_DESCRIPTION=Course Management Administration Platform
```

## 6. Build and run

```bash
docker compose build
docker compose up -d
```

Check status:
```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

App now reachable at:
- Frontend: `http://YOUR_VPS_IP:3000`
- Backend API: `http://YOUR_VPS_IP:3001/api`

## 7. Open firewall ports

```bash
ufw allow 22
ufw allow 3000
ufw allow 3001
ufw enable
```

## 8. (Recommended) Put Nginx in front + HTTPS

Instead of exposing 3000/3001 raw, point a domain at the VPS and reverse-proxy:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/unyt`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/unyt /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d yourdomain.com
```

Then set `NEXT_PUBLIC_API_URL=https://yourdomain.com/api` in `frontend/.env`, rebuild frontend (`docker compose build frontend && docker compose up -d frontend`), and you can close ports 3000/3001 in ufw (keep only 80/443).

## 9. Updating after code changes

```bash
cd ~/unyt
git pull            # or re-scp changed files
docker compose build
docker compose up -d
```

## 10. Useful commands

```bash
docker compose down          # stop everything
docker compose restart backend
docker system prune -af      # clean unused images if disk fills up
```
