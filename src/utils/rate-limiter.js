const moment = require('moment');

class RateLimiter {
    constructor(requestsPerMinute = 300, delayMs = 200) {
        this.requestsPerMinute = requestsPerMinute;
        this.delayMs = delayMs;
        this.requests = [];
        this.queue = [];
        this.processing = false;
    }

    /**
     * Adiciona uma requisição à fila de rate limiting
     */
    async addRequest(requestFunction) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                fn: requestFunction,
                resolve,
                reject,
                timestamp: moment()
            });
            
            this.processQueue();
        });
    }

    /**
     * Processa a fila de requisições respeitando o rate limit
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            // Remove requisições antigas (mais de 1 minuto)
            const oneMinuteAgo = moment().subtract(1, 'minute');
            this.requests = this.requests.filter(req => req.isAfter(oneMinuteAgo));

            // Verifica se pode fazer mais requisições
            if (this.requests.length >= this.requestsPerMinute) {
                console.log(`⏳ Rate limit atingido (${this.requests.length}/${this.requestsPerMinute}). Aguardando...`);
                await this.sleep(60000); // Aguarda 1 minuto
                continue;
            }

            const request = this.queue.shift();
            
            try {
                // Adiciona um pequeno delay entre requisições
                if (this.requests.length > 0) {
                    await this.sleep(this.delayMs);
                }

                // Executa a requisição
                const result = await request.fn();
                this.requests.push(moment());
                
                console.log(`📊 Rate limit: ${this.requests.length}/${this.requestsPerMinute} requisições por minuto`);
                
                request.resolve(result);
            } catch (error) {
                console.error('❌ Erro na requisição:', error.message);
                request.reject(error);
            }
        }

        this.processing = false;
    }

    /**
     * Utilitário para pausar execução
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtém estatísticas do rate limiter
     */
    getStats() {
        const oneMinuteAgo = moment().subtract(1, 'minute');
        const recentRequests = this.requests.filter(req => req.isAfter(oneMinuteAgo));
        
        return {
            requestsInLastMinute: recentRequests.length,
            maxRequestsPerMinute: this.requestsPerMinute,
            queueLength: this.queue.length,
            remainingCapacity: this.requestsPerMinute - recentRequests.length
        };
    }
}

module.exports = RateLimiter; 