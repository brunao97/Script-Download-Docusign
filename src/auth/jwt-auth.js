const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs-extra');
const moment = require('moment');

class DocuSignJWTAuth {
    constructor(config) {
        this.integrationKey = config.integrationKey;
        this.userId = config.userId;
        this.basePath = config.basePath;
        this.privateKeyPath = config.privateKeyPath;
        this.accountId = config.accountId;
        
        this.accessToken = null;
        this.tokenExpiry = null;
        this.privateKey = null;
        this.privateKeyLoaded = false;
    }

    /**
     * Carrega a chave privada RSA do arquivo
     */
    async loadPrivateKey() {
        try {
            console.log(`🔍 Tentando carregar chave privada de: ${this.privateKeyPath}`);
            
            // Verifica se o arquivo existe
            const exists = await fs.pathExists(this.privateKeyPath);
            if (!exists) {
                throw new Error(`Arquivo não encontrado: ${this.privateKeyPath}`);
            }
            
            // Carrega o conteúdo do arquivo
            this.privateKey = await fs.readFile(this.privateKeyPath, 'utf8');
            
            // Verifica se o conteúdo não está vazio
            if (!this.privateKey || this.privateKey.trim().length === 0) {
                throw new Error('Arquivo de chave privada está vazio');
            }
            
            // Verifica se parece com uma chave RSA válida
            if (!this.privateKey.includes('BEGIN') || !this.privateKey.includes('PRIVATE KEY')) {
                throw new Error('Arquivo não parece conter uma chave privada RSA válida');
            }
            
            console.log('✅ Chave privada RSA carregada com sucesso');
            console.log(`📏 Tamanho da chave: ${this.privateKey.length} caracteres`);
            this.privateKeyLoaded = true;
            
        } catch (error) {
            console.error('❌ Erro ao carregar chave privada RSA:', error.message);
            console.error('💡 Dicas para resolver:');
            console.error('   1. Verifique se o arquivo existe no caminho especificado');
            console.error('   2. Certifique-se de que o arquivo contém uma chave RSA válida');
            console.error('   3. Verifique as permissões do arquivo');
            console.error(`   4. Caminho atual: ${this.privateKeyPath}`);
            throw error;
        }
    }

    /**
     * Gera um JWT token para autenticação
     * Seguindo a documentação oficial: https://developers.docusign.com/platform/auth/jwt-get-token/
     */
    async generateJWT() {
        // Garante que a chave privada foi carregada
        if (!this.privateKeyLoaded) {
            await this.loadPrivateKey();
        }
        
        const now = moment().unix();
        const payload = {
            iss: this.integrationKey,
            sub: this.userId,
            aud: 'account-d.docusign.com', // Para demo environment
            iat: now,
            exp: now + 3600, // Token válido por 1 hora (máximo permitido)
            scope: 'signature impersonation'
        };

        // Para ambiente de produção, usar 'account.docusign.com'
        if (this.basePath.includes('docusign.net') && !this.basePath.includes('demo')) {
            payload.aud = 'account.docusign.com';
        }

        console.log(`🔐 Gerando JWT para ambiente: ${payload.aud}`);
        return jwt.sign(payload, this.privateKey, { algorithm: 'RS256' });
    }

    /**
     * Obtém um access token usando JWT
     * Conforme documentação: https://developers.docusign.com/platform/auth/jwt-get-token/
     */
    async getAccessToken() {
        try {
            const jwtToken = await this.generateJWT();
            
            // Determinar URL do token baseado no ambiente
            let tokenUrl = 'https://account-d.docusign.com/oauth/token'; // Demo
            if (this.basePath.includes('docusign.net') && !this.basePath.includes('demo')) {
                tokenUrl = 'https://account.docusign.com/oauth/token'; // Produção
            }
            
            console.log(`🌐 Solicitando token de: ${tokenUrl}`);
            
            const requestBody = new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwtToken
            }).toString();
            
            const response = await axios.post(tokenUrl, requestBody, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            this.accessToken = response.data.access_token;
            
            // O token expira em 1 hora, mas renovamos 5 minutos antes
            const expiresIn = response.data.expires_in || 3600;
            this.tokenExpiry = moment().add(expiresIn - 300, 'seconds'); // 5 minutos antes
            
            console.log('✅ Token de acesso obtido com sucesso');
            console.log(`🕒 Token expira em: ${this.tokenExpiry.format('DD/MM/YYYY HH:mm:ss')}`);
            console.log(`⏱️  Expires in: ${expiresIn} segundos`);
            
            return this.accessToken;
        } catch (error) {
            console.error('❌ Erro ao obter token de acesso:', error.response?.data || error.message);
            
            if (error.response?.status === 400) {
                console.error('💡 Possíveis causas:');
                console.error('   - Integration Key incorreta');
                console.error('   - User ID incorreto');
                console.error('   - Chave privada RSA não corresponde à chave pública no DocuSign');
                console.error('   - Usuário não tem permissão de impersonation');
                console.error('   - Aplicação não está configurada para JWT');
            }
            
            throw error;
        }
    }

    /**
     * Verifica se o token atual é válido e o renova se necessário
     */
    async ensureValidToken() {
        if (!this.accessToken || !this.tokenExpiry || moment().isAfter(this.tokenExpiry)) {
            console.log('🔄 Renovando token de acesso...');
            await this.getAccessToken();
        }
        return this.accessToken;
    }

    /**
     * Obtém informações da conta do usuário
     * Conforme documentação: https://developers.docusign.com/platform/auth/jwt-get-token/
     */
    async getUserInfo() {
        const token = await this.ensureValidToken();
        
        try {
            // Determinar URL do userinfo baseado no ambiente
            let userInfoUrl = 'https://account-d.docusign.com/oauth/userinfo'; // Demo
            if (this.basePath.includes('docusign.net') && !this.basePath.includes('demo')) {
                userInfoUrl = 'https://account.docusign.com/oauth/userinfo'; // Produção
            }
            
            console.log(`👤 Obtendo informações do usuário de: ${userInfoUrl}`);
            
            const response = await axios.get(userInfoUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            console.log('✅ Informações do usuário obtidas:', response.data.name);
            console.log(`📧 Email: ${response.data.email}`);
            console.log(`🏢 Contas disponíveis: ${response.data.accounts?.length || 0}`);
            
            // Validar se o account_id está correto
            if (response.data.accounts) {
                const accountFound = response.data.accounts.find(acc => acc.account_id === this.accountId);
                if (accountFound) {
                    console.log(`✅ Account ID validado: ${accountFound.account_name}`);
                } else {
                    console.warn(`⚠️  Account ID ${this.accountId} não encontrado nas contas disponíveis`);
                    console.log('📋 Contas disponíveis:');
                    response.data.accounts.forEach(acc => {
                        console.log(`   - ${acc.account_id}: ${acc.account_name} (${acc.base_uri})`);
                    });
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao obter informações do usuário:', error.response?.data || error.message);
            
            if (error.response?.status === 401) {
                console.error('💡 Token inválido ou expirado. Tentando renovar...');
                this.accessToken = null;
                this.tokenExpiry = null;
            }
            
            throw error;
        }
    }
}

module.exports = DocuSignJWTAuth; 