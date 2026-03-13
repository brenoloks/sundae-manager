#!/bin/bash
# ============================================
# Script de Deploy - Gelatech PDV
# Domínio: gelatech.axissistemas.com.br
# ============================================

set -e

echo "🚀 Iniciando deploy do Gelatech PDV..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# 1. VERIFICAR DOMÍNIO
# ============================================
echo -e "${YELLOW}📋 Verificando configurações...${NC}"
echo "Domínio: gelatech.axissistemas.com.br"
echo "API: api.gelatech.axissistemas.com.br"

# ============================================
# 2. ATIVAR MÓDULOS APACHE
# ============================================
echo -e "${YELLOW}🔧 Ativando módulos Apache...${NC}"
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod rewrite
a2enmod headers
a2enmod ssl

# ============================================
# 3. CRIAR DIRETÓRIOS
# ============================================
echo -e "${YELLOW}📁 Criando diretórios...${NC}"
mkdir -p /var/www/gelatech/dist
mkdir -p /var/www/gelatech/logs

# ============================================
# 4. BACKUP DE CONFIGURAÇÕES EXISTENTES
# ============================================
echo -e "${YELLOW}💾 Fazendo backup de configurações existentes...${NC}"
timestamp=$(date +%Y%m%d_%H%M%S)
if [ -f /etc/apache2/sites-available/gelatech.conf ]; then
    cp /etc/apache2/sites-available/gelatech.conf /etc/apache2/sites-available/gelatech.conf.bak.$timestamp
fi
if [ -f /etc/apache2/sites-available/gelatech-api.conf ]; then
    cp /etc/apache2/sites-available/gelatech-api.conf /etc/apache2/sites-available/gelatech-api.conf.bak.$timestamp
fi

# ============================================
# 5. CRIAR VIRTUALHOST FRONTEND
# ============================================
echo -e "${YELLOW}🌐 Configurando VirtualHost Frontend...${NC}"
cat > /etc/apache2/sites-available/gelatech.conf << 'EOF'
<VirtualHost *:80>
    ServerName gelatech.axissistemas.com.br
    DocumentRoot /var/www/gelatech/dist
    
    # Logs
    ErrorLog /var/www/gelatech/logs/error.log
    CustomLog /var/www/gelatech/logs/access.log combined
    
    # Configuração do diretório
    <Directory /var/www/gelatech/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # React Router - Fallback para index.html
        FallbackResource /index.html
        
        # Cache para assets estáticos
        <IfModule mod_expires.c>
            ExpiresActive On
            ExpiresByType image/webp "access plus 1 year"
            ExpiresByType image/png "access plus 1 year"
            ExpiresByType image/jpg "access plus 1 year"
            ExpiresByType image/jpeg "access plus 1 year"
            ExpiresByType image/svg+xml "access plus 1 year"
            ExpiresByType text/css "access plus 1 month"
            ExpiresByType application/javascript "access plus 1 month"
        </IfModule>
    </Directory>
    
    # Compressão Gzip
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
    </IfModule>
</VirtualHost>
EOF

# ============================================
# 6. CRIAR VIRTUALHOST API (Supabase)
# ============================================
echo -e "${YELLOW}🔌 Configurando VirtualHost API...${NC}"
cat > /etc/apache2/sites-available/gelatech-api.conf << 'EOF'
<VirtualHost *:80>
    ServerName api.gelatech.axissistemas.com.br
    
    # Logs
    ErrorLog /var/www/gelatech/logs/api-error.log
    CustomLog /var/www/gelatech/logs/api-access.log combined
    
    # Proxy para o Supabase
    ProxyPreserveHost On
    ProxyPass / http://localhost:8000/
    ProxyPassReverse / http://localhost:8000/
    
    # WebSocket Support (Realtime)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:8000/$1" [P,L]
    
    # CORS Headers
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    Header always set Access-Control-Allow-Headers "apikey, authorization, content-type, x-client-info, x-supabase-api-version"
    
    # Preflight OPTIONS
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=204,L]
</VirtualHost>
EOF

# ============================================
# 7. ATIVAR SITES
# ============================================
echo -e "${YELLOW}✅ Ativando sites...${NC}"
a2ensite gelatech.conf
a2ensite gelatech-api.conf

# Desativar site padrão se existir
a2dissite 000-default.conf 2>/dev/null || true

# ============================================
# 8. REINICIAR APACHE
# ============================================
echo -e "${YELLOW}🔄 Reiniciando Apache...${NC}"
apache2ctl configtest
systemctl restart apache2

# ============================================
# 9. CONFIGURAR SSL (Let's Encrypt)
# ============================================
echo -e "${YELLOW}🔒 Configurando SSL com Let's Encrypt...${NC}"
echo "Execute manualmente após o DNS estar propagado:"
echo -e "${GREEN}certbot --apache -d gelatech.axissistemas.com.br -d api.gelatech.axissistemas.com.br${NC}"

# ============================================
# 10. VERIFICAÇÃO
# ============================================
echo -e "${YELLOW}🔍 Verificando configuração...${NC}"
apache2ctl configtest

echo ""
echo -e "${GREEN}✅ Configuração Apache concluída!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure os DNS records apontando para o IP da VPS:"
echo "   - A     gelatech.axissistemas.com.br     → SEU_IP"
echo "   - A     api.gelatech.axissistemas.com.br → SEU_IP"
echo ""
echo "2. Faça o build e deploy do frontend:"
echo "   npm run build"
echo "   rsync -av --delete dist/ /var/www/gelatech/dist/"
echo ""
echo "3. Inicie o Supabase na VPS:"
echo "   cd /opt/supabase/docker"
echo "   docker compose up -d"
echo ""
echo "4. Após DNS propagar, execute o certbot:"
echo "   certbot --apache -d gelatech.axissistemas.com.br -d api.gelatech.axissistemas.com.br"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://gelatech.axissistemas.com.br"
echo "   API:      http://api.gelatech.axissistemas.com.br"
echo ""
