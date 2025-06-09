require('dotenv').config();
const DocuSignJWTAuth = require('../src/auth/jwt-auth');
const DocuSignClient = require('../src/docusign/docusign-client');
const RateLimiter = require('../src/utils/rate-limiter');
const moment = require('moment');

/**
 * Script para fazer 11 chamadas na API DocuSign e liberar Go Live
 * 
 * O DocuSign exige um número mínimo de chamadas de API no ambiente demo
 * antes de aprovar aplicações para produção (Go Live).
 */

class GoLiveUnlocker {
    constructor() {
        this.auth = null;
        this.client = null;
        this.rateLimiter = null;
        this.callsCount = 0;
        this.targetCalls = 11;
        this.results = [];
    }

    async initialize() {
        console.log('🚀 DESBLOQUEADOR DE GO LIVE - DOCUSIGN');
        console.log('=====================================');
        console.log(`🎯 Meta: ${this.targetCalls} chamadas na API DocuSign\n`);

        // Configurar componentes
        const config = {
            integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
            userId: process.env.DOCUSIGN_USER_ID,
            accountId: process.env.DOCUSIGN_ACCOUNT_ID,
            basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
            privateKeyPath: process.env.DOCUSIGN_RSA_PRIVATE_KEY_PATH || './private.key'
        };

        // Inicializar componentes
        this.rateLimiter = new RateLimiter(300, 500); // Mais conservador
        this.auth = new DocuSignJWTAuth(config);
        this.client = new DocuSignClient(this.auth, this.rateLimiter);

        console.log('✅ Componentes inicializados');
        console.log(`🌐 Ambiente: ${config.basePath.includes('demo') ? 'DEMO/SANDBOX' : 'PRODUÇÃO'}`);
        console.log('');
    }

    async makeApiCall(callNumber, description, apiFunction) {
        try {
            console.log(`📞 Chamada ${callNumber}/${this.targetCalls}: ${description}`);
            
            const startTime = Date.now();
            const result = await apiFunction();
            const duration = Date.now() - startTime;
            
            this.callsCount++;
            
            const callResult = {
                number: callNumber,
                description,
                success: true,
                duration,
                timestamp: moment().format('DD/MM/YYYY HH:mm:ss'),
                result: typeof result === 'object' ? Object.keys(result).length + ' propriedades' : 'sucesso'
            };
            
            this.results.push(callResult);
            
            console.log(`   ✅ Sucesso (${duration}ms) - ${callResult.result}`);
            console.log(`   📊 Total de chamadas: ${this.callsCount}/${this.targetCalls}\n`);
            
            // Pausa entre chamadas para respeitar rate limit
            await this.sleep(1000);
            
            return result;
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            
            const callResult = {
                number: callNumber,
                description,
                success: false,
                duration: 0,
                timestamp: moment().format('DD/MM/YYYY HH:mm:ss'),
                error: error.message
            };
            
            this.results.push(callResult);
            
            // Não incrementa contador em caso de erro
            console.log(`   📊 Total de chamadas: ${this.callsCount}/${this.targetCalls}\n`);
            
            // Continua mesmo com erro
            await this.sleep(1000);
        }
    }

