# Validação 0.7.1 — 8 de novembro de 2026

## Escopo

Campanha com seis fases, construída sobre a revisão 0.7.0 (`cae43776da4a1bcf2cc60b4d0b3cca45020933a7`). Os módulos-base são preservados e as novas funcionalidades estão em módulos de extensão. Esta é uma publicação experimental autorizada pelo usuário; não uma certificação de desempenho em celulares.

## Execuções realizadas

- 35/35 testes de lógica: 22 do núcleo revisado e 13 da campanha. Zero falhas. A suíte foi executada com `node --test tests/core.test.cjs tests/campaign.test.cjs`.
- 18/18 testes de regressão do cenário 0.6.0, executados em `legacy/north-wall`.
- Verificação de sintaxe dos oito módulos JavaScript carregados pela página.
- Matriz de 18 partidas completas: seis fases × três sementes (20261108, 1001, 2026). Estratégia: segundo canhão, 99 reforços, terceiro canhão, centro; rajada sempre disponível após ampliar a bateria. Todas venceram e passaram nas verificações de conservação de tropas, munição e posições transitáveis. Isso não significa que qualquer estratégia ou jogador vencerá.

| Fase | Intervalo de duração de simulação nas três sementes |
|---|---|
| Ponte da Aurora | 30,733–30,900 s |
| Cânion do Guardião | 39,033–39,167 s |
| Muralha de Gelo | 46,233–46,433 s |
| Desfiladeiro Dourado | 37,633–38,000 s |
| Forja Vulcânica | 47,033–48,567 s |
| Fortaleza Boreal | 53,433–54,100 s |

Os testes novos cobrem configuração de cada fase, diferenças de percurso, multiplicadores exatos, ausência de repetição de multiplicação, rajada sem tiros gratuitos, cooldown, pausa, reinício, equivalência entre taxas de atualização e encerramento da campanha apenas após derrota da horda e do chefe. A força otimizada de separação foi comparada numericamente à original.

## Navegador

Chromium 144.0.7559.96, WebGL por SwiftShader em Xvfb. Cinco viewports aprovados: 360×740, 390×780, 393×852, 844×390 e 1366×768. Toque emulado nos quatro primeiros. Foram exercitados seletor das seis fases, toque/cancelamento, teclado, mira, pausa, áudio, volume, redução de movimento, HD/LEVE, rajada, mudança de orientação, reinício, contadores e encerramento da campanha. Também foram testadas ausências de WebGL e de Web Audio.

O teste de paisagem encontrou um botão de reinício oculto. O CSS foi corrigido e a suíte inteira foi repetida com sucesso. Não foram registrados erros JavaScript ou WebGL nas cinco execuções finais. Seis trocas de fase por viewport criaram e liberaram seis buffers de cenário, reutilizando o contexto de áudio. Isso verifica esses recursos, não prova ausência absoluta de qualquer vazamento.

A execução em 390×780 percorreu os seis cenários e concluiu a última fase. Capturas são renderizações reais desses arquivos. Trechos de combate foram acelerados pelo gancho de testes usando as mesmas regras, não por alteração dos resultados. A indicação de medalha no seletor foi verificada em memória; persistência entre sessões de navegador com origem HTTP não foi verificada neste ambiente.

## Desempenho e limitações

Foi reduzido o custo da força de separação por descarte com distância ao quadrado, antes de calcular a raiz. No desenho, tropas distantes usam 16 triângulos, sombras são limitadas aos personagens detalhados e unidades fora da câmera não são enviadas à GPU. Os contadores continuam incluindo todas as unidades vivas. A interface atualiza contadores em frequência menor que a simulação. AUTO pode diminuir a resolução, sem reduzir artificialmente exércitos.

Não foi estabelecido um novo benchmark sustentado de FPS. Não afirmar que as otimizações garantem 30/60 FPS: a renderização por software ainda pode apresentar lentidão. Android físico, iPhone, Safari, consumo de bateria e temperatura não foram testados. A cena e as animações continuam estilizadas/low-poly, não equivalentes ao acabamento do anúncio.

Os testes carregam os arquivos de produção em memória. A verificação da publicação pelo GitHub é separada da execução gráfica local. Os logs, capturas, matriz e fingerprints estão em `evidence-v071` no pacote entregue. O relatório anterior está preservado em `docs/TEST_REPORT_0.7.0.md`.
