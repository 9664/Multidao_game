# Validação — Grande Cerco 0.5.0

Executada em 8 de novembro de 2026, sobre os arquivos desta versão. Resultados instrumentados; não foi realizada uma sessão em telefone físico.

## Lógica: 18 testes aprovados

Comando: `node --test tests/core.test.cjs`.

Verificados: 720 inimigos reais e posições iniciais válidas; disparo e consumo de carga; formação durante a preparação; multiplicação exata ×5 ×4 e prevenção de multiplicação repetida; colisões; três posições fixas de mira; contagem conservada de tropas e baixas; vitória padrão; derrota sem disparos; pausa; reinício; equivalência a 30/60/120 atualizações; fase espelhada; movimentos rápidos da mira; tempo máximo; efeitos limitados; 960 inimigos no nível 20.

Na partida padrão, a vitória ocorreu após 23,567 segundos de simulação, com 720 abates, 43 disparos e pico de 908 personagens simultâneos. Houve 344 aliados sobreviventes. Esses valores descrevem uma execução determinística específica, não garantem vitória para qualquer estratégia.

## Navegador: cinco configurações aprovadas

Chromium 144.0.7559.96, WebGL por SwiftShader, display virtual. Telas 360×740, 390×780, 393×852, 844×390 e 1366×768; toque emulado nas quatro primeiras.

Cobertura: renderização e ausência de erros WebGL/JavaScript; toque ou teclado; canhão, portões e castelo enquadrados; ausência de rolagem horizontal; pausa e retomada; ativação do áudio somente após interação; controles separados de música/efeitos; volume; redução de movimento; modo LEVE; combate; contador correspondente às tropas reais; vitória e próxima fase.

Seis reinícios em cada configuração criaram e liberaram seis buffers de cenário, sem acumulação desses buffers. O número de personagens desenhados correspondeu ao número de unidades vivas. O desenho usou até sete chamadas instanciadas nos cenários verificados.

## Som e recuperação

O contexto de áudio ficou ativo após o botão de início e suspenso durante a pausa. A saída apresentou sinal não nulo nos testes. Música e efeitos puderam ser silenciados separadamente.

Uma amostra de quatro segundos foi renderizada pela própria implementação em OfflineAudioContext, a 48 kHz: pico normalizado 0,1516, RMS 0,00904 e máximo de 21 vozes, abaixo do limite de 40. Essa amostra não apresentou clipping. Isso comprova geração de sinal, não uma avaliação auditiva humana em todos os aparelhos.

Também foram aprovados os casos de WebGL indisponível (mensagem de recuperação) e Web Audio indisponível (jogo permanece utilizável sem som).

## Limitações explícitas

A navegação HTTP pelo Chromium deste ambiente foi bloqueada com `ERR_BLOCKED_BY_ADMINISTRATOR`. Os testes gráficos utilizaram os arquivos de produção carregados em memória; não foram testes de navegação no endereço público. Trechos da partida foram acelerados pela ferramenta de testes usando a mesma simulação.

Android físico, iPhone físico e Safari não foram testados. Não há medição de FPS de celular ou promessa de fluidez em todos os aparelhos. Publicação no Pages e integridade dos arquivos distribuídos são verificações separadas.
