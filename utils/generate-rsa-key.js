const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Utilitário para gerar chaves RSA para usar com DocuSign JWT
 */

function generateRSAKey() {
    console.log('🔐 GERADOR DE CHAVES RSA PARA DOCUSIGN');
    console.log('=====================================');
    
    try {
        // Verifica se OpenSSL está disponível
        try {
            execSync('openssl version', { stdio: 'ignore' });
            console.log('✅ OpenSSL encontrado');
        } catch (error) {
            console.error('❌ OpenSSL não encontrado no sistema');
            console.error('💡 Instale o OpenSSL ou use uma ferramenta online para gerar as chaves');
            console.error('   - Windows: https://slproweb.com/products/Win32OpenSSL.html');
            console.error('   - macOS: brew install openssl');
            console.error('   - Linux: sudo apt-get install openssl');
            return;
        }

        const keyPath = path.join(process.cwd(), 'private.key');
        const publicKeyPath = path.join(process.cwd(), 'public.key');

        // Verifica se já existe uma chave
        if (fs.existsSync(keyPath)) {
            console.log('⚠️  Arquivo private.key já existe');
            console.log('   Para gerar uma nova chave, delete o arquivo existente primeiro');
            return;
        }

        console.log('🔑 Gerando par de chaves RSA 2048 bits...');

        // Gera chave privada
        execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
        console.log(`✅ Chave privada salva em: ${keyPath}`);

        // Gera chave pública correspondente
        execSync(`openssl rsa -in "${keyPath}" -pubout -out "${publicKeyPath}"`, { stdio: 'inherit' });
        console.log(`✅ Chave pública salva em: ${publicKeyPath}`);

        // Lê e exibe as chaves
        const privateKey = fs.readFileSync(keyPath, 'utf8');
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('==================');
        console.log('1. 📋 Copie a chave pública abaixo');
        console.log('2. 🌐 Acesse o DocuSign Developer Portal');
        console.log('3. ⚙️  Vá em sua aplicação > Authentication > JWT');
        console.log('4. 📝 Cole a chave pública no campo "RSA Public Key"');
        console.log('5. 💾 Salve as configurações');
        console.log('6. ✅ Execute o script novamente');

        console.log('\n📋 CHAVE PÚBLICA (copie e cole no DocuSign):');
        console.log('='.repeat(80));
        console.log(publicKey);
        console.log('='.repeat(80));

        console.log('\n🔒 IMPORTANTE:');
        console.log('- A chave privada (private.key) deve permanecer SECRETA');
        console.log('- Nunca compartilhe ou publique a chave privada');
        console.log('- A chave pública pode ser compartilhada com segurança');

    } catch (error) {
        console.error('❌ Erro ao gerar chaves:', error.message);
        console.error('\n💡 Alternativas:');
        console.error('1. Use um gerador online de chaves RSA');
        console.error('2. Use ferramentas como ssh-keygen');
        console.error('3. Use o portal do DocuSign para gerar as chaves');
    }
}

function checkExistingKey() {
    const keyPath = path.join(process.cwd(), 'private.key');
    
    if (fs.existsSync(keyPath)) {
        try {
            const privateKey = fs.readFileSync(keyPath, 'utf8');
            
            console.log('🔍 VERIFICAÇÃO DA CHAVE EXISTENTE');
            console.log('================================');
            console.log(`📁 Arquivo: ${keyPath}`);
            console.log(`📏 Tamanho: ${privateKey.length} caracteres`);
            
            if (privateKey.includes('BEGIN') && privateKey.includes('PRIVATE KEY')) {
                console.log('✅ Formato da chave parece válido');
                
                // Gera a chave pública correspondente para verificação
                const publicKeyPath = path.join(process.cwd(), 'public.key');
                try {
                    execSync(`openssl rsa -in "${keyPath}" -pubout -out "${publicKeyPath}"`, { stdio: 'ignore' });
                    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
                    
                    console.log('\n📋 CHAVE PÚBLICA CORRESPONDENTE:');
                    console.log('='.repeat(80));
                    console.log(publicKey);
                    console.log('='.repeat(80));
                    
                } catch (error) {
                    console.log('❌ Erro ao gerar chave pública correspondente');
                    console.log('   A chave privada pode estar corrompida');
                }
                
            } else {
                console.log('❌ Formato da chave inválido');
                console.log('   O arquivo não contém uma chave RSA válida');
            }
            
        } catch (error) {
            console.error('❌ Erro ao ler arquivo:', error.message);
        }
    } else {
        console.log('❌ Arquivo private.key não encontrado');
        console.log('💡 Execute: node utils/generate-rsa-key.js generate');
    }
}

// Interface de linha de comando
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'generate':
            generateRSAKey();
            break;
        case 'check':
            checkExistingKey();
            break;
        default:
            console.log('🔐 UTILITÁRIO DE CHAVES RSA PARA DOCUSIGN');
            console.log('========================================');
            console.log('');
            console.log('Comandos disponíveis:');
            console.log('  node utils/generate-rsa-key.js generate  # Gera novas chaves RSA');
            console.log('  node utils/generate-rsa-key.js check     # Verifica chave existente');
            console.log('');
            break;
    }
}

module.exports = {
    generateRSAKey,
    checkExistingKey
}; 