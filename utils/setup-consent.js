require('dotenv').config();

/**
 * Script para gerar URL de consentimento da aplicação DocuSign
 * Conforme documentação: https://developers.docusign.com/platform/auth/jwt-get-token/
 * 
 * IMPORTANTE: Este passo deve ser executado ANTES de usar JWT Grant pela primeira vez
 */

function generateConsentURL() {
    console.log('🔐 CONFIGURAÇÃO DE CONSENTIMENTO DA APLICAÇÃO DOCUSIGN');
    console.log('====================================================');
    console.log('Baseado na documentação: https://developers.docusign.com/platform/auth/jwt-get-token/\n');

    // Verificar configurações obrigatórias
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    const basePath = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';

    if (!integrationKey) {
        console.error('❌ DOCUSIGN_INTEGRATION_KEY não definida no arquivo .env');
        console.error('💡 Configure suas variáveis de ambiente primeiro');
        return null;
    }

    // Determinar ambiente e URLs baseadas no basePath
    const isDemoEnvironment = basePath.includes('demo');
    const authBaseURL = isDemoEnvironment 
        ? 'https://account-d.docusign.com/oauth/auth'
        : 'https://account.docusign.com/oauth/auth';

    const environment = isDemoEnvironment ? 'DEMO/SANDBOX' : 'PRODUÇÃO';

    console.log(`🌐 Ambiente detectado: ${environment}`);
    console.log(`🔗 Base URL de autenticação: ${authBaseURL}`);
    console.log(`🔑 Integration Key: ${integrationKey}\n`);

    // Parâmetros para a URL de consentimento
    const redirectUri = 'https://developers.docusign.com/platform/auth/consent'; // URI padrão do DocuSign
    const scopes = 'signature impersonation'; // Escopos necessários para JWT
    const responseType = 'code';

    // Construir URL de consentimento
    const consentParams = new URLSearchParams({
        response_type: responseType,
        scope: scopes,
        client_id: integrationKey,
        redirect_uri: redirectUri
    });

    const consentURL = `${authBaseURL}?${consentParams.toString()}`;

    console.log('📋 PARÂMETROS DE CONSENTIMENTO:');
    console.log('==============================');
    console.log(`🎯 Response Type: ${responseType}`);
    console.log(`🔑 Client ID (Integration Key): ${integrationKey}`);
    console.log(`🔄 Redirect URI: ${redirectUri}`);
    console.log(`🎫 Scopes: ${scopes}`);
    console.log('');

    console.log('🌐 URL DE CONSENTIMENTO GERADA:');
    console.log('===============================');
    console.log(consentURL);
    console.log('');

    console.log('📋 INSTRUÇÕES PASSO A PASSO:');
    console.log('============================');
    console.log('1. 📋 COPIE a URL acima');
    console.log('2. 🌐 ABRA a URL em seu navegador');
    console.log('3. 🔐 FAÇA LOGIN em sua conta DocuSign');
    console.log('4. ✅ ACEITE o consentimento da aplicação');
    console.log('5. ⚠️  IGNORE a mensagem de erro "Não é possível carregar a página"');
    console.log('6. ✅ FECHE a aba do navegador');
    console.log('7. 🚀 EXECUTE: npm run test-jwt');
    console.log('');

    console.log('⚠️  IMPORTANTE:');
    console.log('===============');
    console.log('- Este consentimento precisa ser feito APENAS UMA VEZ por usuário');
    console.log('- Após dar o consentimento, você pode usar JWT Grant normalmente');
    console.log('- Se mudar de usuário ou escopos, precisará repetir o processo');
    console.log('- A mensagem de erro no navegador é NORMAL e pode ser ignorada');
    console.log('');

    return {
        consentURL,
        environment,
        integrationKey,
        redirectUri,
        scopes
    };
}

function checkConsentStatus() {
    console.log('🔍 VERIFICANDO STATUS DO CONSENTIMENTO');
    console.log('=====================================');
    console.log('');
    console.log('Para verificar se o consentimento foi dado:');
    console.log('1. Execute: npm run test-jwt');
    console.log('2. Se der erro "consent_required", refaça o consentimento');
    console.log('3. Se funcionar, o consentimento foi dado com sucesso');
    console.log('');
}

function showConsentHelp() {
    console.log('❓ AJUDA - CONSENTIMENTO DA APLICAÇÃO DOCUSIGN');
    console.log('==============================================');
    console.log('');
    console.log('📚 O que é o consentimento?');
    console.log('   O consentimento permite que sua aplicação "impersone" o usuário');
    console.log('   e faça chamadas à API em nome dele usando JWT Grant.');
    console.log('');
    console.log('🔄 Quando preciso dar consentimento?');
    console.log('   - Primeira vez usando JWT com um usuário');
    console.log('   - Mudança de escopos (permissões)');
    console.log('   - Mudança de usuário');
    console.log('');
    console.log('🌐 Ambientes:');
    console.log('   - DEMO: https://account-d.docusign.com/oauth/auth');
    console.log('   - PRODUÇÃO: https://account.docusign.com/oauth/auth');
    console.log('');
    console.log('🛠️  Comandos úteis:');
    console.log('   npm run setup-consent        # Gera URL de consentimento');
    console.log('   npm run setup-consent check  # Verifica status');
    console.log('   npm run test-jwt             # Testa autenticação');
    console.log('');
}

// Interface de linha de comando
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'check':
            checkConsentStatus();
            break;
        case 'help':
            showConsentHelp();
            break;
        default:
            const result = generateConsentURL();
            if (result) {
                console.log('🔗 URL copiada para clipboard (se suportado)');
                
                // Tentar copiar para clipboard (opcional)
                try {
                    const { spawn } = require('child_process');
                    if (process.platform === 'win32') {
                        const clip = spawn('clip');
                        clip.stdin.write(result.consentURL);
                        clip.stdin.end();
                    }
                } catch (e) {
                    // Ignorar erro se não conseguir copiar
                }
            }
            break;
    }
}

module.exports = {
    generateConsentURL,
    checkConsentStatus,
    showConsentHelp
}; 