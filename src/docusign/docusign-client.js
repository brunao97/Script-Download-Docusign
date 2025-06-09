const axios = require('axios');
const moment = require('moment');

class DocuSignClient {
    constructor(auth, rateLimiter) {
        this.auth = auth;
        this.rateLimiter = rateLimiter;
        this.basePath = auth.basePath;
        this.accountId = auth.accountId;
    }

    /**
     * Cria um cliente axios com configurações padrão
     */
    async createAxiosClient() {
        const token = await this.auth.ensureValidToken();
        
        return axios.create({
            baseURL: `${this.basePath}/v2.1/accounts/${this.accountId}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }

    /**
     * Lista envelopes da conta
     */
    async getEnvelopes(options = {}) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            const params = {
                from_date: options.fromDate || moment().subtract(30, 'days').format('YYYY-MM-DD'),
                to_date: options.toDate || moment().format('YYYY-MM-DD'),
                status: options.status || 'completed',
                count: options.count || 100,
                start_position: options.startPosition || 0
            };

            console.log(`📋 Buscando envelopes...`);
            const response = await client.get('/envelopes', { params });
            
            console.log(`✅ ${response.data.envelopes?.length || 0} envelopes encontrados`);
            return response.data;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }

    /**
     * Obtém detalhes de um envelope específico
     */
    async getEnvelopeDetails(envelopeId) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            console.log(`📄 Obtendo detalhes do envelope: ${envelopeId}`);
            const response = await client.get(`/envelopes/${envelopeId}`);
            
            return response.data;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }

    /**
     * Lista documentos de um envelope
     */
    async getEnvelopeDocuments(envelopeId) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            console.log(`📑 Listando documentos do envelope: ${envelopeId}`);
            const response = await client.get(`/envelopes/${envelopeId}/documents`);
            
            console.log(`✅ ${response.data.envelopeDocuments?.length || 0} documentos encontrados`);
            return response.data.envelopeDocuments;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }

    /**
     * Baixa um documento específico
     */
    async downloadDocument(envelopeId, documentId, options = {}) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            const params = {
                certificate: options.certificate || false,
                language: options.language || 'pt_BR',
                pdf_meta_data: options.pdfMetaData || false,
                recipient_information: options.recipientInformation || false,
                shared_user_id: options.sharedUserId || undefined
            };

            // Remove parâmetros undefined
            Object.keys(params).forEach(key => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            console.log(`⬇️ Baixando documento ${documentId} do envelope ${envelopeId}...`);
            
            const response = await client.get(
                `/envelopes/${envelopeId}/documents/${documentId}`,
                { 
                    params,
                    responseType: 'arraybuffer'
                }
            );

            console.log(`✅ Documento baixado com sucesso (${response.data.byteLength} bytes)`);
            return response.data;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }

    /**
     * Baixa o certificado de um envelope em pt_BR
     */
    async downloadCertificate(envelopeId, options = {}) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            const params = {
                certificate: true,
                language: options.language || 'pt_BR'
            };

            console.log(`🏆 Baixando certificado do envelope ${envelopeId} em ${params.language}...`);
            
            const response = await client.get(
                `/envelopes/${envelopeId}/documents/certificate`,
                { 
                    params,
                    responseType: 'arraybuffer'
                }
            );

            console.log(`✅ Certificado baixado com sucesso (${response.data.byteLength} bytes)`);
            return response.data;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }

    /**
     * Baixa todos os documentos de um envelope combinados
     */
    async downloadCombinedDocuments(envelopeId, options = {}) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            const params = {
                certificate: options.certificate || true,
                language: options.language || 'pt_BR',
                pdf_meta_data: options.pdfMetaData || false
            };

            console.log(`📦 Baixando todos os documentos combinados do envelope ${envelopeId}...`);
            
            const response = await client.get(
                `/envelopes/${envelopeId}/documents/combined`,
                { 
                    params,
                    responseType: 'arraybuffer'
                }
            );

            console.log(`✅ Documentos combinados baixados com sucesso (${response.data.byteLength} bytes)`);
            return response.data;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }

    /**
     * Obtém informações dos signatários de um envelope
     */
    async getEnvelopeRecipients(envelopeId) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            console.log(`👥 Obtendo signatários do envelope: ${envelopeId}`);
            const response = await client.get(`/envelopes/${envelopeId}/recipients`);
            
            return response.data;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }

    /**
     * Verifica o status de um envelope
     */
    async getEnvelopeStatus(envelopeId) {
        const requestFn = async () => {
            const client = await this.createAxiosClient();
            
            const response = await client.get(`/envelopes/${envelopeId}`);
            return response.data.status;
        };

        return await this.rateLimiter.addRequest(requestFn);
    }
}

module.exports = DocuSignClient; 