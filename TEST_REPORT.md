# Validação da versão 0.4.0

Data: 8 de novembro de 2026.

## Simulação — 12/12 testes aprovados

Comando: `node --test tests/core.test.cjs`.

Cobertura: disparo e consumo de carga; multiplicação exata e prevenção de multiplicação repetida; colisão sem atravessar muros; partidas completas com três posições de mira; conservação de contadores; derrota por invasões sem disparos; pausa; reinício; fase espelhada; equivalência de simulação a 30/60/120 atualizações de tela; mudanças rápidas de mira.

Nas três partidas completas da fase 1, os 80 inimigos foram eliminados e nenhum personagem entrou na área sólida de um muro. O teste sem disparos terminou com derrota após três invasões.

## Navegador — cinco configurações aprovadas

Chromium 144, WebGL via SwiftShader, janela em display virtual. Viewports: 360×740, 390×780, 393×852, 844×390 e 1366×768. Toque emulado nas quatro primeiras configurações; teclado na última.

Verificados: criação real do contexto WebGL; renderização sem erros GL; arrasto/toque; enquadramento de canhão e tropas; ausência de rolagem horizontal; pausa e retomada; modo LEVE; reinício; contagem real de inimigos; combate, vitória e passagem à fase 2. Seis reinícios em cada configuração criaram e liberaram seis buffers de cenário, sem acúmulo desses buffers. Nenhum erro JavaScript foi registrado nas cinco execuções.

A partida padrão eliminou os 80 inimigos em 11,417 segundos de simulação. Parte do tempo foi acelerada pelo mecanismo de testes, executando a mesma simulação, sem mudar as regras. O teste adicional com WebGL indisponível exibiu a mensagem de recuperação em vez de tela vazia.

## Escopo e limitações

Os arquivos de produção foram carregados em memória no navegador de testes. Não houve navegação no endereço público dentro desse navegador, pois o ambiente bloqueia navegação externa. Não foi medido FPS em hardware de celular. Android físico, iPhone físico e Safari não foram testados. Publicação GitHub Pages deve ser conferida separadamente após o commit.
