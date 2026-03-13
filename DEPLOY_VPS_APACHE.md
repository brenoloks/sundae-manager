# Gelatech PDV - Deploy VPS com Apache

## 📋 Visão Geral

Este guia configura o deploy do Gelatech PDV em VPS própria com:
- **Domínio:** `gelatech.axissistemas.com.br`
- **API:** `api.gelatech.axissistemas.com.br`
- **Web Server:** Apache
- **Backend:** Supabase Self-Hosted (Docker)

## 🌐 DNS - Configuração Necessária

Adicione estes registros A no seu DNS (Registro.br ou provedor):

```
Tipo  Nome                           Valor
A     gelatech.axissistemas.com.br   SEU_IP_DA_VPS
A     api.gelatech.axissistemas.com.br SEU_IP_DA_VPS
```

## 🚀 Deploy Rápido (Copiar e Colar)

### 1. Copiar Script para VPS

```bash
# Na sua máquina local, envie o script para a VPS
scp deploy-vps-apache.sh root@SEU_IP:/root/
```

### 2. Executar na VPS

```bash
# Acesse a VPS
ssh root@SEU_IP

# Torne executável e rode
chmod +x deploy-vps-apache.sh
./deploy-vps-apache.sh
```

### 3. Deploy do Frontend

```bash
# Na máquina local, faça o build
npm run build

# Envie para a VPS
rsync -av --delete dist/ root@SEU_IP:/var/www/gelatech/dist/
```

### 4. SSL (HTTPS)

Após o DNS propagar (pode levar até 24h):

```bash
# Na VPS
certbot --apache -d gelatech.axissistemas.com.br -d api.gelatech.axissistemas.com.br
```

## 🐳 Supabase na VPS

### Clonar e Configurar

```bash
# Criar diretório
mkdir -p /opt/supabase
cd /opt/supabase

# Clonar
git clone https://github.com/supabase/supabase.git
cd supabase/docker

# Copiar configuração de exemplo
cp .env.example .env
```

### Configurar .env do Supabase

Edite o arquivo `.env` e altere:

```env
# POSTGRES
POSTGRES_PASSWORD=sua-senha-forte-aqui

# Auth/JWT
JWT_SECRET=sua-jwt-secret-aleatoria-minimo-32-caracteres
ANON_KEY=sua-anon-key-gerada
SERVICE_ROLE_KEY=sua-service-role-key-gerada

# URLs (use o IP da VPS temporariamente ou o domínio)
SITE_URL=http://gelatech.axissistemas.com.br
ADDITIONAL_REDIRECT_URLS=http://gelatech.axissistemas.com.br,https://gelatech.axissistemas.com.br

# Desabilitar signup se quiser controle manual
ENABLE_SIGNUP=true
```

### Gerar Chaves JWT

```bash
# Gerar JWT_SECRET (use o mesmo no .env)
openssl rand -base64 32

# Gerar ANON_KEY e SERVICE_ROLE_KEY
# Acesse: https://supabase.com/docs/guides/self-hosting#generate-api-keys
# Ou use o gerador online
```

### Iniciar Supabase

```bash
cd /opt/supabase/docker
docker compose pull
docker compose up -d
```

### Verificar se está rodando

```bash
docker compose ps
curl http://localhost:8000/health
```

## 🔄 Atualizar Frontend

Sempre que fizer alterações no código:

```bash
# Local
npm run build

# Enviar para VPS
rsync -av --delete dist/ root@SEU_IP:/var/www/gelatech/dist/
```

## 📊 Comandos Úteis

```bash
# Ver logs Apache
tail -f /var/www/gelatech/logs/error.log
tail -f /var/www/gelatech/logs/api-error.log

# Reiniciar Apache
systemctl restart apache2

# Ver status Supabase
cd /opt/supabase/docker && docker compose ps

# Reiniciar Supabase
cd /opt/supabase/docker && docker compose restart

# Ver logs Supabase
cd /opt/supabase/docker && docker compose logs -f
```

## 🔒 Segurança

```bash
# Firewall - permitir apenas portas necessárias
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH - restrinja ao seu IP se possível
ufw enable

# Verificar status
ufw status
```

## 🆘 Troubleshooting

### Apache não inicia
```bash
apache2ctl configtest
journalctl -xe
```

### WebSocket não funciona (Realtime)
```bash
# Verificar se proxy_wstunnel está ativo
a2enmod proxy_wstunnel
systemctl restart apache2
```

### CORS erros
Verifique se os headers estão configurados no VirtualHost da API.

### SSL não funciona
```bash
# Renovar certificados
certbot renew --dry-run

# Verificar status
certbot certificates
```

## 📁 Estrutura de Arquivos na VPS

```
/var/www/gelatech/
├── dist/                  # Frontend buildado
├── logs/                  # Logs Apache
│   ├── access.log
│   ├── error.log
│   ├── api-access.log
│   └── api-error.log

/etc/apache2/sites-available/
├── gelatech.conf         # Frontend VirtualHost
└── gelatech-api.conf     # API VirtualHost

/opt/supabase/
└── docker/               # Supabase self-hosted
    ├── docker-compose.yml
    └── .env
```

## 🔗 URLs Finais

| Serviço | URL |
|---------|-----|
| Frontend | https://gelatech.axissistemas.com.br |
| API | https://api.gelatech.axissistemas.com.br |
| Supabase Studio | http://SEU_IP:8000 (não expor publicamente!) |

---

**Nota:** Mantenha o arquivo `.env.production` seguro e não o compartilhe publicamente.
