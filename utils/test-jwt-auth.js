require('dotenv').config();
const DocuSignJWTAuth = require('../src/auth/jwt-auth');

/**
 * Script para testar autenticação JWT do DocuSign
 * Conforme documentação: https://developers.docusign.com/platform/auth/jwt-get-token/
 */

async function testJWTAuthentication() {
    console.log('🧪 TESTE DE AUTENTICAÇÃO JWT DOCUSIGN');
    console.log('====================================');
    console.log('Baseado na documentação: https://developers.docusign.com/platform/auth/jwt-get-token/\n');

    try {
        // Verificar configurações
        console.log('🔍 1. Verificando configurações...');
        const requiredVars = [
            'DOCUSIGN_INTEGRATION_KEY',
            'DOCUSIGN_USER_ID',
            'DOCUSIGN_ACCOUNT_ID'
        ];

        const missing = requiredVars.filter(key => !process.env[key]);
        if (missing.length > 0) {
            throw new Error(`Variáveis obrigatórias não definidas: ${missing.join(', ')}`);
        }

        console.log('✅ Configurações básicas validadas');
        console.log(`   Integration Key: ${process.env.DOCUSIGN_INTEGRATION_KEY?.substring(0, 8)}...`);
        console.log(`   User ID: ${process.env.DOCUSIGN_USER_ID?.substring(0, 8)}...`);
        console.log(`   Account ID: ${process.env.DOCUSIGN_ACCOUNT_ID?.substring(0, 8)}...`);
        console.log(`   Base Path: ${process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi'}`);

        // Inicializar autenticação
        console.log('\n🔐 2. Inicializando autenticação JWT...');
        const auth = new DocuSignJWTAuth({
            integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
            userId: process.env.DOCUSIGN_USER_ID,
            accountId: process.env.DOCUSIGN_ACCOUNT_ID,
            basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
            privateKeyPath: process.env.DOCUSIGN_RSA_PRIVATE_KEY_PATH || './private.key'
        });

        // Testar geração de JWT
        console.log('\n🎫 3. Testando geração de JWT...');
        const jwtToken = await auth.generateJWT();
        console.log('✅ JWT gerado com sucesso');
        console.log(`   Token JWT: ${jwtToken.substring(0, 50)}...`);

        // Testar obtenção de access token
        console.log('\n🔑 4. Testando obtenção de access token...');
        const accessToken = await auth.getAccessToken();
        console.log('✅ Access token obtido com sucesso');
        console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);

        // Testar informações do usuário
        console.log('\n👤 5. Testando informações do usuário...');
        const userInfo = await auth.getUserInfo();
        console.log('✅ Informações do usuário obtidas com sucesso');

        // Resumo final
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('===============================');
        console.log(`✅ Usuário: ${userInfo.name}`);
        console.log(`✅ Email: ${userInfo.email}`);
        console.log(`✅ Contas: ${userInfo.accounts?.length || 0}`);
        console.log(`✅ Token expira em: ${auth.tokenExpiry?.format('DD/MM/YYYY HH:mm:ss')}`);

        return {
            success: true,
            userInfo,
            accessToken: accessToken.substring(0, 20) + '...',
            tokenExpiry: auth.tokenExpiry?.format('DD/MM/YYYY HH:mm:ss')
        };

    } catch (error) {
        console.error('\n❌ TESTE FALHOU!');
        console.error('================');
        console.error(`Erro: ${error.message}`);
        
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
        }

        console.error('\n💡 DICAS PARA RESOLVER:');
        console.error('========================');
        
        if (error.message.includes('secretOrPrivateKey')) {
            console.error('🔑 Problema com chave privada:');
            console.error('   - Execute: npm run check-key');
            console.error('   - Se necessário: npm run generate-key');
        }
        
                 if (error.response?.status === 400) {
             const errorData = error.response.data;
             
             if (errorData?.error === 'consent_required') {
                 console.error('🔐 CONSENTIMENTO DA APLICAÇÃO NECESSÁRIO:');
                 console.error('   ⚠️  Você precisa dar consentimento para a aplicação primeiro!');
                 console.error('   🚀 Execute: npm run setup-consent');
                 console.error('   📋 Siga as instruções para dar consentimento');
                 console.error('   ✅ Depois execute: npm run test-jwt');
             } else {
                 console.error('🔐 Problema de autenticação:');
                 console.error('   - Verifique Integration Key no DocuSign Developer Portal');
                 console.error('   - Verifique User ID (GUID do usuário)');
                 console.error('   - Certifique-se de que a chave pública RSA está configurada');
                 console.error('   - Verifique se o usuário tem permissão de "impersonation"');
             }
         }
        
        if (error.response?.status === 401) {
            console.error('🚫 Não autorizado:');
            console.error('   - Verifique se a aplicação está ativa no DocuSign');
            console.error('   - Verifique se o usuário existe e tem permissões');
            console.error('   - Verifique se está usando o ambiente correto (demo/produção)');
        }

        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testJWTAuthentication()
        .then(result => {
            if (result.success) {
                console.log('\n🚀 Autenticação JWT funcionando! Você pode executar: npm start');
                process.exit(0);
            } else {
                console.log('\n🛠️  Resolva os problemas acima e tente novamente');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Erro inesperado:', error);
            process.exit(1);
        });
}

module.exports = { testJWTAuthentication }; 