# Deploying Bazm to Alibaba Cloud ECS

This repo now builds into three Docker containers: `db` (Postgres),
`api` (Express backend), and `web` (Nginx serving the built frontend
and reverse-proxying `/api` to the backend). They're wired together in
`docker-compose.yml`.

## 1. Prerequisites on the ECS instance

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

If the instance is small (e.g. 1-2GB RAM), add swap first — the same fix
you used for HelpPilot's OOM issues applies here for the build step:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Get the code onto the server

```bash
git clone https://github.com/ErkinovAsliddin/Bazm.git
cd Bazm
cp .env.example .env
nano .env   # fill in real SESSION_SECRET, POSTGRES_PASSWORD, etc.
```

Generate strong secrets:

```bash
openssl rand -base64 48   # use for SESSION_SECRET
openssl rand -base64 32   # use for POSTGRES_PASSWORD
```

## 3. Build and start

```bash
docker compose up -d --build
docker compose logs -f      # watch startup; Ctrl+C to stop watching
```

This builds the api and web images (needs the swap above on small
instances) and starts all three containers. `web` listens on port 80
(configurable via `WEB_PORT` in `.env`).

## 4. Push the database schema and seed demo data

The `scripts` package (seed data) isn't baked into either runtime image on
purpose — it's a one-off dev/ops task, not something that should run every
container restart. Run it against the running Postgres container instead:

```bash
# Temporarily expose Postgres to the host so local pnpm can reach it:
# uncomment the "ports: - 5432:5432" line under the db service in
# docker-compose.yml, then:
docker compose up -d db

# From your own machine or the server (needs pnpm + Node installed there):
export DATABASE_URL="postgres://bazm:<POSTGRES_PASSWORD from .env>@localhost:5432/bazm"
pnpm install
pnpm --filter @workspace/db run push     # creates tables from the schema
pnpm --filter @workspace/scripts run seed # inserts demo vendors/couples/etc.
```

Re-comment the `db` port mapping afterward so Postgres isn't reachable from
outside the Docker network.

## 5. Put HTTPS in front of it (Certbot, same as HelpPilot)

Point your domain's A record at the ECS instance's public IP, then:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Since `web` already runs its own Nginx inside a container on port 80, the
simplest setup is a second, host-level Nginx that terminates TLS and proxies
to `127.0.0.1:80` (the container). Example `/etc/nginx/sites-available/bazm`:

```nginx
server {
    listen 80;
    server_name bazm.uz www.bazm.uz;
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bazm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bazm.uz -d www.bazm.uz
```

Certbot rewrites the config to add the TLS block and sets up auto-renewal.

## 6. Redeploying after code changes

```bash
git pull
docker compose up -d --build
```

## What's still a placeholder / needs attention before real users sign up

- **Auth** is a basic email+password scheme (scrypt-hashed, session cookie) —
  no email verification, no password reset flow, no OTP yet.
- **Vendor photo uploads** need a real GCS bucket + service account filled
  into `.env` (`PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR`,
  `GCS_SERVICE_ACCOUNT_KEY_JSON`). Without these, vendors can't upload their
  own photos — only the seeded demo listings will have images.
- **Checkout has no real order flow yet** — the marketplace cart is
  client-side only (localStorage); there's no payment integration or
  server-side order persistence.
- The vendors currently in the database are **fictional demo data**
  (see `scripts/src/demoVendorCatalog.ts`) — replace/remove them as real
  vendors apply and get approved.
