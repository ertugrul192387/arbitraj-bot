#!/bin/bash

# Arbitraj Bot - Hetzner + Cloudflare Deploy Script
set -e

echo "========================================="
echo "   Arbitraj Bot - Hetzner Deploy"
echo "========================================="

# Renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Docker kontrolü
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker kuruluyor...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose kuruluyor...${NC}"
    apt update && apt install docker-compose -y
fi

# SSL klasörü kontrol
if [ ! -f "ssl/cloudflare.crt" ] || [ ! -f "ssl/cloudflare.key" ]; then
    echo -e "${RED}HATA: SSL sertifikaları bulunamadı!${NC}"
    echo ""
    echo "Cloudflare'den Origin Certificate oluşturun:"
    echo "1. Cloudflare Dashboard → SSL/TLS → Origin Server"
    echo "2. Create Certificate"
    echo "3. Sertifikaları indirin ve şu dosyalara kaydedin:"
    echo "   - ssl/cloudflare.crt (Origin Certificate)"
    echo "   - ssl/cloudflare.key (Private Key)"
    echo ""
    mkdir -p ssl
    echo "ssl/ klasörü oluşturuldu. Sertifikaları ekleyin ve tekrar çalıştırın."
    exit 1
fi

echo -e "${GREEN}SSL sertifikaları bulundu.${NC}"

# Firewall ayarları
echo -e "${YELLOW}Firewall ayarlanıyor...${NC}"
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true

# Build ve başlat
echo -e "${GREEN}Servisler başlatılıyor...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Bekle ve kontrol et
sleep 10

if docker-compose ps | grep -q "Up"; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}   Deploy başarılı!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "Dashboard: https://ertugrulgaziabaci.com.tr"
    echo "API:       https://api.ertugrulgaziabaci.com.tr/coins"
    echo ""
    echo "Loglar: docker-compose logs -f"
else
    echo -e "${RED}Bir sorun oluştu. Logları kontrol edin:${NC}"
    docker-compose logs
fi
