# 🚀 Ferdii-AI-Asissten

**Asisten AI personal untuk blog Adi Muhamad**
**Tech Stack**: Next.js 16 + PostgreSQL + pgvector + OpenAI GPT-4o mini + Docker + Cloudflare Tunnel

---

## ✨ Features

- 🤖 **RAG (Retrieval Augmented Generation)** - Jawab berdasarkan konten blog Anda
- 💬 **Real-time Chat** - Streaming responses dengan GPT-4o mini
- 🗄️ **Vector Database** - PostgreSQL dengan pgvector untuk similarity search
- 🐳 **Docker Deployment** - Self-hosted, scalable, dan portable
- 🔒 **Secure Access** - Cloudflare Tunnel (no port exposure)
- 💰 **Cost Effective** - ~$1-3/month (70% lebih hemat dari Firebase)

---

## 🎯 Quick Start (5 Minutes)

### Prerequisites
```bash
# Docker & Docker Compose
docker --version
docker-compose --version

# OpenAI API Key (already configured)
echo $OPENAI_API_KEY
```

### Deploy
```bash
# 1. Start all services
bash start.sh

# 2. Wait for services (30-60 seconds)
# Expected: PostgreSQL + Next.js running

# 3. Ingest blog content
docker exec chatbot_app node ingest-postgres.js \
  --file /path/to/blog-post.txt \
  --source "Blog Post Title"

# 4. Access
# Local: http://localhost:3000
# Public: https://chat.adi-muhamad.my.id
```

---

## 📊 Architecture

```
Internet User
    ↓
Cloudflare Tunnel (chat.adi-muhamad.my.id)
    ↓
[Docker Network]
    ├─ Next.js App:3000
    │   ├─ OpenAI GPT-4o mini (chat)
    │   ├─ OpenAI GPT-4o mini (chat)
    │   ├─ OpenAI Embeddings (search)
    │   └─ PostgreSQL client
    │
    └─ PostgreSQL:5432
       ├─ pgvector extension
       ├─ documents (chunks + embeddings)
       ├─ chat_history (logs)
       └─ ingest_metadata (tracking)
```

---

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start PostgreSQL only
docker-compose up postgres -d

# Run Next.js in dev mode
npm run dev

# Access: http://localhost:3000
```

### Production Build
```bash
# Build Docker images
docker-compose build

# Start production
docker-compose up -d
```

---

## 📚 Data Ingestion

### Ingest Single File
```bash
docker exec chatbot_app node ingest-postgres.js \
  --file ./blog-posts/post1.txt \
  --source "Blog Post #1"
```

### Ingest Directory
```bash
docker exec chatbot_app node ingest-postgres.js \
  --dir ./blog-posts \
  --source "Blog Collection"
```

### Ingest from URL
```bash
docker exec chatbot_app node ingest-postgres.js \
  --url https://example.com/blog.txt \
  --source "External Blog"
```

---

## 🔧 Configuration

### Environment Variables (.env.local)
```env
# OpenAI
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-mini

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123
POSTGRES_DB=chatbot_db

# App
NEXT_PUBLIC_SITE_URL=https://chat.adi-muhamad.my.id
NEXT_PUBLIC_APP_NAME=Blog Assistant
```

### Database Schema
- **documents**: Text chunks dengan vector embeddings (1536 dimensions)
- **chat_history**: Log percakapan user
- **ingest_metadata**: Tracking data ingestion

---

## 📖 API Reference

### Chat Endpoint
```bash
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Siapa kamu?"}
  ]
}
```

### Health Check
```bash
GET /api/health
# Returns: {"status":"healthy","database":"connected"}
```

---

## 📊 Monitoring

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Database Stats
```bash
# Document count
docker exec chatbot_postgres psql -U postgres -d chatbot_db -c \
  "SELECT source, COUNT(*) FROM documents GROUP BY source;"

# Chat history
docker exec chatbot_postgres psql -U postgres -d chatbot_db -c \
  "SELECT COUNT(*) FROM chat_history;"
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| PostgreSQL not ready | `docker-compose logs postgres` |
| API key error | Check `.env.local` |
| Tunnel not accessible | `cloudflared tunnel list` |
| No documents found | Run `ingest-postgres.js` first |
| Port 3000 in use | Change in `docker-compose.yml` |

---

## 📚 Documentation

- **DEPLOYMENT_QUICK_START.md** - 5-minute setup guide
- **DOCKER_SETUP.md** - Complete Docker documentation
- **CLOUDFLARE_SETUP.md** - Tunnel configuration
- **CONFIG_SUMMARY.md** - Configuration reference

---

## 💰 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| OpenAI GPT-4o mini | $0.15/$0.60 per 1M tokens | Chat responses |
| OpenAI Embeddings | $0.02 per 1M tokens | Vector generation |
| PostgreSQL | $0 | Self-hosted |
| Cloudflare Tunnel | $0 | Free tier |
| Domain | $0 | Already owned |
| **TOTAL** | **~$1-3/month** | Low volume usage |

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test with Docker
5. Submit PR

---

## 📄 License

MIT License - feel free to use for your own blog assistant!

---

**Deployed**: May 14, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
