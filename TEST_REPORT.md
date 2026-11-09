# Validação 0.9.2 — Impacto e Variedade

Base de trabalho: commit `40122b9bfa2c407c50e993f652620087501c68c0`. Os arquivos-chave do pacote de origem foram conferidos por SHA de blob com a árvore atual do GitHub. Código e testes foram executados neste ambiente, sem iniciar uma tarefa separada no serviço Codex.

## Problema reproduzido e correção

Um disparo na 0.9.1 com 100 efeitos `hit` existentes consumiu munição e criou uma bala, mas produziu **zero efeitos `muzzle`**. A correção dá prioridade ao clarão e usa um histórico visual separado. No teste novo, o disparo sob a mesma saturação cria o clarão e mantém um rastro visível.

O trajeto de uma bala contra a torre, na configuração examinada, terminava em cinco passos de 1/30 s. A nova renderização interpola posições e conserva por até 0,24 s o trecho final após o contato. A física ainda resolve um único impacto e não usa o rastro para aplicar dano.

A falta de cargas também era pouco clara. Há agora aviso explícito para últimas cargas e munição zerada. Tiros não são simulados graficamente depois que a munição acaba.

## Testes de lógica

**98/98 testes passaram:** 71 existentes e 27 novos. Também passaram os **18/18 testes de regressão** do cenário 0.6.0 preservado. A verificação de sintaxe dos módulos passou.

Os novos testes cobrem: fila de efeitos saturada; trajetória anterior/atual; rastro pós-impacto; destino destruído; colisão varrida com terreno; dano único; lançamento de soldado real; término por falta de munição; pausa e reinício; resistência dos novos soldados após melhoria; nove configurações de fase; formações transitáveis; percursos geometricamente distintos; repetição determinística; dificuldade limitada; gerador infinito; conclusão somente na fase 9; migração do progresso; perseguição de sobreviventes; equivalência de resultados a 30/60/120 atualizações por segundo.

## Matriz de partidas completas

`FULL=1 python tests/matrix092.py` executou **39 partidas**, com **34 vitórias e 5 derrotas legítimas**. Nenhuma falhou nas verificações de conservação de tropas, munição, balas resolvidas, recompensas em fila, posições ou condição de vitória.

Foram incluídas as nove fases, sementes 20261108 e 42, estratégias de investimento nas torres, mira central e suporte inicial à frente, além das ondas infinitas 1, 10, 30 e 1.000 em duas sementes e uma partida sem disparos. Não são 39 jogadores humanos nem uma estimativa de taxa de vitória.

Dois exemplos demonstram diferença de decisão:

- Fase 8, semente 20261108: investir imediatamente nas torres perdeu aos 24,467 s; manter a frente no começo e depois investir venceu aos 44,067 s. A mesma estratégia de suporte inicial venceu com semente 42 aos 43,433 s.
- Fase 9, semente 20261108: mirar apenas o centro perdeu aos 50,500 s; investir na bateria e nos reforços venceu aos 57,033 s. Com semente 42, o investimento venceu aos 53,567 s.

As duas tentativas amostradas da onda 1.000 perderam: uma por falta de tropas/cargas, outra por tempo. O gerador executou normalmente; isso não comprova que todas as combinações possíveis estejam balanceadas. Todas as nove fases da campanha tiveram pelo menos uma estratégia vencedora na amostra.

Durante o desenvolvimento, o teste da primeira ponte detectou aliados que seguiam adiante e deixavam invasores dispersos para trás. Foi adicionado retorno para procurar os sobreviventes reais quando restam poucos inimigos; a matriz final usa a correção. Os resultados de ajuste anteriores não são usados como comprovação da versão final.

## Navegador

Chromium **144.0.7559.96**, WebGL por SwiftShader em Xvfb. Cinco viewports aprovados: **360×740, 390×780, 393×852, 844×390 e 1366×768**, com toque emulado nos quatro primeiros.

Em cada execução foram exercitados: seleção, toque e cancelamento quando aplicável, mira, áudio, pausa, reinício, disparo com a fila de efeitos saturada, rastro após impacto, aviso de munição zero, partida completa da fase 1, resultado sem recompensa duplicada, desbloqueio da base, quatro construções, inversão de projeção do toque, invasão da base, coleta, mudança de orientação e retorno ao cerco. Seis visitas repetidas ao Refúgio não criaram buffers novos.

Em 390×780 foram capturados os três novos cenários e verificado `visíveis + fora da câmera = unidades vivas`. O encerramento da campanha na fase 9 usa uma fixture isolada de interface; as vitórias completas da fase 9 estão na matriz independente de combate. O compartilhamento nativo foi substituído por um método instrumentado e não enviou mensagens reais.

Nenhum erro JavaScript ou WebGL foi registrado nas cinco execuções finais. Os testes e capturas usam o código real; trechos de combate foram acelerados pelo gancho de testes, sem alterar as regras. A imagem de estresse dos disparos usa uma fila artificial de 100 partículas para reproduzir a falha; não é uma partida inteira em tempo real.

## Limitações e publicação

A tentativa de navegação HTTP local pelo Chromium retornou `ERR_BLOCKED_BY_ADMINISTRATOR`. A execução gráfica carregou os arquivos de produção em memória. Essa limitação não foi contornada. A confirmação de publicação pelo GitHub Pages é uma verificação separada.

Android físico, iPhone, Safari, armazenamento persistido após recarga em uma origem HTTP real, temperatura e bateria não foram testados nesta rodada. Não houve novo benchmark sustentado de FPS. A correção dos tiros não equivale a uma garantia de fluidez em qualquer aparelho.

As chaves de armazenamento da campanha/infinito e do Refúgio permanecem. A lista de medalhas passa a incluir as fases 7–9. O gerador infinito muda para a versão 2, preservando número de onda, semente e recorde, mas podendo mudar o percurso em relação à versão anterior.

O pacote de evidências contém logs, capturas, matriz final e hashes dos arquivos. Referências técnicas consultadas: MDN WebGL best practices e Window.requestAnimationFrame. Nenhum modelo ou imagem dos anúncios foi incorporado ao jogo.
