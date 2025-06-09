require('dotenv').config();
const DocuSignJWTAuth = require('./src/auth/jwt-auth');
const DocuSignClient = require('./src/docusign/docusign-client');
const DocumentDownloader = require('./src/downloader/document-downloader');
const RateLimiter = require('./src/utils/rate-limiter');
const moment = require('moment');

// Configurações principais
const config = {
    // Configurações do DocuSign
    docusign: {
        integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
        userId: process.env.DOCUSIGN_USER_ID,
        accountId: process.env.DOCUSIGN_ACCOUNT_ID,
        basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
        privateKeyPath: process.env.DOCUSIGN_RSA_PRIVATE_KEY_PATH || './private.key'
    },

    // Configurações de download
    download: {
        downloadFolder: process.env.DOWNLOAD_FOLDER || './downloads',
        maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS) || 5,
        language: process.env.LANGUAGE || 'pt_BR'
    },

    // Configurações de rate limiting
    rateLimiting: {
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 300,
        delayMs: parseInt(process.env.RATE_LIMIT_DELAY_MS) || 200
    }
};

class DocuSignDownloadManager {
    constructor() {
        this.auth = null;
        this.client = null;
        this.downloader = null;
        this.rateLimiter = null;
    }

    /**
     * Inicializa todos os componentes
     */
    async initialize() {
        try {
            console.log('🚀 INICIANDO DOCUSIGN DOCUMENT DOWNLOADER');
            console.log('==========================================');
            
            // Validar configurações obrigatórias
            this.validateConfig();

            // Inicializar Rate Limiter
            this.rateLimiter = new RateLimiter(
                config.rateLimiting.requestsPerMinute,
                config.rateLimiting.delayMs
            );
            console.log(`⚡ Rate Limiter configurado: ${config.rateLimiting.requestsPerMinute} req/min`);

            // Inicializar autenticação
            this.auth = new DocuSignJWTAuth(config.docusign);
            await this.auth.getUserInfo(); // Testa a autenticação
            
            // Inicializar cliente DocuSign
            this.client = new DocuSignClient(this.auth, this.rateLimiter);
            console.log('✅ Cliente DocuSign inicializado');

            // Inicializar downloader
            this.downloader = new DocumentDownloader(this.client, config.download);
            await this.downloader.initialize();

            console.log('✅ Todos os componentes inicializados com sucesso!\n');

        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            throw error;
        }
    }

    /**
     * Valida se todas as configurações obrigatórias estão definidas
     */
    validateConfig() {
        console.log('🔍 Verificando configurações...');
        
        const required = [
            'DOCUSIGN_INTEGRATION_KEY',
            'DOCUSIGN_USER_ID', 
            'DOCUSIGN_ACCOUNT_ID'
        ];

        const missing = required.filter(key => !process.env[key] || process.env[key].trim() === '');
        
        if (missing.length > 0) {
            console.error('❌ Variáveis de ambiente obrigatórias não definidas ou vazias:');
            missing.forEach(key => {
                console.error(`   - ${key}`);
            });
            console.error('\n💡 Certifique-se de:');
            console.error('   1. Copiar config.env.example para .env');
            console.error('   2. Preencher todas as variáveis obrigatórias');
            console.error('   3. Reiniciar o terminal após editar o .env');
            throw new Error(`Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}`);
        }

        // Mostra as configurações carregadas (sem mostrar valores sensíveis)
        console.log('📋 Configurações carregadas:');
        console.log(`   Integration Key: ${process.env.DOCUSIGN_INTEGRATION_KEY ? '✅ Definida' : '❌ Faltando'}`);
        console.log(`   User ID: ${process.env.DOCUSIGN_USER_ID ? '✅ Definida' : '❌ Faltando'}`);
        console.log(`   Account ID: ${process.env.DOCUSIGN_ACCOUNT_ID ? '✅ Definida' : '❌ Faltando'}`);
        console.log(`   Base Path: ${config.docusign.basePath}`);
        console.log(`   Chave Privada: ${config.docusign.privateKeyPath}`);

        console.log('✅ Configurações validadas');
    }

    /**
     * Baixa documentos de envelopes específicos
     */
    async downloadSpecificEnvelopes(envelopeIds) {
        console.log(`📦 Iniciando download de ${envelopeIds.length} envelopes específicos...\n`);
        
        await this.downloader.downloadMultipleEnvelopes(envelopeIds);
        
        const report = await this.downloader.saveReport();
        return report;
    }

