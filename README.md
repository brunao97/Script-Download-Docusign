# DocuSign Document Downloader

Um script em JavaScript para baixar automaticamente contratos e certificados do DocuSign, com suporte completo para autenticação JWT, renovação automática de tokens e controle de rate limiting.

## 🚀 Funcionalidades

- ✅ **Autenticação JWT** com renovação automática de tokens a cada hora
- 📄 **Download de documentos** e contratos
- 🏆 **Download de certificados** em português brasileiro (pt_BR)
- ⚡ **Rate limiting inteligente** respeitando os limites da API (300 req/min)
- 📊 **Relatórios detalhados** de downloads
- 🔄 **Downloads paralelos** controlados
- 📁 **Organização automática** de arquivos por envelope
- 🛡️ **Tratamento robusto de erros**

## 📋 Pré-requisitos

- Node.js 14+ instalado
- Conta DocuSign com API habilitada
- Chave privada RSA para autenticação JWT
- Integration Key configurada no DocuSign

## 🔧 Instalação

1. **Clone ou baixe o projeto:**
   ```bash
   git clone <url-do-repositorio>
   cd docusign-downloader
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   # Copie o arquivo de exemplo
   cp config.env.example .env
   
   # Edite o arquivo .env com suas configurações
   ```

4. **Adicione sua chave privada RSA:**
   - Coloque o arquivo `private.key` na raiz do projeto
   - Ou configure o caminho no arquivo `.env`

## ⚙️ Configuração

### Arquivo `.env`

```bash
# Configurações do DocuSign (OBRIGATÓRIAS)
DOCUSIGN_INTEGRATION_KEY=sua_integration_key_aqui
DOCUSIGN_USER_ID=seu_user_id_aqui
DOCUSIGN_ACCOUNT_ID=seu_account_id_aqui
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_RSA_PRIVATE_KEY_PATH=./private.key

# Configurações de download (OPCIONAIS)
DOWNLOAD_FOLDER=./downloads
MAX_CONCURRENT_DOWNLOADS=5
LANGUAGE=pt_BR

# Configurações de rate limiting (OPCIONAIS)
RATE_LIMIT_REQUESTS_PER_MINUTE=300
RATE_LIMIT_DELAY_MS=200
```

### Como obter as credenciais do DocuSign:

