# Gelatech PDV - Deploy VPS com Apache

## Resumo

| Item | Valor |
|------|-------|
| Frontend | `gelatech.axissistemas.com.br` |
| API | `api.gelatech.axissistemas.com.br` |
| Pasta VPS | `/var/www/gelatech.axissistemas` |
| Web Server | Apache |
| Backend | Supabase Self-Hosted (Docker) |

## 1. DNS (Registro.br)

```
Tipo  Nome                                Valor
A     gelatech.axissistemas.com.br        IP_DA_VPS
A     api.gelatech.axissistemas.com.br    IP_DA_VPS
```

## 2. Deploy Rápido

```bash
# Enviar script para VPS
scp deploy-vps-apache.sh root@IP_DA_VPS:/root/

# Na VPS
ssh root@IP_DA_VPS
chmod +x deploy-vps-apache.sh
./deploy-vps-apache.sh
```

## 3. Gerar Chaves JWT

Acesse https://supabase.com/docs/guides/self-hosting#api-keys

Use o `JWT_SECRET` que o script gerou para criar:
- `ANON_KEY`
- `SERVICE_ROLE_KEY`

Edite o `.env` do Supabase:
```bash
nano /opt/supabase/supabase/docker/.env
# Preencha ANON_KEY e SERVICE_ROLE_KEY
```

## 4. Iniciar Supabase

```bash
cd /opt/supabase/supabase/docker
docker compose pull
docker compose up -d
docker compose ps  # verificar se tudo subiu
```

## 5. Importar Schema do Banco

```bash
# Copie o arquivo schema.sql para a VPS
scp schema.sql root@IP_DA_VPS:/var/www/gelatech.axissistemas/

# Na VPS, importe
cd /opt/supabase/supabase/docker
docker compose exec db psql -U supabase_admin -d postgres -f /var/www/gelatech.axissistemas/schema.sql
```

## 6. Deploy do Frontend

```bash
# Na máquina local
npm run build

# Enviar para VPS
rsync -avz --delete dist/ root@IP_DA_VPS:/var/www/gelatech.axissistemas/dist/
```

## 7. SSL (após DNS propagar)

```bash
certbot --apache -d gelatech.axissistemas.com.br -d api.gelatech.axissistemas.com.br
```

## 8. Atualizar Frontend

```bash
npm run build
rsync -avz --delete dist/ root@IP_DA_VPS:/var/www/gelatech.axissistemas/dist/
```

## Comandos Úteis

```bash
# Logs
tail -f /var/www/gelatech.axissistemas/logs/error.log
tail -f /var/www/gelatech.axissistemas/logs/api-error.log

# Apache
systemctl restart apache2
apache2ctl configtest

# Supabase
cd /opt/supabase/supabase/docker
docker compose ps
docker compose restart
docker compose logs -f
```

## Estrutura na VPS

```
/var/www/gelatech.axissistemas/
├── dist/          # Frontend build
├── logs/          # Logs Apache
└── schema.sql     # Schema do banco

/opt/supabase/supabase/docker/
├── docker-compose.yml
└── .env

/etc/apache2/sites-available/
├── gelatech.conf       # Frontend
└── gelatech-api.conf   # API Proxy
```