    /**
     * Baixa documentos baseado em critérios de busca
     */
    async downloadEnvelopesByCriteria(searchCriteria = {}) {
        const criteria = {
            fromDate: searchCriteria.fromDate || moment().subtract(30, 'days').format('YYYY-MM-DD'),
            toDate: searchCriteria.toDate || moment().format('YYYY-MM-DD'),
            status: searchCriteria.status || 'completed',
            ...searchCriteria
        };

        console.log('🔍 Critérios de busca:');
        console.log(`  📅 Data inicial: ${criteria.fromDate}`);
        console.log(`  📅 Data final: ${criteria.toDate}`);
        console.log(`  📊 Status: ${criteria.status}`);
        console.log('');

        await this.downloader.downloadEnvelopesByCriteria(criteria);
        
        const report = await this.downloader.saveReport();
        return report;
    }

    /**
     * Lista envelopes sem fazer download
     */
    async listEnvelopes(searchCriteria = {}) {
        const criteria = {
            fromDate: searchCriteria.fromDate || moment().subtract(30, 'days').format('YYYY-MM-DD'),
            toDate: searchCriteria.toDate || moment().format('YYYY-MM-DD'),
            count: searchCriteria.count || 100,
            ...searchCriteria
        };

        // Debug: mostrar critérios sendo usados
        console.log('📋 Listando envelopes...');
        console.log('🔍 DEBUG - Critérios finais sendo enviados para API:');
        console.log('   ', JSON.stringify(criteria, null, 2));
        
        try {
            const result = await this.client.getEnvelopes(criteria);
            
            // Debug: mostrar resposta raw da API
            console.log('🔍 DEBUG - Resposta da API:');
            console.log(`   📊 Total retornado: ${result.totalSetSize || 0}`);
            console.log(`   📦 Envelopes na página: ${result.envelopes?.length || 0}`);
            console.log(`   📄 Result size: ${result.resultSetSize || 0}`);
            console.log(`   🔢 Start position: ${result.startPosition || 0}`);
            
            if (result.envelopes && result.envelopes.length > 0) {
                console.log('\n📊 ENVELOPES ENCONTRADOS:');
                console.log('========================');
                
                result.envelopes.forEach((envelope, index) => {
                    console.log(`${index + 1}. ID: ${envelope.envelopeId}`);
                    console.log(`   📧 Assunto: ${envelope.emailSubject || 'Sem assunto'}`);
                    console.log(`   📊 Status: ${envelope.status}`);
                    console.log(`   📅 Criado em: ${moment(envelope.createdDateTime).format('DD/MM/YYYY HH:mm')}`);
                    console.log(`   📅 Última modificação: ${moment(envelope.statusChangedDateTime || envelope.createdDateTime).format('DD/MM/YYYY HH:mm')}`);
                    console.log('');
                });
                
                // Mostrar estatísticas por status
                const statusCounts = {};
                result.envelopes.forEach(env => {
                    statusCounts[env.status] = (statusCounts[env.status] || 0) + 1;
                });
                
                console.log('📊 Distribuição por status:');
                Object.entries(statusCounts).forEach(([status, count]) => {
                    console.log(`   ${status}: ${count} envelope(s)`);
                });
                console.log('');
                
            } else {
                console.log('❌ Nenhum envelope encontrado com os critérios especificados');
                console.log('💡 Possíveis causas:');
                console.log('   - Conta não tem envelopes');
                console.log('   - Filtros muito restritivos');
                console.log('   - Problema de permissões');
                console.log('   - Ambiente incorreto (demo vs produção)');
            }

            return result;
            
        } catch (error) {
            console.error('❌ Erro ao listar envelopes:', error.message);
            console.error('🔍 DEBUG - Erro completo:', error.response?.data || error);
            throw error;
        }
    }

    /**
     * Baixa documentos combinados de envelopes específicos
     */
    async downloadCombinedDocuments(envelopeIds) {
        console.log(`📦 Iniciando download de documentos combinados de ${envelopeIds.length} envelopes...\n`);
        
        await this.downloader.downloadCombinedDocuments(envelopeIds);
        
        const report = await this.downloader.saveReport();
        return report;
    }

    /**
     * Obtém estatísticas do rate limiter
     */
    getRateLimiterStats() {
        return this.rateLimiter.getStats();
    }
}

