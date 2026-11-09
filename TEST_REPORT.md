# Validação 0.9.0 — Cerco Relâmpago e Refúgio Secreto

Revisão executada sobre a base 0.8.0 do commit `a685f4e4a16d80a0a8345ad7d853f70a62325386`. Os cinco arquivos-base inspecionados foram conferidos por SHA de blob. Não há publicação ou alteração em `main` nesta entrega.

## Lógica

**66/66 testes aprovados**: 48 testes anteriores e 18 novos. Comando: `node --test tests/core.test.cjs tests/campaign.test.cjs tests/endless.test.cjs tests/rush-haven.test.cjs`.

Cobertura nova: início imediato dos inimigos; três disparos cobrados no primeiro segundo; posição transitável da vanguarda; pausa; recibo de recompensa idempotente; moedas em vitórias e derrotas; bloqueio da base sem selos; custos e ordem das construções; limite de nível; coleta única de cada moeda; flechas com tempo de viagem; vitória da base e prêmio único; proibição de melhorar durante a invasão; saneamento de dados e falha de armazenamento.

## Partidas de campanha e infinito

`tests/matrix090.py`: **14 partidas completas**, seis fases com sementes 20261108 e 42 usando investimento nas torres, mais duas partidas mirando somente o centro. Todas venceram nas estratégias testadas e passaram nas verificações de tropas, munição e posições.

Com investimento nas torres, os primeiros golpes ocorreram entre **3,433 e 3,933 segundos** de simulação. As conclusões ficaram entre **20,200 e 34,933 segundos**. Não são tempos de CPU nem previsões para jogadores humanos.

| Fase | Conclusão nas duas sementes |
|---|---|
| 1 | 20,200–20,333 s |
| 2 | 26,033–26,167 s |
| 3 | 28,467–28,533 s |
| 4 | 25,067–25,133 s |
| 5 | 30,767 s |
| 6 | 34,767–34,933 s |

Três execuções adicionais do modo infinito, ondas 1, 10 e 1.000, terminaram em vitória em 20,633, 23,933 e 31,000 segundos, respectivamente. A geração de reforços continua contabilizando tropas pendentes separadamente. A vitória pode encerrar o cerco com reforços ainda na fila: eles não são apresentados como soldados já existentes no campo.

Essas amostras demonstram funcionamento e ritmo mais rápido; não comprovam balanceamento difícil, taxa de retenção, potencial de viralização ou taxa real de vitória. As duas estratégias avaliadas venceram; recomenda-se avaliação humana antes de aumentar dificuldade.

## Navegador e base secreta

Chromium 144.0.7559.96, SwiftShader e Xvfb. Cinco tamanhos: 360×740, 390×780, 393×852, 844×390 e 1366×768. Toque emulado nos quatro primeiros.

Em cada configuração: partida completa pela mesma simulação, moeda/seletor desbloqueado no resultado, quatro construções, toque no terreno com projeção invertida, invasão da base, pausa, vitória, coleta, rotação e retorno ao cerco. O recibo não foi duplicado ao reapresentar o resultado. Seis visitas adicionais ao Refúgio não criaram novos buffers: o cenário e o contexto WebGL são reutilizados. Nenhum erro JavaScript ou WebGL nas cinco execuções finais.

O compartilhamento foi testado com um substituto instrumentado de `navigator.share`: nenhuma chamada antes do botão e uma chamada após o clique. Nenhuma mensagem foi enviada a um aplicativo real. Os testes não validam a integração com WhatsApp, Instagram ou outro destino.

Trechos foram acelerados pelo gancho de testes, mantendo as mesmas regras de combate. As capturas são renderizações do código testado, não imagens conceituais.

## Limitações

A navegação no endereço local pelo Chromium retornou `ERR_BLOCKED_BY_ADMINISTRATOR`. Os testes executaram os arquivos de produção em memória, sem contornar o bloqueio. Persistência foi verificada como módulo com armazenamento simulado; recarga em uma origem HTTP real não foi validada. O aviso de salvamento indisponível aparece nas capturas desse ambiente.

Não houve teste em Android físico, iPhone, Safari, benchmark novo de FPS, medição de temperatura ou avaliação sonora em alto-falantes. Esta versão acelera as regras e acrescenta uma base; não é uma certificação de fluidez. O acabamento segue simplificado e original, sem modelos do anúncio.

Moedas e construções persistem quando o armazenamento local está disponível. Moedas não recolhidas e estado transitório da invasão não persistem após fechar a página. Não há proteção contra adulteração deliberada de um save local.

Logs, matriz, capturas e hashes estão em `evidence-v090` no pacote entregue. Os módulos de produção são compatíveis com GitHub Pages, mas esta entrega permanece em branch de revisão.