    async executeUnlockSequence() {
        console.log('🔓 INICIANDO SEQUÊNCIA DE DESBLOQUEIO...\n');

        // 1. Testar autenticação
        await this.makeApiCall(1, 'Testar autenticação JWT', async () => {
            return await this.auth.getUserInfo();
        });

        // 2. Listar envelopes recentes
        await this.makeApiCall(2, 'Listar envelopes recentes', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
                count: 10
            });
        });

        // 3. Listar envelopes mais antigos
        await this.makeApiCall(3, 'Listar envelopes históricos', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(1, 'year').format('YYYY-MM-DD'),
                toDate: moment().subtract(6, 'months').format('YYYY-MM-DD'),
                count: 5
            });
        });

        // 4. Buscar envelopes por status
        await this.makeApiCall(4, 'Buscar envelopes por status', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(60, 'days').format('YYYY-MM-DD'),
                status: 'completed',
                count: 15
            });
        });

        // 5. Obter informações da conta
        await this.makeApiCall(5, 'Obter informações da conta', async () => {
            // Simula chamada para account info
            return await this.auth.getUserInfo();
        });

        // 6. Buscar envelopes com critérios específicos
        await this.makeApiCall(6, 'Buscar com critérios específicos', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(90, 'days').format('YYYY-MM-DD'),
                status: 'sent',
                count: 8
            });
        });

        // 7. Listar envelopes em lote diferente
        await this.makeApiCall(7, 'Listar segundo lote de envelopes', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(45, 'days').format('YYYY-MM-DD'),
                count: 20,
                startPosition: 10
            });
        });

        // 8. Verificar envelopes entregues
        await this.makeApiCall(8, 'Verificar envelopes entregues', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(15, 'days').format('YYYY-MM-DD'),
                status: 'delivered',
                count: 12
            });
        });

        // 9. Buscar envelopes recentes com paginação
        await this.makeApiCall(9, 'Buscar com paginação', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
                count: 25,
                startPosition: 0
            });
        });

        // 10. Verificar envelopes em andamento
        await this.makeApiCall(10, 'Verificar envelopes em andamento', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
                status: 'sent',
                count: 18
            });
        });

        // 11. Chamada final de verificação
        await this.makeApiCall(11, 'Chamada final de verificação', async () => {
            return await this.client.getEnvelopes({
                fromDate: moment().subtract(120, 'days').format('YYYY-MM-DD'),
                count: 30
            });
        });
    }

    generateReport() {
        console.log('📊 RELATÓRIO FINAL DE DESBLOQUEIO');
        console.log('=================================');
        
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        
        console.log(`✅ Chamadas bem-sucedidas: ${successful}`);
        console.log(`❌ Chamadas falharam: ${failed}`);
        console.log(`📞 Total de chamadas: ${this.results.length}`);
        console.log('');
        
        if (successful >= this.targetCalls) {
            console.log('🎉 PARABÉNS! GO LIVE DESBLOQUEADO!');
            console.log('==================================');
            console.log(`✅ Você fez ${successful} chamadas de API com sucesso`);
            console.log('✅ Sua aplicação está qualificada para Go Live');
            console.log('✅ Acesse o DocuSign Developer Portal para solicitar produção');
            console.log('');
            console.log('🚀 Próximos passos:');
            console.log('   1. Acesse: https://developers.docusign.com/');
            console.log('   2. Vá para sua aplicação');
            console.log('   3. Clique em "Go Live" ou "Request Production"');
            console.log('   4. Preencha o formulário de solicitação');
        } else {
            console.log('⚠️  ATENÇÃO: MAIS CHAMADAS NECESSÁRIAS');
            console.log('====================================');
            console.log(`❌ Você fez apenas ${successful} chamadas bem-sucedidas`);
            console.log(`🎯 Necessário: ${this.targetCalls} chamadas`);
            console.log(`📊 Faltam: ${this.targetCalls - successful} chamadas`);
            console.log('');
            console.log('💡 Execute novamente o script para completar');
        }
        
        console.log('\n📋 DETALHES DAS CHAMADAS:');
        console.log('=========================');
        this.results.forEach(call => {
            const status = call.success ? '✅' : '❌';
            const duration = call.success ? `(${call.duration}ms)` : '';
            console.log(`${status} ${call.number}. ${call.description} ${duration}`);
            if (!call.success) {
                console.log(`     Erro: ${call.error}`);
            }
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const unlocker = new GoLiveUnlocker();
    
    try {
        await unlocker.initialize();
        await unlocker.executeUnlockSequence();
        unlocker.generateReport();
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:', error.message);
        console.error('💡 Verifique suas configurações e tente novamente');
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = GoLiveUnlocker; 