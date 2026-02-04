# Arbitraj Bot - VPS Deploy Rehberi

## Gereksinimler
- Ubuntu 20.04+ VPS
- Docker & Docker Compose
- Domain DNS ayarları

---

## 1. DNS Ayarları

Domain sağlayıcınızda şu kayıtları ekleyin:

| Tür | İsim | Değer |
|-----|------|-------|
| A | @ | VPS_IP_ADRESI |
| A | www | VPS_IP_ADRESI |
| A | api | VPS_IP_ADRESI |

---

## 2. VPS'e Bağlanın

```bash
ssh root@VPS_IP_ADRESI
```

---

## 3. Docker Kurulumu (Eğer yoksa)

```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose kurulumu
apt install docker-compose -y

# Docker'ı başlat
systemctl start docker
systemctl enable docker
```

---

## 4. Projeyi VPS'e Yükleyin

**Yöntem 1: Git ile (önerilen)**
```bash
cd /opt
git clone https://github.com/KULLANICI_ADI/arbitraj-bot.git
cd arbitraj-bot
```

**Yöntem 2: SCP ile**
Lokal bilgisayarınızdan:
```bash
scp -r C:\Users\cirag\arbitraj-bot root@VPS_IP:/opt/
```

---

## 5. SSL Sertifikası Alın (Let's Encrypt)

```bash
cd /opt/arbitraj-bot

# Certbot klasörlerini oluştur
mkdir -p certbot/conf certbot/www

# Önce HTTP ile nginx başlat (SSL olmadan)
# nginx.conf dosyasını düzenleyin, SSL satırlarını yorum yapın

# İlk sertifika alımı
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d ertugrulgaziabaci.com.tr \
  -d www.ertugrulgaziabaci.com.tr \
  -d api.ertugrulgaziabaci.com.tr \
  --email your-email@example.com \
  --agree-tos
```

---

## 6. Projeyi Başlatın

```bash
cd /opt/arbitraj-bot

# Build ve başlat
docker-compose up -d --build

# Logları kontrol et
docker-compose logs -f
```

---

## 7. Kontrol

Tarayıcıda açın:
- https://ertugrulgaziabaci.com.tr (Dashboard)
- https://api.ertugrulgaziabaci.com.tr/coins (API)

---

## Faydalı Komutlar

```bash
# Durumu kontrol et
docker-compose ps

# Logları gör
docker-compose logs -f

# Yeniden başlat
docker-compose restart

# Durdur
docker-compose down

# Güncelle ve yeniden başlat
git pull
docker-compose up -d --build
```

---

## Sorun Giderme

**Port kullanımda hatası:**
```bash
# 80 veya 443 portunu kullanan servisleri bul
netstat -tlnp | grep -E ':80|:443'
# Varsa durdur (örn: apache)
systemctl stop apache2
```

**SSL hatası:**
```bash
# Sertifikaları kontrol et
ls -la certbot/conf/live/
```

**Container çalışmıyor:**
```bash
# Detaylı log
docker-compose logs backend
docker-compose logs frontend
```
