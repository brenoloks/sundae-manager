#!/bin/bash
# ============================================
# Deploy Gelatech PDV - VPS com Apache
# Frontend: gelatech.axissistemas.com.br
# API:      api.gelatech.axissistemas.com.br
# Pasta:    /var/www/gelatech.axissistemas
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploy Gelatech PDV - Início${NC}"

# ============================================
# 1. INSTALAR DEPENDÊNCIAS
# ============================================
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt update -y
apt install -y apache2 certbot python3-certbot-apache docker.io docker-compose curl git

# ============================================
# 2. ATIVAR MÓDULOS APACHE
# ============================================
echo -e "${YELLOW}🔧 Ativando módulos Apache...${NC}"
a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl expires deflate

# ============================================
# 3. CRIAR DIRETÓRIOS
# ============================================
echo -e "${YELLOW}📁 Criando diretórios...${NC}"
mkdir -p /var/www/gelatech.axissistemas/dist
mkdir -p /var/www/gelatech.axissistemas/logs

# ============================================
# 4. VIRTUALHOST FRONTEND
# ============================================
echo -e "${YELLOW}🌐 Configurando Frontend...${NC}"
cat > /etc/apache2/sites-available/gelatech.conf << 'EOF'
<VirtualHost *:80>
    ServerName gelatech.axissistemas.com.br
    DocumentRoot /var/www/gelatech.axissistemas/dist

    ErrorLog /var/www/gelatech.axissistemas/logs/error.log
    CustomLog /var/www/gelatech.axissistemas/logs/access.log combined

    <Directory /var/www/gelatech.axissistemas/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    # Cache de assets estáticos
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/webp "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
        ExpiresByType font/woff2 "access plus 1 year"
    </IfModule>

    # Compressão Gzip
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
    </IfModule>
</VirtualHost>
EOF

# ============================================
# 5. VIRTUALHOST API (Proxy → Supabase)
# ============================================
echo -e "${YELLOW}🔌 Configurando API Proxy...${NC}"
cat > /etc/apache2/sites-available/gelatech-api.conf << 'EOF'
<VirtualHost *:80>
    ServerName api.gelatech.axissistemas.com.br

    ErrorLog /var/www/gelatech.axissistemas/logs/api-error.log
    CustomLog /var/www/gelatech.axissistemas/logs/api-access.log combined

    # Proxy para Supabase (Kong)
    ProxyPreserveHost On
    ProxyPass / http://localhost:8000/
    ProxyPassReverse / http://localhost:8000/

    # WebSocket (Realtime)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:8000/$1" [P,L]

    # CORS
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    Header always set Access-Control-Allow-Headers "apikey, authorization, content-type, x-client-info, x-supabase-api-version, prefer, range"

    # Preflight
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=204,L]
</VirtualHost>
EOF

# ============================================
# 6. ATIVAR SITES
# ============================================
echo -e "${YELLOW}✅ Ativando sites...${NC}"
a2dissite 000-default.conf 2>/dev/null || true
a2ensite gelatech.conf
a2ensite gelatech-api.conf

# ============================================
# 7. TESTAR E REINICIAR
# ============================================
echo -e "${YELLOW}🔄 Testando configuração...${NC}"
apache2ctl configtest
systemctl enable apache2
systemctl restart apache2

# ============================================
# 8. FIREWALL
# ============================================
echo -e "${YELLOW}🔒 Configurando firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ============================================
# 9. SUPABASE SELF-HOSTED
# ============================================
echo -e "${YELLOW}🐳 Configurando Supabase...${NC}"
mkdir -p /opt/supabase
cd /opt/supabase

if [ ! -d "supabase" ]; then
    git clone --depth 1 https://github.com/supabase/supabase.git
fi

cd supabase/docker
cp .env.example .env

# Gerar secrets
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
DASHBOARD_PASSWORD=$(openssl rand -base64 16)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SECRETS GERADOS (SALVE EM LOCAL SEGURO!)${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "JWT_SECRET:         ${YELLOW}${JWT_SECRET}${NC}"
echo -e "POSTGRES_PASSWORD:  ${YELLOW}${POSTGRES_PASSWORD}${NC}"
echo -e "DASHBOARD_PASSWORD: ${YELLOW}${DASHBOARD_PASSWORD}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Atualizar .env com valores
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
sed -i "s|SITE_URL=.*|SITE_URL=https://gelatech.axissistemas.com.br|" .env
sed -i "s|STUDIO_DEFAULT_ORGANIZATION=.*|STUDIO_DEFAULT_ORGANIZATION=Gelatech|" .env
sed -i "s|STUDIO_DEFAULT_PROJECT=.*|STUDIO_DEFAULT_PROJECT=Gelatech PDV|" .env
sed -i "s|DASHBOARD_USERNAME=.*|DASHBOARD_USERNAME=admin|" .env
sed -i "s|DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}|" .env

echo -e "${YELLOW}⚠️  IMPORTANTE: Você precisa gerar as chaves ANON_KEY e SERVICE_ROLE_KEY${NC}"
echo -e "Use o JWT_SECRET acima em: ${GREEN}https://supabase.com/docs/guides/self-hosting#api-keys${NC}"
echo -e "Depois edite: ${GREEN}/opt/supabase/supabase/docker/.env${NC}"
echo ""

# ============================================
# RESUMO FINAL
# ============================================
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure DNS no Registro.br:"
echo "   A  gelatech.axissistemas.com.br      → IP_DA_VPS"
echo "   A  api.gelatech.axissistemas.com.br   → IP_DA_VPS"
echo ""
echo "2. Gere as chaves JWT e edite o .env do Supabase:"
echo "   nano /opt/supabase/supabase/docker/.env"
echo "   # Preencha ANON_KEY e SERVICE_ROLE_KEY"
echo ""
echo "3. Inicie o Supabase:"
echo "   cd /opt/supabase/supabase/docker"
echo "   docker compose pull"
echo "   docker compose up -d"
echo ""
echo "4. Faça deploy do frontend (na sua máquina local):"
echo "   npm run build"
echo "   rsync -avz --delete dist/ root@IP_DA_VPS:/var/www/gelatech.axissistemas/dist/"
echo ""
echo "5. SSL (após DNS propagar):"
echo "   certbot --apache -d gelatech.axissistemas.com.br -d api.gelatech.axissistemas.com.br"
echo ""
echo "6. Importe o schema do banco:"
echo "   psql -h localhost -U supabase_admin -d postgres -f /var/www/gelatech.axissistemas/schema.sql"
echo ""
echo "🔗 URLs:"
echo "   Frontend:  https://gelatech.axissistemas.com.br"
echo "   API:       https://api.gelatech.axissistemas.com.br"
echo "   Studio:    http://localhost:8000 (não expor!)"
