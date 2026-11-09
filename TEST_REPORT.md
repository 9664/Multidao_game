# Validação 1.0.0 — Ascensão dos Reinos

## Verificação antes da publicação — 9 de novembro de 2026

O usuário aprovou a publicação do pacote `Multidao_v1.0_Ascensao_dos_Reinos.zip`. A branch principal foi consultada e permanecia na base `2f2a1bfe4837ae08c92bb0b2764cc2a979cfa11d` (0.9.2).

Os **32 arquivos de produção** do pacote corresponderam ao manifesto SHA-256 da revisão. As **30 dependências locais** referenciadas pela página estavam presentes; nenhum recurso remoto adicional é necessário. Os arquivos do jogo não foram modificados nesta etapa de publicação.

Foram novamente executados:

- `npm run check`: aprovado.
- `npm test`: **118/118 testes aprovados**, zero falhas.
- `npm run test:legacy`: **18/18 testes aprovados**, zero falhas.
- `CASE=phone390 xvfb-run -a python tests/browser100.py`: aprovado em **390×844**, Chromium/SwiftShader com toque emulado.

O reteste gráfico incluiu escolha de Artilharia, início, toque/cancelamento, habilidade, pausa, escolha de reforço alcançada pela simulação, conclusão da batalha, moedas e experiência sem duplicação, entrada na base, construção, invasão, pausa, retorno ao cerco, próxima fase, áudio, qualidade, orientação e equilíbrio dos buffers nas trocas de cenário. Nenhum erro JavaScript ou WebGL foi registrado.

## Resultados da revisão aprovada

A revisão entregue anteriormente registrou 118 testes lógicos, 18 regressões, cinco configurações de navegador e 31 partidas completas (30 vitórias e uma derrota). A matriz cobre as nove fases com três doutrinas e quatro ondas infinitas. Esses resultados estão no pacote de evidências da conversa; a matriz inteira não foi repetida durante esta publicação.

O comparativo isolado de busca de vizinhos reduziu o tempo médio de simulação de 13,515 para 9,977 segundos, cerca de 26,18%. Houve pequenas diferenças de trajetórias pela ordem dos cálculos. Isso não constitui uma comparação bit a bit, não inclui GPU e não demonstra ganho de FPS móvel. Nenhuma alegação objetiva de melhoria de 200% é feita.

A gravação contínua aprovada usa controles de navegador, sem acelerar a simulação, e termina com 1.200 abates. O vídeo é silencioso porque a captura não registra a saída de áudio.

## Limitações

Os testes gráficos carregam os arquivos de produção em memória. Trechos da suíte são acelerados pelos ganchos de teste, mantendo as regras. O teste do endereço hospedado e a confirmação do GitHub Pages são verificações separadas.

Android físico, iPhone, Safari, temperatura e bateria não foram testados. Não há garantia de 30/60 FPS. A persistência foi exercitada com armazenamento simulado e tratamento de falha; recarga com origem HTTP real e sincronização entre aparelhos não foram validadas.

Os dados de campanha/infinito e base usam as mesmas chaves anteriores. O comando usa armazenamento separado. Não há autenticação nem proteção antifraude para ranking online.

A versão 0.9.2 permanece no histórico; seu relatório está em `docs/TEST_REPORT_0.9.2.md`. A autorização do usuário permite publicar a versão aprovada, mas não transforma as limitações acima em testes concluídos.
