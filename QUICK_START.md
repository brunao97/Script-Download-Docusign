# 🚀 Guia de Início Rápido

Este guia te ajudará a configurar e executar o script de download do DocuSign em poucos minutos.

## ⚡ Instalação Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e configure suas credenciais:
```bash
cp config.env.example .env
```

Edite o arquivo `.env` com suas informações:
```bash
# Configurações Obrigatórias
DOCUSIGN_INTEGRATION_KEY=sua_integration_key_aqui
DOCUSIGN_USER_ID=seu_user_id_aqui
DOCUSIGN_ACCOUNT_ID=seu_account_id_aqui
```

### 3. Adicionar Chave Privada RSA
Coloque sua chave privada RSA na raiz do projeto como `private.key`

### 4. Executar o Script
```bash
npm start
```

## 🎯 Primeiros Passos

### 1. Configurar Consentimento da Aplicação
**IMPORTANTE:** Este é o primeiro passo obrigatório para usar JWT Grant:
```bash
npm run setup-consent
```
1. Copie a URL gerada
2. Abra no navegador
3. Faça login no DocuSign
4. Aceite o consentimento
5. Ignore a mensagem de erro e feche a aba

### 2. Testar Autenticação JWT
Para verificar se a autenticação está funcionando corretamente:
```bash
npm run test-jwt
```
Este comando testa todo o fluxo de autenticação JWT conforme a [documentação oficial](https://developers.docusign.com/platform/auth/jwt-get-token/).

### 3. Testar Conexão Básica
Para verificar se tudo está funcionando, execute:
```bash
node examples/example-usage.js 3
```
Isso irá listar seus envelopes sem fazer download.

### 4. Download Básico
Para baixar envelopes dos últimos 7 dias:
```bash
node examples/example-usage.js 1
```

### Ver Todos os Exemplos
```bash
node examples/example-usage.js
```

## 🔧 Configurações Essenciais

### Para Ambiente de Produção
```bash
DOCUSIGN_BASE_PATH=https://na1.docusign.net/restapi
```

### Para Ambiente de Demonstração
```bash
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

### Otimizar Performance
```bash
MAX_CONCURRENT_DOWNLOADS=10
RATE_LIMIT_REQUESTS_PER_MINUTE=500
```

## 🆘 Solução de Problemas Comuns

### ❌ "Chave privada RSA não encontrada"
**Solução:** Verifique se o arquivo `private.key` existe na raiz do projeto.

### ❌ "invalid_grant"
**Solução:** Verifique se:
- A Integration Key está correta
- O User ID está correto
- A chave privada corresponde à chave pública configurada no DocuSign

### ❌ "Account ID not found"
**Solução:** Verifique se o Account ID está correto. Pode ser encontrado na URL do DocuSign.

## 📞 Próximos Passos

1. **Leia a documentação completa:** `README.md`
2. **Explore os exemplos:** pasta `examples/`
3. **Personalize para suas necessidades:** edite `index.js`
4. **Configure agenda automática:** use cron ou similar

## 🎉 Pronto!

Agora você já pode baixar seus documentos e certificados do DocuSign automaticamente!

Para mais detalhes, consulte o [README.md](./README.md) completo. 