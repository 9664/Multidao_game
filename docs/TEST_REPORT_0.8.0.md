# Validação 0.8.0 — 8 de novembro de 2026

Estado: implementada e testada em ambiente de desenvolvimento, para revisão. Sem substituição do site público. Fontes-base conferidas pelo SHA de blob com a árvore do commit `aa1c0ea90aa4839357fcfd3b3182021102a1a3bb`.

## Testes funcionais

- **48/48 testes de lógica aprovados:** 35 existentes e 13 novos. Gerador determinístico, temas em ciclos, ondas de elite/comandante, progressão além da sexta onda, repetição sem dificuldade oculta, limites de configuração, conservação da fila, interpolação, pausa, migração e saneamento de progresso.
- **18/18 testes de regressão aprovados** no cenário 0.6.0 preservado.
- **14 partidas completas** no modo infinito: ondas 1, 5, 10, 25, 100, 1.000 e 1.000.000, com sementes 20261108 e 42. Todas venceram com a estratégia usada: segundo canhão, 99 reforços, terceiro canhão, centro e rajada quando disponível. Não significa vitória garantida para qualquer jogador.
- As partidas verificaram contagem de tropas, baixas, munição, clones em espera e posições transitáveis. Duração das vitórias: aproximadamente 31,9–48,6 segundos de simulação. Testar a onda 1.000.000 significa gerar e executar aquela onda, não percorrer um milhão de partidas.

## Interface e gráficos

Chromium **144.0.7559.96**, Xvfb, WebGL por **SwiftShader**. Cinco viewports: 360×740, 390×780, 393×852, 844×390 e 1366×768; toque emulado nos quatro primeiros.

Passaram inicialização WebGL, seleção entre campanha e infinito, toque/cancelamento, teclado, mira, pausa/retomada, áudio, volume, redução de movimento, modos gráficos, rajada, mudança de orientação, vitória e próxima onda. A transição isolada da onda 6 para 7 usa uma fixture; separadamente, a onda 10 executou combate completo com as regras reais.

Nenhum erro JavaScript ou WebGL nas cinco execuções finais. Seis trocas de cenário criaram e liberaram 12 buffers de cenário/decoração por viewport, sem criar outro contexto de áudio. Isso cobre esses recursos instrumentados, não prova ausência universal de vazamentos. A representação visual conferiu `visíveis + fora da câmera = unidades vivas`.

Casos sem WebGL e sem Web Audio exibiram recuperação ou mantiveram o jogo sem som. A persistência foi validada como módulo com armazenamento simulado, incluindo migração e falha de quota. Persistência através de recarga em uma origem HTTP real não foi validada.

## Comparativo medido com a 0.7.1

Cena congelada após 600 passos determinísticos da fase 6, com **4.012 unidades vivas**, resolução 390×780 e razão de pixels 1. Quatro execuções na ordem antiga/nova/nova/antiga. Cada execução descartou 20 quadros de aquecimento e mediu 80. Ambas renderizaram as mesmas unidades e baixas. O enquadramento e o acabamento correspondem a cada versão; não se trata de comparação pixel a pixel idêntica.

| Métrica | 0.7.1 | 0.8.0 |
|---|---:|---:|
| Intervalo médio entre quadros, média das duas execuções | 71,66 ms | 61,04 ms |
| p95 do intervalo, média das duas execuções | 133,30 ms | 116,60 ms |

Nesse teste, o intervalo médio caiu **14,8%**. A cena permaneceu abaixo de 30 quadros por segundo em software; não afirmar que o problema de fluidez está resolvido em celulares. A amostra é pequena e não mede bateria, temperatura, GPU móvel ou jogo inteiro em tempo real.

Na simulação isolada, quatro partidas alternadas da fase 6 terminaram com os mesmos 4.000 abates e 53,5 segundos de simulação. Tempo de CPU médio: aproximadamente 6,33 s na base e 6,18 s na revisão, diferença pequena (cerca de 2,4%), sem alegação de significância estatística.

Uma tentativa de reaproveitar também as grades espaciais não mostrou ganho e foi removida. O código entregue mantém a grade original; reutiliza os buffers de desenho e acelera a amostragem da estrada. Os logs finais correspondem à implementação escolhida.

## HTML único e restrições

O HTML único incorpora os mesmos scripts e estilos, sem dependências remotas. Seu menu, início de onda e pausa foram executados em memória sem erros. Navegar diretamente para o arquivo foi bloqueado pelo Chromium do ambiente com `ERR_BLOCKED_BY_ADMINISTRATOR`; isso não foi contornado nem apresentado como teste de abertura em Android.

Os testes de navegador carregaram os arquivos de produção em memória. Trechos de simulação foram acelerados pelo gancho de testes, sem alterar regras de vitória. Nenhum teste em Android físico, iPhone ou Safari foi executado. A nova versão não foi publicada no GitHub Pages nesta entrega.

## Rastreabilidade

`evidence-v080` reúne logs, matriz, capturas, métricas e SHA-256 dos arquivos. Os testes são reproduzíveis em `tests/*080*` e `tests/endless.test.cjs`. A versão anterior permanece no histórico e em `legacy/campaign-071`.
