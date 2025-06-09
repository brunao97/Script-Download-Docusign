const { DocuSignDownloadManager } = require('../index');
const moment = require('moment');

// Exemplos práticos de uso do DocuSign Document Downloader

async function exemploBasico() {
    console.log('🎯 EXEMPLO 1: Uso básico - Baixar envelopes dos últimos 7 dias');
    console.log('='.repeat(60));
    
    const manager = new DocuSignDownloadManager();
    
    try {
        await manager.initialize();
        
        // Baixa envelopes dos últimos 7 dias
        await manager.downloadEnvelopesByCriteria({
            fromDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
            status: 'completed'
        });
        
        console.log('✅ Exemplo 1 concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no exemplo 1:', error.message);
    }
}

async function exemploEnvelopesEspecificos() {
    console.log('\n🎯 EXEMPLO 2: Download de envelopes específicos');
    console.log('='.repeat(60));
    
    const manager = new DocuSignDownloadManager();
    
    try {
        await manager.initialize();
        
        // Lista de IDs de envelopes específicos para baixar
        const envelopeIds = [
            'envelope-id-exemplo-1',
            'envelope-id-exemplo-2',
            'envelope-id-exemplo-3'
        ];
        
        console.log(`📦 Baixando ${envelopeIds.length} envelopes específicos...`);
        await manager.downloadSpecificEnvelopes(envelopeIds);
        
        console.log('✅ Exemplo 2 concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no exemplo 2:', error.message);
    }
}

async function exemploListarSemBaixar() {
    console.log('\n🎯 EXEMPLO 3: Listar envelopes sem fazer download');
    console.log('='.repeat(60));
    
    const manager = new DocuSignDownloadManager();
    
    try {
        await manager.initialize();
        
        // Lista envelopes dos últimos 30 dias sem baixar
        const result = await manager.listEnvelopes({
            fromDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
            status: 'completed',
            count: 50
        });
        
        console.log(`📊 Total de envelopes encontrados: ${result.envelopes?.length || 0}`);
        console.log('✅ Exemplo 3 concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no exemplo 3:', error.message);
    }
}

async function exemploPeriodoEspecifico() {
    console.log('\n🎯 EXEMPLO 4: Download por período específico');
    console.log('='.repeat(60));
    
    const manager = new DocuSignDownloadManager();
    
    try {
        await manager.initialize();
        
        // Baixa envelopes de janeiro de 2024
        await manager.downloadEnvelopesByCriteria({
            fromDate: '2024-01-01',
            toDate: '2024-01-31',
            status: 'completed'
        });
        
        console.log('✅ Exemplo 4 concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no exemplo 4:', error.message);
    }
}

async function exemploTodosOsStatus() {
    console.log('\n🎯 EXEMPLO 5: Download com diferentes status');
    console.log('='.repeat(60));
    
    const manager = new DocuSignDownloadManager();
    
    try {
        await manager.initialize();
        
        // Baixa envelopes com diferentes status
        const statuses = ['completed', 'sent', 'delivered'];
        
        for (const status of statuses) {
            console.log(`📋 Processando envelopes com status: ${status}`);
            
            await manager.downloadEnvelopesByCriteria({
                fromDate: moment().subtract(15, 'days').format('YYYY-MM-DD'),
                status: status,
                count: 20
            });
        }
        
        console.log('✅ Exemplo 5 concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no exemplo 5:', error.message);
    }
}

async function exemploMonitoramento() {
    console.log('\n🎯 EXEMPLO 6: Monitoramento de rate limiting');
    console.log('='.repeat(60));
    
    const manager = new DocuSignDownloadManager();
    
    try {
        await manager.initialize();
        
        // Monitora estatísticas durante o processo
        const interval = setInterval(() => {
            const stats = manager.getRateLimiterStats();
            console.log(`📊 Rate Limiter: ${stats.requestsInLastMinute}/${stats.maxRequestsPerMinute} req/min | Fila: ${stats.queueLength}`);
        }, 5000);
        
        // Executa download
        await manager.downloadEnvelopesByCriteria({
            fromDate: moment().subtract(3, 'days').format('YYYY-MM-DD'),
            status: 'completed'
        });
        
        clearInterval(interval);
        console.log('✅ Exemplo 6 concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no exemplo 6:', error.message);
    }
}

// Função para executar um exemplo específico
async function executarExemplo(numeroExemplo) {
    switch (numeroExemplo) {
        case 1:
            await exemploBasico();
            break;
        case 2:
            await exemploEnvelopesEspecificos();
            break;
        case 3:
            await exemploListarSemBaixar();
            break;
        case 4:
            await exemploPeriodoEspecifico();
            break;
        case 5:
            await exemploTodosOsStatus();
            break;
        case 6:
            await exemploMonitoramento();
            break;
        default:
            console.log('❌ Número de exemplo inválido. Use 1-6.');
    }
}

// Função para executar todos os exemplos
async function executarTodosOsExemplos() {
    console.log('🚀 EXECUTANDO TODOS OS EXEMPLOS');
    console.log('='.repeat(60));
    
    for (let i = 1; i <= 6; i++) {
        await executarExemplo(i);
        
        // Pausa entre exemplos
        if (i < 6) {
            console.log('\n⏸️  Pausando 10 segundos antes do próximo exemplo...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
    
    console.log('\n🎉 Todos os exemplos foram executados!');
}

// Execução baseada em argumentos da linha de comando
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📚 EXEMPLOS DISPONÍVEIS:');
        console.log('========================');
        console.log('node examples/example-usage.js 1  # Uso básico');
        console.log('node examples/example-usage.js 2  # Envelopes específicos');
        console.log('node examples/example-usage.js 3  # Listar sem baixar');
        console.log('node examples/example-usage.js 4  # Período específico');
        console.log('node examples/example-usage.js 5  # Todos os status');
        console.log('node examples/example-usage.js 6  # Monitoramento');
        console.log('node examples/example-usage.js all # Todos os exemplos');
        console.log('');
        process.exit(1);
    }
    
    const exemplo = args[0];
    
    if (exemplo === 'all') {
        executarTodosOsExemplos().catch(console.error);
    } else {
        const numero = parseInt(exemplo);
        if (numero >= 1 && numero <= 6) {
            executarExemplo(numero).catch(console.error);
        } else {
            console.log('❌ Número de exemplo inválido. Use 1-6 ou "all".');
        }
    }
}

module.exports = {
    exemploBasico,
    exemploEnvelopesEspecificos,
    exemploListarSemBaixar,
    exemploPeriodoEspecifico,
    exemploTodosOsStatus,
    exemploMonitoramento,
    executarExemplo,
    executarTodosOsExemplos
}; 