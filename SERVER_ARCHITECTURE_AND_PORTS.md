# 📖 Dokumentasi Arsitektur Server & Panduan Multi-Aplikasi Docker
**Server**: Ubuntu 24.04 LTS (Proxmox VM 102 - IP: `192.168.1.102`)  
**Terakhir Diperbarui**: September 2026  
**Status**: Produksi / Aktif

---

## 📑 Daftar Isi
1. [Ringkasan Infrastruktur Server](#1-ringkasan-infrastruktur-server)
2. [Peta Alokasi Port & Routing Jaringan](#2-peta-alokasi-port--routing-jaringan)
3. [Arsitektur & Konfigurasi Masing-Masing Aplikasi](#3-arsitektur--konfigurasi-masing-masing-aplikasi)
   - [A. WordPress Blog (`adi-muhamad.my.id`)](#a-wordpress-blog)
   - [B. Exam AI System (`exam.adi-muhamad.my.id`)](#b-exam-ai-system)
   - [C. Ferdii-AI-Asissten (`chat.adi-muhamad.my.id`)](#c-ferdii-ai-asissten)
4. [Pemetaan Cloudflare Tunnel (LXC 100)](#4-pemetaan-cloudflare-tunnel-lxc-100)
5. [Pencegahan Masalah & Troubleshooting Penting](#5-pencegahan-masalah--troubleshooting-penting)
   - [Masalah Kapasitas Disk (Pelajaran Insiden MariaDB)](#a-kapasitas-disk--lvm)
   - [Pencegahan Konflik Port Antar-Database](#b-pencegahan-konflik-port-antar-database)
   - [Aturan TTL Jaringan (fix-docker-ttl.service)](#c-aturan-ttl-jaringan)
6. [Cheat Sheet Perintah Operasional untuk Admin Baru](#6-cheat-sheet-perintah-operasional-untuk-admin-baru)

---

## 1. Ringkasan Infrastruktur Server

| Komponen | Spesifikasi / Konfigurasi | Catatan Khusus |
| :--- | :--- | :--- |
| **Virtualisasi** | Proxmox VE (VM ID 102) | Host Ubuntu 24.04 LTS |
| **IP Host Lokal** | `192.168.1.102` | Static DHCP / Local LAN |
| **CPU / RAM** | 4 Core / 4 GB RAM + 2 GB Swap | RAM bebas rata-rata ~2.0 GB |
| **Kapasitas Disk** | 32 GB Virtual Disk (`sda`) | LVM Root (`/dev/ubuntu-vg/ubuntu-lv`) dialokasikan **30 GB** |
| **Inbound Tunnel** | Cloudflare Tunnel di LXC 100 (`HomeServerAdi`) | Tidak ada port publik terbuka langsung di router/modem |
| **Jaringan Docker** | `fix-docker-ttl.service` aktif | Mengatasi penurunan hop TTL pada bridge container |

---

## 2. Peta Alokasi Port & Routing Jaringan

Diagram alur lalu lintas dari internet via Cloudflare Tunnel hingga ke kontainer:

```text
INTERNET
   │
   ▼
[ Cloudflare Edge / DNS Proxied ]
   │
   ▼
[ LXC 100: Cloudflare Tunnel (HomeServerAdi) ]
   │
   ├──▶ http://192.168.1.102:8080 ──▶ [ wordpress-app (8080:80) ]
   │                                           │
   │                                           ▼ (wp-network)
   │                                     [ wordpress-db (MariaDB 3306 internal) ]
   │
   ├──▶ http://192.168.1.102:80   ──▶ [ exam-ai-nginx (80:80) ]
   │                                           │
   │                                           ├──▶ [ nextjs-dashboard (3000) ]
   │                                           └──▶ [ fastapi-backend  (8000) ]
   │                                                       │
   │                                                       ├──▶ [ exam postgres (5432 internal) ]
   │                                                       └──▶ [ exam redis    (6379 internal) ]
   │
   └──▶ http://192.168.1.102:3001 ──▶ [ chatbot_app (Host Mode :3001) ]
                                               │
                                               ▼ (via localhost:5433)
                                         [ chatbot_postgres (127.0.0.1:5433 -> 5432) ]
```

### Tabel Rangkuman Alokasi Port Host VM (192.168.1.102)

| Port Host | Protokol | Bind Address | Service Pemilik | Fungsi / URL Publik |
| :---: | :---: | :---: | :--- | :--- |
| **`80`** | TCP | `0.0.0.0` | `exam-ai-nginx` | Reverse proxy Exam AI (`exam.adi-muhamad.my.id`) |
| **`3000`** | TCP | `0.0.0.0` | `exam-ai-system-nextjs-dashboard-1` | Internal Frontend Dashboard Exam AI |
| **`3001`** | TCP | `0.0.0.0` | `chatbot_app` (Host Mode) | **Frontend & API Chatbot** (`chat.adi-muhamad.my.id`) |
| **`5433`** | TCP | `127.0.0.1` | `chatbot_postgres` (pgvector 16) | **Database Vektor Chatbot** (dibatasi ke localhost) |
| **`8000`** | TCP | `0.0.0.0` | `exam-ai-system-fastapi-backend-1` | Backend FastAPI Exam AI |
| **`8080`** | TCP | `0.0.0.0` | `wordpress-app` | Web Server Apache WordPress (`adi-muhamad.my.id`) |
| **`22`** | TCP | `0.0.0.0` | `sshd` | SSH Server Host |

> [!IMPORTANT]
> **Port Internal yang Terisolasi (Hanya di dalam Docker Network)**:
> - **MariaDB WordPress**: `3306/tcp` (di network `wordpress_wp-network`) - **TIDAK** diekspos ke host.
> - **PostgreSQL Exam AI**: `5432/tcp` (di network `exam-ai-system_exam-network`) - **TIDAK** diekspos ke host.
> - **Redis Exam AI**: `6379/tcp` (di network `exam-ai-system_exam-network`) - **TIDAK** diekspos ke host.

---

## 3. Arsitektur & Konfigurasi Masing-Masing Aplikasi

### A. WordPress Blog
- **Lokasi Project**: `/home/adi/wordpress`
- **Domain Publik**: [https://adi-muhamad.my.id/](https://adi-muhamad.my.id/)
- **Target Ingress Tunnel**: `http://192.168.1.102:8080`
- **Docker Network**: `wordpress_wp-network` (bridge)
- **Komponen Kontainer**:
  1. `wordpress-app`:
     - Image: `wordpress:php8.2-apache`
     - Port Mapping: `0.0.0.0:8080 -> 80/tcp`
  2. `wordpress-db`:
     - Image: `mariadb:10.11`
     - Port: `3306/tcp` (hanya internal network docker)
     - Volume: `wordpress_db_data -> /var/lib/mysql`
- **Perintah Operasional**:
  ```bash
  cd /home/adi/wordpress
  docker compose ps
  docker compose restart
  ```

---

### B. Exam AI System
- **Lokasi Project**: `/home/adi/exam-ai-system`
- **Domain Publik**: [https://exam.adi-muhamad.my.id/](https://exam.adi-muhamad.my.id/)
- **Target Ingress Tunnel**: `http://192.168.1.102:80`
- **Docker Network**: `exam-ai-system_exam-network` (bridge)
- **Komponen Kontainer**:
  1. `exam-ai-nginx`: Reverse Proxy pada Port Host `80`
  2. `exam-ai-system-nextjs-dashboard-1`: Next.js pada Port Host `3000`
  3. `exam-ai-system-fastapi-backend-1`: FastAPI pada Port Host `8000`
  4. `exam-ai-system-celery-worker-1`: Background async worker
  5. `exam-ai-system-postgres-1`: PostgreSQL 15 pada port internal `5432`
  6. `exam-ai-system-redis-1`: Redis 7 pada port internal `6379`
- **Perintah Operasional**:
  ```bash
  cd /home/adi/exam-ai-system
  docker compose ps
  docker compose logs -f fastapi-backend
  ```

---

### C. Ferdii-AI-Asissten
- **Lokasi Project**: `/home/adi/chat-adimuhamad`
- **Domain Publik**: [https://chat.adi-muhamad.my.id/](https://chat.adi-muhamad.my.id/)
- **Target Ingress Tunnel**: `http://192.168.1.102:3001`
- **Jaringan & Alasan Host Mode**:
  Service `app` menggunakan `network_mode: "host"` agar proses Next.js langsung bind ke port `3001` VM host dan mengakses DB di `localhost:5433` tanpa terganggu aturan TTL / NAT bridge.
- **Komponen Kontainer**:
  1. `chatbot_app`:
     - Image: `chat-adimuhamad-app` (dibangun dari `Dockerfile` multi-stage Node 20)
     - Mode Jaringan: `host` (`PORT=3001`)
     - File Config: `.env.local`
     - Healthcheck: `http://localhost:3001/api/health`
  2. `chatbot_postgres`:
     - Image: `pgvector/pgvector:pg16`
     - Port Mapping: `127.0.0.1:5433 -> 5432/tcp` (menggunakan 5433 untuk mencegah konflik dengan database postgres lain)
     - Inisialisasi DB: Otomatis me-load `backup_db_sontoloyo.sql` (10 chunk vektor dokumen + chat history)
     - Volume: `chat-adimuhamad_postgres_data -> /var/lib/postgresql/data`
- **Perintah Operasional**:
  ```bash
  cd /home/adi/chat-adimuhamad
  bash start.sh   # Menyalakan service
  bash stop.sh    # Mematikan service
  docker compose logs -f app
  ```

---

## 4. Pemetaan Cloudflare Tunnel (LXC 100)

Konfigurasi Tunnel berjalan di Proxmox LXC 100 (`HomeServerAdi`). File ingress config memetakan:

```yaml
ingress:
  # 1. WordPress Blog
  - hostname: adi-muhamad.my.id
    service: http://192.168.1.102:8080

  # 2. Exam AI System
  - hostname: exam.adi-muhamad.my.id
    service: http://192.168.1.102:80

  # 3. Ferdii-AI-Asissten
  - hostname: chat.adi-muhamad.my.id
    service: http://192.168.1.102:3001

  # Fallback rule
  - service: http_status:404
```

---

## 5. Pencegahan Masalah & Troubleshooting Penting

### A. Kapasitas Disk & LVM (Catatan Insiden MariaDB)
> [!CAUTION]
> **Pelajaran Insiden**:
> Jika build image Docker dilakukan saat kapasitas disk hampir habis, proses build akan menghabiskan sisa blok disk. Database aktif (seperti MariaDB `wordpress-db`) yang sedang menulis WAL/InnoDB buffer ke disk akan mengalami **General Protection Fault / Crash** seketika dan mati.

**Solusi & Aturan**:
1. Partisi root LVM VM telah diexpand dari 15 GB menjadi **30 GB** (`ubuntu-vg/ubuntu-lv`).
2. Sebelum melakukan build image baru, selalu periksa ruang bebas:
   ```bash
   df -h /
   ```
   Pastikan ruang bebas (`Avail`) di atas **5 GB**.
3. Jika build cache menumpuk, bersihkan dengan aman:
   ```bash
   docker builder prune -f
   ```

### B. Pencegahan Konflik Port Antar-Database
- **Jangan pernah mengekspos PostgreSQL baru ke port host `5432`**, karena port 5432 rentan bertabrakan dengan instance postgres lain.
- **Standar untuk Chatbot**: Selalu gunakan port host **`5433`** (`127.0.0.1:5433:5432`).
- Database MariaDB WordPress tetap dibiarkan **internal network saja** (`3306` tanpa mapping ke host).

### C. Aturan TTL Jaringan
Server ini menggunakan systemd service `fix-docker-ttl.service` untuk memastikan konektivitas bridge Docker tidak terputus akibat limitasi TTL router/provider. Jika ada kontainer baru di masa depan yang tidak dapat mengakses internet, periksa status service ini:
```bash
sudo systemctl status fix-docker-ttl.service
```

---

## 6. Cheat Sheet Perintah Operasional untuk Admin Baru

### Pengecekan Kesehatan Semua Service Sekaligus
```bash
# 1. Cek semua kontainer
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Cek endpoint lokal
curl -s http://localhost:8080 | head -n 5        # WordPress (redirect 301/200)
curl -s http://localhost:80 | head -n 5          # Exam AI
curl -s http://localhost:3001/api/health        # Chatbot (harus status: healthy)

# 3. Cek endpoint publik
curl -ILs https://adi-muhamad.my.id | head -n 5
curl -ILs https://exam.adi-muhamad.my.id | head -n 5
curl -ILs https://chat.adi-muhamad.my.id | head -n 5
```

### Melakukan Ingestion Data Artikel Baru ke Chatbot
```bash
cd /home/adi/chat-adimuhamad

# Import file tunggal
docker exec chatbot_app node ingest-postgres.js --file /app/Dokumentasi/artikel-baru.txt --source "Blog Post Baru"

# Import direktori
docker exec chatbot_app node ingest-postgres.js --dir /app/Dokumentasi --source "Kumpulan Artikel"
```

### Memulihkan / Backup Database Chatbot
```bash
# Backup database chatbot ke file SQL
docker exec chatbot_postgres pg_dump -U postgres -d chatbot_db > backup_terbaru.sql

# Restore dari file SQL
cat backup_terbaru.sql | docker exec -i chatbot_postgres psql -U postgres -d chatbot_db
```