// Função principal para execução
async function main() {
    const manager = new DocuSignDownloadManager();
    
    try {
        await manager.initialize();

        // Buscar TODOS os envelopes da conta (sem filtros restritivos)
        console.log('🔍 Buscando TODOS os envelopes da conta...\n');
        
        // Primeiro: buscar sem filtro de status para ver tudo
        const searchCriteria = {
            fromDate: moment().subtract(10, 'years').format('YYYY-MM-DD'), // 10 anos para garantir
            toDate: moment().format('YYYY-MM-DD'),
            // Removemos o filtro de status para pegar todos
            count: 100 // Limitar para evitar muitos resultados
        };

        console.log('📋 Critérios de busca AMPLOS:');
        console.log(`  📅 Data inicial: ${searchCriteria.fromDate} (10 anos atrás)`);
        console.log(`  📅 Data final: ${searchCriteria.toDate}`);
        console.log(`  📊 Status: TODOS os status`);
        console.log(`  📊 Limite: ${searchCriteria.count} envelopes\n`);

        // 1. Primeiro listar TODOS os envelopes encontrados
        console.log('📋 Listando TODOS os envelopes encontrados...');
        const envelopesList = await manager.listEnvelopes(searchCriteria);
        
        // 2. Se não encontrar nada, tentar busca ainda mais ampla
        if (!envelopesList.envelopes || envelopesList.envelopes.length === 0) {
            console.log('\n⚠️  Nenhum envelope encontrado. Tentando busca mais ampla...');
            
            const widerCriteria = {
                fromDate: '2015-01-01', // Data bem antiga
                toDate: moment().add(1, 'year').format('YYYY-MM-DD'), // Data futura
                count: 200
            };
            
            console.log('📋 Tentando critérios ULTRA AMPLOS:');
            console.log(`  📅 Data inicial: ${widerCriteria.fromDate}`);
            console.log(`  📅 Data final: ${widerCriteria.toDate}`);
            console.log(`  📊 Limite: ${widerCriteria.count} envelopes\n`);
            
            const widerList = await manager.listEnvelopes(widerCriteria);
            
            if (widerList.envelopes && widerList.envelopes.length > 0) {
                console.log(`✅ Encontrados ${widerList.envelopes.length} envelopes com busca ampla!`);
                Object.assign(envelopesList, widerList);
            }
        }
        
        if (envelopesList.envelopes && envelopesList.envelopes.length > 0) {
            console.log(`\n✅ Encontrados ${envelopesList.envelopes.length} envelopes!`);
            
            // 2. Filtrar apenas envelopes "completed" para download
            const completedEnvelopes = envelopesList.envelopes.filter(env => 
                env.status && env.status.toLowerCase() === 'completed'
            );
            
            console.log(`📊 Envelopes por status:`);
            const statusGroups = {};
            envelopesList.envelopes.forEach(env => {
                statusGroups[env.status] = (statusGroups[env.status] || 0) + 1;
            });
            Object.entries(statusGroups).forEach(([status, count]) => {
                console.log(`   ${status}: ${count} envelope(s)`);
            });
            
            if (completedEnvelopes.length > 0) {
                console.log(`\n✅ ${completedEnvelopes.length} envelopes "completed" encontrados para download!`);
                
                // 3. Extrair IDs dos envelopes completed
                const envelopeIds = completedEnvelopes.map(env => env.envelopeId);
                console.log('📦 IDs dos envelopes completed:', envelopeIds.slice(0, 5), envelopeIds.length > 5 ? `... e mais ${envelopeIds.length - 5}` : '');
                
                // 4. Baixar documentos combinados
                console.log('\n🚀 Iniciando download de documentos combinados...');
                await manager.downloadCombinedDocuments(envelopeIds);
            } else {
                console.log('\n⚠️  Nenhum envelope com status "completed" encontrado para download');
                console.log('💡 Os envelopes encontrados não estão finalizados ainda');
                console.log('🔄 Aguarde a conclusão dos envelopes ou verifique status manualmente');
            }
        } else {
            console.log('❌ Nenhum envelope encontrado');
            console.log('💡 Possíveis soluções:');
            console.log('   1. Verifique se está no ambiente correto (demo vs produção)');
            console.log('   2. Confirme se a conta tem envelopes');
            console.log('   3. Execute: npm run test-jwt para verificar autenticação');
            console.log('   4. Tente executar: npm run unlock-go-live para testar a API');
        }
        console.clear();

        console.log('🎉 Script executado com sucesso!');

    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Executa o script se for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DocuSignDownloadManager, config }; 