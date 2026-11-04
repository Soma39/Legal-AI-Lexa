# Production Deployment Guide

## 1. Prerequisites
- Docker Engine 24+ and Docker Compose v2+
- Host with at least 2 CPU cores and 4GB RAM
- Valid SSL/TLS domain certificate (for HTTPS in production)

## 2. Docker Compose Deployment
1. Clone the repository and configure environment:
   ```bash
   cp .env.example .env
   ```
2. Set production values in `.env`:
   - `SECRET_KEY`: 32+ character random secret string
   - `DATABASE_URL`: PostgreSQL connection URI
   - `LLM_PROVIDER`: `gemini`, `openai`, or `demo`
   - `LLM_API_KEY`: API key for external LLM provider if used
3. Build and launch all services:
   ```bash
   docker-compose up --build -d
   ```
4. Verify container statuses:
   ```bash
   docker-compose ps
   ```

## 3. Reverse Proxy & SSL (Nginx / Cloudflare)
In production, point your domain's DNS to your host IP. Use Nginx or Certbot for SSL:
```nginx
server {
    listen 443 ssl http2;
    server_name legalai.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/legalai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/legalai/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## 4. Monitoring & Backups
- **PostgreSQL Database Backups**:
  ```bash
  docker exec -t legalai-postgres pg_dump -U legalai legalai_db > backup_$(date +%F).sql
  ```
- **Health Check Endpoint**:
  Monitor `https://legalai.yourdomain.com/api/v1/health` for automated uptime pings.
