# Multidão 0.9.0 — Cerco Relâmpago e Refúgio Secreto

Revisão funcional na branch `feat/v0.9.0-secret-haven`. A versão pública 0.8.0 não é substituída por esta entrega. Base conferida: `a685f4e4a16d80a0a8345ad7d853f70a62325386`.

## Ritmo do cerco

Os inimigos avançam desde o primeiro passo da simulação. Uma vanguarda de até 108 unidades começa dez unidades de caminho após o portão, sem aparecer sobre o jogador. As reservas continuam reais. Os canhões disparam em salvas a cada 0,38 segundo, com espaçamento de 0,075 segundo entre armas e custo individual de munição. Balas contra torres têm velocidade 32 em vez de 19 unidades por segundo. A câmera vertical foi aproximada em 7,5%.

A campanha e o infinito continuam disponíveis. A janela máxima de cada cerco é de 70 segundos. O comandante entra aos 18 segundos ou ao atingir a condição de baixas. A rajada e os multiplicadores são mantidos. Reforços excedentes ficam na fila, não são apagados para melhorar desempenho. O marcador de sequência é visual: não muda secretamente o dano.

## Refúgio Secreto

Destrua três torres ao longo de partidas concluídas para obter os três selos. Pode ser uma partida só ou várias; vitórias e derrotas completas contam. Ao fim da batalha, as moedas são calculadas por abates, torres, vitória e chefe. Uma mesma partida não é premiada duas vezes.

No Refúgio, toque no terreno para mover o comandante. Construa o Salão do Reino, as torres do Poente e do Nascente e a Paliçada. Cada construção tem três níveis. As torres de madeira evoluem para pedra; o salão cresce. Os benefícios são para a defesa da própria base, não alteram o combate principal.

Depois de construir o salão e ao menos uma torre, use DEFENDER A BASE. Arqueiros e comandante disparam flechas com trajetória contra pequenas invasões. Inimigos derrotados deixam ouro; aproxime o comandante para recolher. A vitória dá mais 30 moedas. As construções não podem ser melhoradas durante uma invasão. Recolha o ouro no terreno antes de iniciar a próxima.

Construções, moedas e maior invasão vencida são salvas localmente quando o navegador permite. As tropas e moedas ainda no chão não são um save de batalha: fechar a página pode descartá-las. Abrir a base pausa o cerco. O progresso principal 0.8.0 permanece no mesmo armazenamento; a carteira usa a chave separada `multidao-haven-090`.

Não há dinheiro real, compras, anúncios, sorteios pagos, rede social automática ou economia online. O registro local não é um sistema antifraude para ranking competitivo. Cada recibo recente evita uma recompensa duplicada normal de interface.

## Compartilhamento

O botão de resultado prepara um texto com abates, tempo e moedas. Em navegador compatível tenta abrir o compartilhamento nativo somente após o toque do jogador; caso contrário oferece cópia. Nada é publicado automaticamente. Compatibilidade real de aplicativos de destino não foi validada.

## Executar e verificar

```sh
python -m http.server 8000
npm run check
npm test
python tests/matrix090.py
xvfb-run -a python tests/browser090.py
```

Sem build, backend ou CDN. Os testes de navegador exigem Playwright para Python, Chromium em `/usr/bin/chromium` e Xvfb. O ambiente bloqueou navegação HTTP no Chromium: os testes carregam os arquivos de produção em memória.

Novos módulos: `rush.js`, `rush-view.js`, `haven.js`, `haven-view.js`, `haven-ui.js` e `rush.css`. O motor-base recebe apenas um atraso inicial configurável com padrão de sete segundos para preservar os testes anteriores. O controlador e a página integram o novo modo.

Consulte `TEST_REPORT.md`. Mais rapidez de disparo e batalhas mais curtas não são comprovação de FPS melhor. Android físico, iPhone, Safari e viralidade não foram validados. O visual é procedural e simplificado, não equivalente ao anúncio.
