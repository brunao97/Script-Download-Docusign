# 🔐 Configuração de Consentimento - DocuSign JWT

## 📚 O que é o Consentimento da Aplicação?

Antes de usar **JWT Grant** pela primeira vez, você deve obter o **consentimento do usuário** para que sua aplicação possa "impersonar" o usuário e fazer chamadas à API em nome dele.

Este é um requisito de segurança do DocuSign conforme a [documentação oficial](https://developers.docusign.com/platform/auth/jwt-get-token/).

## 🚀 Processo Automático

### 1. Gerar URL de Consentimento
```bash
npm run setup-consent
```

Este comando irá:
- ✅ Detectar automaticamente o ambiente (demo/produção)
- ✅ Gerar a URL de consentimento correta
- ✅ Exibir instruções passo a passo
- ✅ Tentar copiar a URL para o clipboard

### 2. Exemplo de Saída
```
🔐 CONFIGURAÇÃO DE CONSENTIMENTO DA APLICAÇÃO DOCUSIGN
====================================================

🌐 Ambiente detectado: DEMO/SANDBOX
🔗 Base URL de autenticação: https://account-d.docusign.com/oauth/auth
🔑 Integration Key: sua-integration-key

🌐 URL DE CONSENTIMENTO GERADA:
===============================
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature+impersonation&client_id=sua-key&redirect_uri=https://developers.docusign.com/platform/auth/consent

📋 INSTRUÇÕES PASSO A PASSO:
============================
1. 📋 COPIE a URL acima
2. 🌐 ABRA a URL em seu navegador
3. 🔐 FAÇA LOGIN em sua conta DocuSign
4. ✅ ACEITE o consentimento da aplicação
5. ⚠️  IGNORE a mensagem de erro "Não é possível carregar a página"
6. ✅ FECHE a aba do navegador
7. 🚀 EXECUTE: npm run test-jwt
```

## 📋 Passo a Passo Manual

### 1. Copiar URL
Copie a URL de consentimento gerada pelo comando.

### 2. Abrir no Navegador
Cole a URL em seu navegador preferido.

### 3. Login no DocuSign
Faça login em sua conta DocuSign:
- **Demo/Sandbox:** Use suas credenciais de desenvolvedor
- **Produção:** Use suas credenciais de produção

### 4. Aceitar Consentimento
Você verá uma tela de consentimento com:
- Nome da sua aplicação
- Permissões solicitadas (signature, impersonation)
- Botão "Accept" ou "Aceitar"

**Clique em "Accept".**

### 5. Ignorar Erro de Redirecionamento
Após aceitar, você verá uma mensagem de erro:
```
This site can't be reached
Could not load the page
```

**Isso é NORMAL!** O DocuSign redireciona para uma URL de exemplo que não existe. Simplesmente **feche a aba**.

### 6. Testar Autenticação
Execute o teste para confirmar:
```bash
npm run test-jwt
```

## 🛠️ Comandos Úteis

### Gerar URL de Consentimento
```bash
npm run setup-consent
```

### Verificar Status do Consentimento
```bash
npm run setup-consent check
```

### Ajuda sobre Consentimento
```bash
npm run setup-consent help
```

### Testar JWT após Consentimento
```bash
npm run test-jwt
```

## 🌐 URLs por Ambiente

### Ambiente Demo/Sandbox
- **Base Auth:** `https://account-d.docusign.com/oauth/auth`
- **Base API:** `https://demo.docusign.net/restapi`

### Ambiente Produção
- **Base Auth:** `https://account.docusign.com/oauth/auth`
- **Base API:** `https://na1.docusign.net/restapi` (ou outra região)

## ❓ Perguntas Frequentes

### P: Preciso dar consentimento toda vez?
**R:** Não! O consentimento é dado **apenas uma vez** por usuário e conjunto de escopos.

### P: A mensagem de erro no navegador é problema?
**R:** Não! É completamente normal. O DocuSign redireciona para uma URL de exemplo.

### P: Como sei se o consentimento funcionou?
**R:** Execute `npm run test-jwt`. Se não der erro de `consent_required`, funcionou.

### P: E se eu mudar de usuário?
**R:** Precisará dar consentimento novamente para o novo usuário.

### P: E se eu adicionar novos escopos?
**R:** Precisará dar consentimento novamente para os novos escopos.

### P: Posso automatizar este processo?
**R:** Não. O consentimento deve ser dado manualmente pelo usuário por razões de segurança.

## 🚨 Problemas Comuns

### Erro "consent_required"
```bash
npm run setup-consent
# Siga as instruções
npm run test-jwt
```

### Erro "invalid_client"
- Verifique `DOCUSIGN_INTEGRATION_KEY`
- Verifique se a aplicação está configurada corretamente no Developer Portal

### Erro "unauthorized_client"
- Verifique se a chave pública RSA está configurada
- Verifique se o JWT está sendo assinado corretamente

### Aplicação não encontrada
- Verifique se você está no ambiente correto (demo vs produção)
- Verifique a Integration Key

## 📞 Suporte

Se continuar com problemas:
1. Verifique a [documentação oficial](https://developers.docusign.com/platform/auth/jwt-get-token/)
2. Execute `npm run setup-consent help`
3. Verifique suas configurações com `npm run test-config`
4. Execute diagnóstico completo com `npm run test-jwt` 