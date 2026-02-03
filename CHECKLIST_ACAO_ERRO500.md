# ✅ CHECKLIST DE AÇÃO - ERRO 500 NA VPS

**Data**: 2 de Fevereiro, 2026  
**Status**: 🔴 Pronto para executar  
**Responsável**: Você  
**Tempo estimado**: 10-15 minutos

---

## 📋 ANTES DE COMEÇAR

- [ ] Tenho a senha da VPS: `2705#Data2705`
- [ ] Tenho acesso SSH disponível
- [ ] Li o diagnóstico em `DIAGNOSTICO_ERRO500_VPS.md`
- [ ] Entendi o problema (backend não está rodando)

---

## 🚀 EXECUTAR AGORA

### FASE 1: Conectar na VPS

- [ ] Abrir terminal/SSH
- [ ] Executar: `ssh root@46.202.147.151`
- [ ] Inserir senha: `2705#Data2705`
- [ ] Verificar se conectou com sucesso

**Comando**:
```bash
ssh root@46.202.147.151
```

---

### FASE 2: Navegar para diretório correto

- [ ] Executar: `cd /var/www`
- [ ] Verificar se arquivo `docker-compose.yml` existe

**Comando**:
```bash
cd /var/www
ls -la docker-compose.yml
```

---

### FASE 3: Parar containers antigos (se houver)

- [ ] Executar: `docker-compose down`
- [ ] Aguardar conclusão

**Comando**:
```bash
docker-compose down
```

---

### FASE 4: Iniciar containers novos

- [ ] Executar: `docker-compose up -d`
- [ ] Verificar se containers iniciaram

**Comando**:
```bash
docker-compose up -d
```

**Verificar**:
```bash
docker ps
```

**Esperado ver**:
- Container: botia-backend
- Container: botia-frontend (opcional)
- Container: postgres
- Container: redis

---

### FASE 5: Verificar logs do backend

- [ ] Executar: `docker logs -f backend`
- [ ] Procurar por erros
- [ ] Prestar atenção em "listening on port 3000"

**Comando**:
```bash
docker logs -f backend
```

Pressione `Ctrl+C` para sair

---

### FASE 6: Testar se backend está respondendo

- [ ] Executar: `curl http://localhost:3000/health`
- [ ] Esperado: Resposta JSON com status 200 ou 201

**Comando**:
```bash
curl http://localhost:3000/health
```

**Esperado**:
```json
{"status":"ok"}
```

ou similar

---

### FASE 7: Recarregar Nginx

- [ ] Executar: `nginx -t`
- [ ] Verificar se "syntax is ok"
- [ ] Executar: `systemctl reload nginx`
- [ ] Aguardar conclusão

**Comando**:
```bash
nginx -t
systemctl reload nginx
```

---

### FASE 8: Testar via Nginx

- [ ] Executar: `curl http://localhost/api/health`
- [ ] Esperado: Resposta do backend através do nginx

**Comando**:
```bash
curl http://localhost/api/health
```

---

### FASE 9: Testar no navegador

- [ ] Abrir navegador
- [ ] Navegar para: `https://apipgsoft.shop`
- [ ] Verificar se carrega sem erro 500

**URL**: https://apipgsoft.shop

---

### FASE 10: Validação final

- [ ] Verificar se página carrega normalmente
- [ ] Clicar em alguns botões/links
- [ ] Verificar console do navegador (F12) para erros
- [ ] Testar alguma funcionalidade de API

**Sinais de sucesso**:
- ✅ Página carrega sem erro 500
- ✅ Console do navegador sem erros vermelhos
- ✅ Funcionalidades respondem corretamente
- ✅ Logs de backend não mostram erros críticos

---

## ⚠️ SE ALGO DER ERRADO

### Erro: "docker-compose: command not found"

```bash
# Verificar se docker-compose está instalado
docker-compose --version

# Se não tiver, instalar
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Erro: "no configuration file provided"

```bash
# Verificar se docker-compose.yml existe
ls -la /var/www/docker-compose.yml

# Se não existir, precisamos criar um novo arquivo
# Veja template em GUIA_CORRIGIR_ERRO500.md
```

### Erro: Backend não inicia

```bash
# Ver logs completos
docker logs backend

# Procurar por:
# - DATABASE_URL não encontrado
# - REDIS_URL não encontrado
# - Conexão com database recusada
# - Porta já em uso

# Se porta 3000 já estiver em uso
lsof -i :3000
kill -9 PID
```

### Erro: Ainda retorna 500

```bash
# Verificar se nginx está rotando requisições para backend
cat /etc/nginx/sites-enabled/apipgsoft.shop | grep -A5 "location /api"

# Esperado ver algo como:
# location /api/ {
#     proxy_pass http://localhost:3000;
# }
```

---

## 📞 SUPORTE

### Se você ficar preso:

1. **Verificar logs**:
   ```bash
   docker logs backend
   tail -50 /var/log/nginx/error.log
   ```

2. **Verificar status dos containers**:
   ```bash
   docker ps -a
   docker stats
   ```

3. **Verificar portas**:
   ```bash
   netstat -tlnp | grep -E '3000|80|443'
   ```

4. **Reiniciar tudo**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## ✅ CHECKLIST FINAL

- [ ] Fase 1: Conectado na VPS
- [ ] Fase 2: Navegou para `/var/www`
- [ ] Fase 3: Parou containers antigos (se houver)
- [ ] Fase 4: Iniciou containers novos
- [ ] Fase 5: Verificou logs (sem erros críticos)
- [ ] Fase 6: Backend responde na porta 3000
- [ ] Fase 7: Nginx configurado corretamente
- [ ] Fase 8: Nginx roteia para backend corretamente
- [ ] Fase 9: Website abre sem erro 500
- [ ] Fase 10: Funcionalidades básicas funcionam

---

## 🎉 SUCESSO!

Se você marcou todas as checkboxes acima, **o problema foi resolvido!**

- ✅ Backend está rodando
- ✅ Frontend está sendo servido
- ✅ Nginx está roteiando corretamente
- ✅ Erro 500 foi eliminado

**Próximo passo**: Aproveitar seu aplicativo! 🚀

---

**Tempo gasto**: ____________ (anote aqui)  
**Data de conclusão**: ____________  
**Observações**: ________________________________