1. **Integration Key:**
   - Acesse o [DocuSign Developer Portal](https://developers.docusign.com/)
   - Crie uma nova aplicação
   - Copie a Integration Key gerada

2. **User ID:**
   - No DocuSign Admin, vá em "Users"
   - Encontre seu usuário e copie o GUID

3. **Account ID:**
   - Pode ser encontrado na URL do DocuSign ou via API

4. **Chave Privada RSA:**
   - Gere um par de chaves RSA
   - Configure a chave pública no DocuSign
   - Salve a chave privada como `private.key`

## 🎯 Como Usar

### Configuração Inicial (OBRIGATÓRIA)

**IMPORTANTE:** Antes da primeira execução, você deve configurar o consentimento da aplicação:

```bash
# 1. Configure o consentimento da aplicação
npm run setup-consent

# 2. Teste a autenticação JWT
npm run test-jwt
```

📖 **Leia:** [CONSENT_SETUP.md](CONSENT_SETUP.md) para instruções detalhadas do processo de consentimento.

### Execução Básica

```bash
npm start
```

### Exemplos de Uso

#### 1. Baixar envelopes dos últimos 7 dias
```javascript
await manager.downloadEnvelopesByCriteria({
    fromDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    status: 'completed'
});
```

#### 2. Baixar envelopes específicos por ID
```javascript
const envelopeIds = ['envelope-id-1', 'envelope-id-2'];
await manager.downloadSpecificEnvelopes(envelopeIds);
```

#### 3. Baixar envelopes de um período específico
```javascript
await manager.downloadEnvelopesByCriteria({
    fromDate: '2024-01-01',
    toDate: '2024-01-31',
    status: 'completed'
});
```

#### 4. Apenas listar envelopes (sem baixar)
```javascript
await manager.listEnvelopes({
    fromDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    status: 'completed'
});
```

## 📁 Estrutura dos Arquivos Baixados

```
downloads/
├── envelope-id-1_Contrato_Exemplo/
│   ├── envelope_info.json
│   ├── Contrato_Principal.pdf
│   ├── Anexo_1.pdf
│   └── Certificado_envelope-id-1_pt_BR.pdf
├── envelope-id-2_Outro_Contrato/
│   ├── envelope_info.json
│   ├── Documento.pdf
│   └── Certificado_envelope-id-2_pt_BR.pdf
└── relatorio_downloads.json
```

## 📊 Relatórios

O script gera relatórios automaticamente:

```json
{
  "resumo": {
    "totalEnvelopes": 10,
    "totalDocumentos": 25,
    "totalCertificados": 10,
    "totalBytes": 52428800,
    "totalMB": 50.0,
    "erros": 0,
    "duracaoTotal": "5 minutos",
    "inicioEm": "15/12/2024 14:30:00",
    "finalEm": "15/12/2024 14:35:00"
  }
}
```

## 🛡️ Limitações e Rate Limiting

O script respeita automaticamente as limitações da API DocuSign:

- **300 requisições por minuto** (configurável)
- **Delay entre requisições** (200ms por padrão)
- **Renovação automática de tokens** (a cada 55 minutos)
- **Limite de downloads paralelos** (5 por padrão)

### Limites da API DocuSign:
- Tamanho máximo de documento: 25MB
- Documentos combinados: até 100MB
- Rate limit: 1000 req/hora para contas gratuitas, mais para pagas

## 🛠️ Comandos Úteis

### Configuração e Teste
```bash
npm run setup-consent     # Configurar consentimento da aplicação (OBRIGATÓRIO)
npm run test-jwt          # Testar autenticação JWT
npm run test-config       # Verificar variáveis de ambiente
npm run unlock-go-live    # Fazer 11 chamadas na API para liberar Go Live
```

### Chaves RSA
```bash
npm run generate-key      # Gerar chaves RSA automaticamente
npm run check-key         # Verificar chave RSA existente
```

### Execução
```bash
npm start                 # Executar script principal
npm run examples          # Executar exemplos de uso
```

## 🔧 Personalização

### Modificar critérios de busca:
```javascript
const criteria = {
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    status: 'completed', // 'sent', 'delivered', 'completed', etc.
    count: 100,
    startPosition: 0
};
```

### Ajustar configurações de download:
```javascript
const downloadConfig = {
    downloadFolder: './meus_downloads',
    maxConcurrentDownloads: 3,
    language: 'pt_BR'
};
```

## 🐛 Solução de Problemas

### Erro de autenticação:
```bash
❌ Erro ao obter token de acesso: invalid_grant
```
**Solução:** Verifique se a chave privada RSA está correta e se o usuário tem permissões adequadas.

### Rate limit atingido:
```bash
⏳ Rate limit atingido (300/300). Aguardando...
```
**Solução:** O script aguarda automaticamente. Ajuste `RATE_LIMIT_REQUESTS_PER_MINUTE` se necessário.

### Arquivo não encontrado:
```bash
❌ Chave privada RSA não encontrada
```
**Solução:** Verifique o caminho do arquivo `private.key` na variável `DOCUSIGN_RSA_PRIVATE_KEY_PATH`.

## 📝 Logs do Sistema

O script fornece logs detalhados:
- ✅ Operações bem-sucedidas
- ❌ Erros com detalhes
- 📊 Estatísticas de rate limiting
- 🕒 Informações de timing
- 📄 Progresso dos downloads

## 🔒 Segurança

- **Nunca compartilhe** sua chave privada RSA
- **Use HTTPS** sempre (configuração padrão)
- **Mantenha o `.env`** fora do controle de versão
- **Revogue tokens** antigos quando necessário

## 📚 Documentação da API

- [DocuSign eSignature REST API](https://developers.docusign.com/docs/esign-rest-api/)
- [JWT Authentication](https://developers.docusign.com/platform/auth/jwt-get-token/)
- [Rate Limits](https://developers.docusign.com/docs/esign-rest-api/esign101/rules-and-limits/)

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Faça um push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Se encontrar problemas:

1. Verifique a documentação oficial do DocuSign
2. Consulte os logs de erro detalhados
3. Abra uma issue no repositório
4. Entre em contato com o suporte do DocuSign se necessário

---

**Desenvolvido com ❤️ para facilitar o download de documentos DocuSign em português brasileiro.** 