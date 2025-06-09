const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class DocumentDownloader {
    constructor(docuSignClient, config) {
        this.client = docuSignClient;
        this.downloadFolder = config.downloadFolder || './downloads';
        this.maxConcurrentDownloads = config.maxConcurrentDownloads || 5;
        this.language = config.language || 'pt_BR';
        
        this.stats = {
            totalEnvelopes: 0,
            totalDocuments: 0,
            totalCertificates: 0,
            totalBytes: 0,
            errors: 0,
            startTime: null,
            endTime: null
        };
    }

    /**
     * Inicializa o diretório de downloads
     */
    async initialize() {
        await fs.ensureDir(this.downloadFolder);
        console.log(`📁 Diretório de downloads criado: ${this.downloadFolder}`);
        
        this.stats.startTime = moment();
        console.log(`🚀 Iniciando downloads em: ${this.stats.startTime.format('DD/MM/YYYY HH:mm:ss')}`);
    }

    /**
     * Cria nome de arquivo seguro
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 200); // Limita o tamanho do nome
    }

    /**
     * Baixa documentos de um envelope específico
     */
    async downloadEnvelopeDocuments(envelopeId, envelopeDetails = null) {
        try {
            console.log(`\n📦 Processando envelope: ${envelopeId}`);
            
            // Obtém detalhes do envelope se não fornecidos
            if (!envelopeDetails) {
                envelopeDetails = await this.client.getEnvelopeDetails(envelopeId);
            }

            // Cria pasta para o envelope
            const envelopeFolderName = this.sanitizeFilename(
                `${envelopeId}_${envelopeDetails.emailSubject || 'Sem_Assunto'}`
            );
            const envelopeFolder = path.join(this.downloadFolder, envelopeFolderName);
            await fs.ensureDir(envelopeFolder);

            // Salva informações do envelope
            const envelopeInfoPath = path.join(envelopeFolder, 'envelope_info.json');
            await fs.writeJson(envelopeInfoPath, envelopeDetails, { spaces: 2 });

            // Lista documentos do envelope
            const documents = await this.client.getEnvelopeDocuments(envelopeId);
            
            // Downloads paralelos (limitados)
            const downloadPromises = [];
            const semaphore = this.createSemaphore(this.maxConcurrentDownloads);

            // Baixa cada documento
            for (const document of documents) {
                downloadPromises.push(
                    this.downloadSingleDocument(
                        envelopeId, 
                        document, 
                        envelopeFolder, 
                        semaphore
                    )
                );
            }

            // Baixa certificado separadamente
            downloadPromises.push(
                this.downloadEnvelopeCertificate(envelopeId, envelopeFolder, semaphore)
            );

            await Promise.allSettled(downloadPromises);
            
            this.stats.totalEnvelopes++;
            console.log(`✅ Envelope ${envelopeId} processado com sucesso`);

        } catch (error) {
            console.error(`❌ Erro ao processar envelope ${envelopeId}:`, error.message);
            this.stats.errors++;
        }
    }

    /**
     * Baixa um documento individual
     */
    async downloadSingleDocument(envelopeId, document, envelopeFolder, semaphore) {
        return semaphore(async () => {
            try {
                // Pula o certificado (será baixado separadamente)
                if (document.type === 'summary' || document.name === 'Summary') {
                    return;
                }

                const documentBuffer = await this.client.downloadDocument(
                    envelopeId, 
                    document.documentId,
                    { 
                        language: this.language,
                        certificate: false 
                    }
                );

                const filename = this.sanitizeFilename(
                    `${document.name || document.documentId}.pdf`
                );
                const filePath = path.join(envelopeFolder, filename);

                await fs.writeFile(filePath, documentBuffer);
                
                this.stats.totalDocuments++;
                this.stats.totalBytes += documentBuffer.byteLength;
                
                console.log(`  📄 Documento salvo: ${filename}`);

            } catch (error) {
                console.error(`  ❌ Erro ao baixar documento ${document.documentId}:`, error.message);
                this.stats.errors++;
            }
        });
    }

    /**
     * Baixa o certificado do envelope
     */
    async downloadEnvelopeCertificate(envelopeId, envelopeFolder, semaphore) {
        return semaphore(async () => {
            try {
                const certificateBuffer = await this.client.downloadCertificate(
                    envelopeId,
                    { language: this.language }
                );

                const certificateFilename = `Certificado_${envelopeId}_${this.language}.pdf`;
                const certificatePath = path.join(envelopeFolder, certificateFilename);

                await fs.writeFile(certificatePath, certificateBuffer);
                
                this.stats.totalCertificates++;
                this.stats.totalBytes += certificateBuffer.byteLength;
                
                console.log(`  🏆 Certificado salvo: ${certificateFilename}`);

            } catch (error) {
                console.error(`  ❌ Erro ao baixar certificado:`, error.message);
                this.stats.errors++;
            }
        });
    }

    /**
     * Baixa documentos de múltiplos envelopes
     */
    async downloadMultipleEnvelopes(envelopeIds) {
        console.log(`📦 Iniciando download de ${envelopeIds.length} envelopes...`);
        
        for (const envelopeId of envelopeIds) {
            await this.downloadEnvelopeDocuments(envelopeId);
            
            // Pequena pausa entre envelopes para não sobrecarregar
            await this.sleep(1000);
        }
    }

    /**
     * Baixa documentos combinados de múltiplos envelopes
     */
    async downloadCombinedDocuments(envelopeIds) {
        console.log(`📦 Iniciando download de documentos combinados de ${envelopeIds.length} envelopes...`);
        
        // Cria pasta específica para documentos combinados
        const combinedFolder = path.join(this.downloadFolder, 'Documentos_Combinados');
        await fs.ensureDir(combinedFolder);
        
        const semaphore = this.createSemaphore(this.maxConcurrentDownloads);
        const downloadPromises = [];

        for (const envelopeId of envelopeIds) {
            downloadPromises.push(
                this.downloadSingleCombinedDocument(envelopeId, combinedFolder, semaphore)
            );
        }

        const results = await Promise.allSettled(downloadPromises);
        
        // Contar sucessos e falhas
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`\n📊 RESULTADO DOS DOWNLOADS COMBINADOS:`);
        console.log(`✅ Sucessos: ${successful}`);
        console.log(`❌ Falhas: ${failed}`);
        
        this.stats.totalEnvelopes += successful;
        this.stats.errors += failed;
    }

    /**
     * Baixa documento combinado de um envelope específico
     */
    async downloadSingleCombinedDocument(envelopeId, combinedFolder, semaphore) {
        return semaphore(async () => {
            try {
                console.log(`\n📦 Baixando documento combinado: ${envelopeId}`);
                
                // Obter detalhes do envelope para nome do arquivo
                const envelopeDetails = await this.client.getEnvelopeDetails(envelopeId);
                
                // Baixar documento combinado
                const combinedBuffer = await this.client.downloadCombinedDocuments(
                    envelopeId,
                    { 
                        language: this.language,
                        certificate: true // Incluir certificado no documento combinado
                    }
                );

                // Criar nome do arquivo
                const subjectSafe = this.sanitizeFilename(
                    envelopeDetails.emailSubject || 'Sem_Assunto'
                );
                const filename = `${envelopeId}_${subjectSafe}_Combinado.pdf`;
                const filePath = path.join(combinedFolder, filename);

                // Salvar arquivo
                await fs.writeFile(filePath, combinedBuffer);
                
                // Atualizar estatísticas
                this.stats.totalDocuments++;
                this.stats.totalBytes += combinedBuffer.byteLength;
                
                const sizeKB = Math.round(combinedBuffer.byteLength / 1024);
                console.log(`  ✅ Combinado salvo: ${filename} (${sizeKB} KB)`);

                return { envelopeId, filename, size: combinedBuffer.byteLength };

            } catch (error) {
                console.error(`  ❌ Erro ao baixar combinado ${envelopeId}:`, error.message);
                this.stats.errors++;
                throw error;
            }
        });
    }

    /**
     * Baixa documentos de envelopes baseado em critérios de busca
     */
    async downloadEnvelopesByCriteria(criteria = {}) {
        console.log('🔍 Buscando envelopes baseado nos critérios...');
        
        let allEnvelopes = [];
        let startPosition = 0;
        const pageSize = 100;
        
        do {
            const result = await this.client.getEnvelopes({
                ...criteria,
                count: pageSize,
                startPosition: startPosition
            });
            
            if (result.envelopes && result.envelopes.length > 0) {
                allEnvelopes = allEnvelopes.concat(result.envelopes);
                startPosition += pageSize;
                
                console.log(`📋 ${allEnvelopes.length} envelopes encontrados até agora...`);
            } else {
                break;
            }
            
        } while (startPosition < 1000); // Limita a 1000 envelopes por segurança

        console.log(`📊 Total de envelopes encontrados: ${allEnvelopes.length}`);

        // Baixa documentos de cada envelope
        for (const envelope of allEnvelopes) {
            await this.downloadEnvelopeDocuments(envelope.envelopeId, envelope);
            await this.sleep(500); // Pausa entre downloads
        }
    }

    /**
     * Cria um semáforo para limitar downloads concorrentes
     */
    createSemaphore(maxConcurrent) {
        let current = 0;
        const queue = [];

        const processSemaphoreQueue = async () => {
            if (current >= maxConcurrent || queue.length === 0) {
                return;
            }

            current++;
            const { fn, resolve, reject } = queue.shift();

            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            } finally {
                current--;
                processSemaphoreQueue();
            }
        };

        return async (fn) => {
            return new Promise((resolve, reject) => {
                queue.push({ fn, resolve, reject });
                processSemaphoreQueue();
            });
        };
    }

    /**
     * Utilitário para pausar execução
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gera relatório final de downloads
     */
    generateReport() {
        this.stats.endTime = moment();
        const duration = moment.duration(this.stats.endTime.diff(this.stats.startTime));
        
        const report = {
            resumo: {
                totalEnvelopes: this.stats.totalEnvelopes,
                totalDocumentos: this.stats.totalDocuments,
                totalCertificados: this.stats.totalCertificates,
                totalBytes: this.stats.totalBytes,
                totalMB: Math.round(this.stats.totalBytes / 1024 / 1024 * 100) / 100,
                erros: this.stats.errors,
                duracaoTotal: duration.humanize(),
                inicioEm: this.stats.startTime.format('DD/MM/YYYY HH:mm:ss'),
                finalEm: this.stats.endTime.format('DD/MM/YYYY HH:mm:ss')
            }
        };

        console.log('\n📊 RELATÓRIO FINAL DE DOWNLOADS');
        console.log('================================');
        console.log(`📦 Total de envelopes: ${report.resumo.totalEnvelopes}`);
        console.log(`📄 Total de documentos: ${report.resumo.totalDocumentos}`);
        console.log(`🏆 Total de certificados: ${report.resumo.totalCertificados}`);
        console.log(`💾 Total baixado: ${report.resumo.totalMB} MB`);
        console.log(`❌ Erros: ${report.resumo.erros}`);
        console.log(`⏱️  Duração: ${report.resumo.duracaoTotal}`);
        console.log('================================\n');

        return report;
    }

    /**
     * Salva relatório em arquivo
     */
    async saveReport() {
        const report = this.generateReport();
        const reportPath = path.join(this.downloadFolder, 'relatorio_downloads.json');
        
        await fs.writeJson(reportPath, report, { spaces: 2 });
        console.log(`📄 Relatório salvo em: ${reportPath}`);
        
        return report;
    }
}

module.exports = DocumentDownloader; 