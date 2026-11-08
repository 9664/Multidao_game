# Validação 0.7.0 — Cerco do Cânion

Data: 8 de novembro de 2026. Estado: **revisão funcional; publicação e aprovação de desempenho pendentes**. Branch: `feat/v0.7.0-canyon`. Base: `9f0bc11179645a36ec6288bbb8a8f6dd3e57ab95`.

## Execuções reais

A suíte original 0.6.0 passou antes das alterações (18/18). O snapshot preservado em `legacy/north-wall` foi testado novamente ao final: **18/18**, zero falhas, 14,78 s. Os seis arquivos JavaScript da nova versão passaram em `node --check`.

A nova suíte `node --test tests/core.test.cjs` passou com **22/22 testes**, zero falhas, 123,47 ms. Cobertura: geometria compartilhada; proteção contra ataques através de curvas; portão orientado ×50; multiplicação única; filas sem perda; recompensa de torre única; limite de três canhões; 99 reforços marcados depois do portão; balas com trajetória; custos de salva; chefe pendente impedindo vitória; preparação e dano único por golpe; dano real no chefe; derrota prevalecendo na morte simultânea; pausa; reset; equivalência 30/60/120 Hz; timeout; eventos e efeitos limitados.

## Matriz completa de partidas

`python tests/matrix.py` executou **20 sementes distintas (1001–1020)**, com quatro estratégias distribuídas entre elas. A matriz final levou 242,74 s de execução, com três processos concorrentes. Os tempos abaixo são de simulação, não de CPU.

| Estratégia | Partidas | Vitórias | Resultado e duração |
|---|---:|---:|---|
| Somente centro | 5 | 0 | Derrota legítima em 61,033–61,533 s |
| Melhorar até três canhões, depois centro | 5 | 5 | Vitória em 46,133–47,400 s |
| Obter 99 reforços, melhorar bateria, depois centro | 5 | 5 | Vitória em 53,833–54,300 s |
| Alternar torres por 28 s, depois centro | 5 | 0 | Derrota legítima em 67,067–68,400 s |

Todas as partidas verificaram conservação de aliados, inimigos, tiros, munição e filas, além de posições transitáveis, proteção de torres e condições de vitória. Nenhuma falhou nas invariantes. Essas 20 execuções não são 20 sementes para cada estratégia nem uma estimativa estatística da taxa de vitória de jogadores humanos. As regras não mudam secretamente conforme o jogador perde.

## Navegador e recursos

Chromium **144.0.7559.96**, Linux, display virtual Xvfb, WebGL por **SwiftShader**. Viewports: **360×740, 390×780, 393×852, 844×390 e 1366×768**; toque emulado nos quatro primeiros. Todos passaram; sem erro JavaScript ou WebGL nas execuções registradas.

Foram verificados arrasto e cancelamento de toque, teclado, barra de mira, orientação, ausência de rolagem horizontal, projeção da mira sob tremor de câmera, pausa/retomada, volume zero, música/efeitos independentes, redução de movimento, HD/LEVE, combate e contadores reais. Um problema inicial de enquadramento em paisagem foi corrigido e a suíte inteira foi executada novamente.

Dez reinícios em cada viewport criaram **10 buffers de cenário e liberaram 10**, mantendo o mesmo contexto de áudio e zero vozes remanescentes após os resets. Isso verifica os recursos instrumentados, não constitui prova de ausência de qualquer vazamento possível. A perda de contexto WebGL foi exercitada pela extensão de teste do navegador. A troca de aba foi simulada via `visibilitychange`, não pelo sistema operacional de um telefone.

WebGL indisponível exibiu recuperação explícita. Áudio indisponível manteve o jogo utilizável.

## Gravação contínua de uma partida

`tests/record_session.py` gravou a tela **390×780** sem cortes e sem acelerar a simulação. A automação apenas alterou a barra de mira visível segundo estados observados: segundo canhão → 99 reforços → terceiro canhão → rota central. A gravação não usou `advance()`.

Resultado: **vitória aos 50,267 s de simulação**, em cerca de **54,27 s reais até a detecção do resultado**. A gravação inclui abertura e retenção adicional da tela final. Foram registrados:

- 4.000 inimigos eliminados, nenhuma invasão, defesa 5/5.
- Três canhões, 90 tiros individuais: 64 soldados e 26 balas contra torres.
- 3.136 clones gerados, 99 reforços recebidos, nenhuma unidade pendente no resultado.
- Chefe com 600 de dano real recebido, derrotado após executar três golpes de área.
- Pico de 4.596 unidades vivas; 737 aliados sobreviventes.

O arquivo MP4 é uma conversão do vídeo WebM, sem montagem nem alteração de velocidade. **A captura de vídeo é silenciosa**: o Playwright não gravou a saída sonora. Não confundir isso com ausência de áudio no jogo.

## Áudio

O áudio procedural de produção foi exercitado em contexto real de navegador e também renderizado em `OfflineAudioContext`. Verificou-se que consumir o mesmo evento duas vezes não duplica o som e que suspender encerra e desconecta as vozes.

A amostra de seis segundos, 48 kHz, apresentou pico normalizado **0,18028**, RMS **0,01062** e máximo de **27 vozes**, abaixo do limite de 40, sem clipping nessa amostra. Isso comprova geração de sinal, não avaliação auditiva humana em alto-falantes de vários celulares. Na partida contínua, os eventos de entrada do chefe e resultado também foram consumidos pelo áudio.

## Desempenho: ressalva de liberação

A meta de **30 FPS sustentados em um aparelho de referência não foi validada**. Na captura por software, os intervalos RAF registrados tiveram p50 aproximadamente **150 ms**, p95 **333,3 ms** e p99 **370,1 ms**. O trecho apresentou lentidão; esse resultado não autoriza afirmar fluidez. A série inclui captura de tela, software WebGL e retenção final, e não representa benchmark de GPU móvel.

O contador suavizado `frameMs` na tela final não foi usado como prova de desempenho de combate. A publicação deve continuar pendente até revisão visual e medição em hardware real, com possibilidade de otimização adicional. Android físico, iPhone, Safari, contexto térmico e p95/p99 de um telefone não foram medidos.

## HTTP e limites do ambiente

Os sete arquivos de produção responderam **HTTP 200** no servidor local, com bytes e SHA-256 iguais aos arquivos testados. A navegação pelo Chromium, inclusive para localhost, foi bloqueada com `ERR_BLOCKED_BY_ADMINISTRATOR`. Por isso, a suíte gráfica e a gravação carregaram os arquivos de produção em memória.

Essas são verificações distintas: GET HTTP local aprovado; execução em memória aprovada; navegação HTTP no navegador bloqueada; site público da nova versão não publicado; aparelho físico não testado. Não foi iniciada uma execução separada no serviço Codex. Implementação e testes foram executados neste ambiente.

## Rastreabilidade e pendências

`browser-tests.json` e `continuous-play.json` registram SHA-256 dos sete arquivos de produção. Cada resultado da matriz final contém o SHA-256 do motor. O pacote inclui fontes, testes, logs, capturas e vídeo para revisão.

Permanecem pendentes: avaliação do usuário sobre composição e ritmo; teste físico e otimização de desempenho; acabamento visual e sonoro mais refinado. Foi implementado tremor opcional limitado, mas não zoom cinematográfico. A arte é procedural/low-poly e não pretende ser idêntica ao anúncio. Nenhuma alteração em `main` ou publicação no Pages faz parte desta entrega.
