# Validação 0.6.0 — 8 de novembro de 2026

## Lógica: 18 testes aprovados

Comando executado: `node --test tests/core.test.cjs`. Resultado: 18 passaram, zero falhas, aproximadamente 15,25 segundos no ambiente de testes.

Testes de disparo único confirmaram: rota central gera 20 soldados, esquerda 50 e direita 99, sem nova multiplicação dos clones. Foram verificados colisões, posições finitas, conservação dos contadores, limites de munição, pausa, reinício, mudança de mira, tempo máximo e equivalência entre atualizações de tela a 30/60/120 Hz.

Partidas determinísticas da fase 1, com 4.000 invasores e mira fixa:

- Esquerda: vitória em 46,433 segundos de simulação, 4.000 abates e zero invasões.
- Centro: derrota em 37 segundos, 1.042 abates, sem tropas nem cargas restantes.
- Direita: vitória em 30,333 segundos, 4.000 abates, zero invasões e pico de 4.337 unidades simultâneas.

Esses resultados descrevem as sementes e estratégias testadas, não garantem vitória em qualquer partida. O cenário sem disparos terminou por invasões reais da defesa.

## Navegador: quatro configurações aprovadas

Chromium 144.0.7559.96 com WebGL por SwiftShader e display virtual: 390×780, 360×740, 844×390 e 1366×768. Toque emulado nas três primeiras; teclado na última.

Verificados: inicialização, enquadramento de canhão/frente/portões, ausência de rolagem horizontal, controles por toque/teclado, pausa e retomada, ativação e suspensão do áudio, configurações independentes de música/efeitos, volume, redução de movimento, HD/LEVE, contadores reais e combate. A configuração 390×780 também completou a vitória e avançou à fase 2. Quatro reinícios criaram e liberaram quatro buffers de cenário.

Nenhum erro JavaScript ou WebGL foi registrado nessas execuções. A quantidade de personagens enviados ao renderizador correspondeu às unidades vivas, com no máximo sete chamadas de desenho nos cenários verificados. Também passaram os casos de WebGL indisponível, com mensagem de recuperação, e áudio indisponível, mantendo o jogo utilizável.

## Limitações

Os arquivos de produção foram carregados em memória no navegador. Partes da simulação foram aceleradas com as mesmas regras do jogo. Android físico, iPhone físico, Safari, qualidade sonora nos alto-falantes de celulares e FPS em hardware móvel não foram testados. Publicação no GitHub Pages é uma verificação separada. As capturas são do jogo efetivamente renderizado, não imagens conceituais.
