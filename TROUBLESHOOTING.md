# 🛠️ Guia de Solução de Problemas

Este guia ajuda a resolver os problemas mais comuns do DocuSign Document Downloader.

## 🔍 Diagnóstico Rápido

### 1. Verificar Configurações
```bash
npm run test-config
```

### 2. Verificar Chave Privada
```bash
npm run check-key
```

### 3. Gerar Nova Chave (se necessário)
```bash
npm run generate-key
```

## ❌ Problemas Comuns

### 🔐 "secretOrPrivateKey must have a value"

**Causa:** A chave privada RSA não foi carregada corretamente.

**Soluções:**

1. **Verificar se o arquivo existe:**
   ```bash
   # Verificar se private.key existe na raiz do projeto
   ls -la private.key
   
   # Ou no Windows
   dir private.key
   ```

2. **Verificar se o arquivo não está vazio:**
   ```bash
   npm run check-key
   ```

3. **Gerar nova chave se necessário:**
   ```bash
   npm run generate-key
   ```

4. **Verificar permissões do arquivo:**
   - Windows: Clique direito > Propriedades > Segurança
   - Linux/Mac: `chmod 600 private.key`

### 🔑 "invalid_grant"

**Causa:** Problema na autenticação JWT.

**Soluções:**

1. **Verificar se a chave pública está configurada no DocuSign:**
   - Acesse o [DocuSign Developer Portal](https://developers.docusign.com/)
   - Vá em sua aplicação > Authentication > JWT
   - Verifique se a chave pública RSA está configurada

2. **Verificar se as credenciais estão corretas:**
   ```bash
   npm run test-config
   ```

3. **Verificar se o usuário tem permissão de impersonation:**
   - No DocuSign Admin, vá em "Users"
   - Encontre seu usuário
   - Verifique se "Can impersonate" está habilitado

4. **Verificar se você está usando o ambiente correto:**
   ```bash
   # Para ambiente de produção
   DOCUSIGN_BASE_PATH=https://na1.docusign.net/restapi
   
   # Para ambiente de demonstração
   DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
   ```

### 📁 "Arquivo não encontrado"

**Causa:** Caminho para chave privada está incorreto.

**Soluções:**

1. **Verificar caminho no .env:**
   ```bash
   DOCUSIGN_RSA_PRIVATE_KEY_PATH=./private.key
   ```

2. **Usar caminho absoluto se necessário:**
   ```bash
   DOCUSIGN_RSA_PRIVATE_KEY_PATH=C:\caminho\completo\para\private.key
   ```

### 🚫 "Variáveis de ambiente não definidas"

**Causa:** Arquivo .env não existe ou está mal configurado.

**Soluções:**

1. **Copiar arquivo de exemplo:**
   ```bash
   cp config.env.example .env
   ```

2. **Verificar se o .env está na raiz do projeto:**
   ```bash
   ls -la .env
   ```

3. **Verificar sintaxe do .env:**
   - Não deve ter espaços ao redor do `=`
   - Não deve ter aspas desnecessárias
   - Exemplo correto: `DOCUSIGN_INTEGRATION_KEY=12345`

### 🌐 "Request failed with status code 401"

**Causa:** Token de acesso inválido ou expirado.

**Soluções:**

1. **Verificar credenciais:**
   - Integration Key
   - User ID
   - Account ID

2. **Verificar se a aplicação DocuSign está ativa:**
   - No Developer Portal, verifique se sua aplicação está "Active"

3. **Verificar escopo de permissões:**
   - Certifique-se de que o escopo inclui "signature" e "impersonation"

### 🔄 "Rate limit exceeded"

**Causa:** Muitas requisições em pouco tempo.

**Soluções:**

1. **Aguardar automaticamente (já implementado):**
   - O script aguarda automaticamente quando atinge o limite

2. **Reduzir velocidade:**
   ```bash
   RATE_LIMIT_REQUESTS_PER_MINUTE=200
   RATE_LIMIT_DELAY_MS=500
   ```

3. **Reduzir downloads paralelos:**
   ```bash
   MAX_CONCURRENT_DOWNLOADS=2
   ```

## 🔧 Comandos de Diagnóstico

### Testar Autenticação
```javascript
// Adicione ao final do index.js temporariamente
async function testAuth() {
    const manager = new DocuSignDownloadManager();
    await manager.initialize();
    console.log('✅ Autenticação funcionando!');
}
testAuth().catch(console.error);
```

### Verificar Conectividade
```bash
# Testar conectividade com DocuSign
curl -I https://demo.docusign.net/restapi

# Ou para produção
curl -I https://na1.docusign.net/restapi
```

### Verificar Estrutura de Arquivos
```bash
# Verificar se todos os arquivos necessários existem
ls -la src/
ls -la private.key
ls -la .env
```

## 🚀 Passos de Recuperação

Se nada funcionar, siga estes passos na ordem:

### 1. Limpar e Reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. Recriar Configurações
```bash
rm .env private.key public.key
cp config.env.example .env
npm run generate-key
```

### 3. Configurar DocuSign Novamente
1. Acesse o [DocuSign Developer Portal](https://developers.docusign.com/)
2. Crie uma nova aplicação
3. Configure JWT Authentication
4. Adicione a chave pública gerada
5. Copie Integration Key, User ID, Account ID

### 4. Testar Configuração
```bash
npm run test-config
npm run check-key
npm start
```

## 📞 Suporte Adicional

### Logs Detalhados
Para obter mais informações sobre erros:
```bash
DEBUG=* npm start
```

### Verificar Versões
```bash
node --version  # Deve ser 14+
npm --version
```

### Contatos de Suporte
- [DocuSign Developer Center](https://developers.docusign.com/)
- [DocuSign Support](https://support.docusign.com/)
- [DocuSign Community](https://community.docusign.com/)

## 🔄 Problemas Conhecidos

### Windows com OpenSSL
Se `npm run generate-key` falhar no Windows:
1. Instale OpenSSL: https://slproweb.com/products/Win32OpenSSL.html
2. Adicione ao PATH: `C:\Program Files\OpenSSL-Win64\bin`
3. Reinicie o terminal

### Firewall Corporativo
Se estiver atrás de firewall corporativo:
1. Configure proxy se necessário
2. Permita acesso a `*.docusign.net`
3. Permita acesso à porta 443 (HTTPS)

### Antivírus Interferindo
Alguns antivírus podem bloquear:
1. Adicione exceção para a pasta do projeto
2. Adicione exceção para Node.js
3. Temporariamente desabilite proteção em tempo real

---

**💡 Dica:** Sempre mantenha suas credenciais e chaves privadas seguras e nunca as compartilhe publicamente! 