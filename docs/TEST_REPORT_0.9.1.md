# Validação 0.9.1 — Cânion em Foco

Base: `b02e5416845544ef00e66b495c88ae01d8d5b131`. Os arquivos locais de produção usados como ponto de partida foram conferidos por hashes de blob com a árvore do repositório.

## Testes executados

**71/71 testes de lógica passaram:** 66 existentes e cinco novos da formação. Os novos casos verificam quantidade real de invasores, posições transitáveis, reprodução determinística, preservação das outras fases e duas partidas completas do cânion com conservação de tropas e munição. Os dois cenários terminaram em vitória legítima, com 2.200 abates e chefe derrotado. Isso não é uma garantia de vitória para qualquer estratégia.

**18/18 testes de regressão** da versão 0.6.0 preservada também passaram.

**Cinco configurações de navegador passaram:** 360×740, 390×780, 393×852, 844×390 e 1366×768. Chromium 144.0.7559.96, SwiftShader, Xvfb. Toque emulado nas quatro primeiras. As execuções finais foram divididas entre três telas verticais e duas telas largas para respeitar o tempo do ambiente.

Em cada configuração, foram exercitados início, mira, cancelamento de toque quando aplicável, pausa, reinício, batalha completa, resultado, moedas, desbloqueio da base, construções, invasão, coleta, orientação e retorno ao cerco. A projeção e a inversão da mira na nova câmera foram comparadas numericamente. Nenhum erro JavaScript ou WebGL foi registrado nas cinco execuções finais.

As visitas repetidas à base reutilizaram os recursos existentes. O compartilhamento foi interceptado por um substituto de teste: não foram enviadas mensagens reais. Trechos de combate foram acelerados pelo gancho de testes, sem mudar suas regras.

## Comparação visual

Foram capturadas a 0.9.0 e a 0.9.1 no Cânion do Guardião, aos mesmos 5,5, 16 e 23 segundos de simulação, em 390×780. São imagens do navegador executando o jogo, não imagens conceituais. Como a formação dos inimigos foi revisada, as posições e as baixas podem diferir entre versões.

A matriz de projeção comprime a profundidade visual do mundo; terreno e unidades usam a mesma matriz, e o controle usa sua inversão. As posições de simulação não são comprimidas. Rótulos e barra de vida acompanham projeções reais. Os números de resistência das torres representam os valores da simulação.

## Limitações

Android físico, iPhone e Safari não foram testados. A leitura pública do site pela ferramenta web falhou; execução gráfica e confirmação de publicação no GitHub são verificações diferentes.

Os arquivos foram carregados em memória no navegador de testes. Não foi verificada persistência por recarga numa origem HTTP real nesta rodada. Não foi executado um benchmark sustentado de FPS em hardware móvel. Uma medição diagnóstica de desenho de quadros congelados não é usada como alegação de fluidez.

O visual continua estilizado e simplificado. As animações e a densidade aparente não são equivalentes às do anúncio. Não foram acrescentadas pilhas de recompensas inexistentes ou canhões decorativos apresentados como armas reais.

Fontes, logs, capturas e hashes estão no pacote da versão. Os cinco resultados individuais de navegador estão em `evidence-v091/browser-*.json`; o comparativo visual está em `evidence-v091/after-*.png` e `before-*.png`.
