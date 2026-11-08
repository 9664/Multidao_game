# Multidão — Muralha do Norte 0.6.0

Revisão orientada à cena de neve enviada como referência: câmera próxima, jogo ocupando a tela, três corredores com muros longitudinais, canhão maior e uma horda vermelha compacta no topo. Arte procedural original; sem copiar imagens, modelos ou áudio do anúncio.

## Jogar

Arraste o campo ou a mira. Os disparos são automáticos. A posição de lançamento escolhe uma rota: centro ×20, esquerda ×50, direita ×99. As tropas mantêm essa rota até seu portão, contornando os obstáculos; cada soldado é multiplicado apenas uma vez. Na fase 1 há 4.000 invasores reais, 36 disparos disponíveis, cinco pontos de defesa e limite de 100 segundos.

ÁUDIO controla música, efeitos, volume e vibração visual. HD/LEVE reduz a resolução e o detalhe gráfico, sem alterar a contagem de tropas. Pausa, reinício e próximas fases continuam disponíveis. Preferências de áudio da versão anterior são preservadas no navegador.

## Código e testes

Não exige build, banco ou bibliotecas remotas. `engine.js` simula o combate com passo fixo de 1/30 s; `renderer.js` desenha com WebGL instanciado; `audio.js` mantém o áudio procedural; `app.js` integra os controles e a interface. As reservas distantes continuam sendo unidades reais, mas avançam em formação com processamento simplificado até se aproximarem do confronto.

```sh
python -m http.server 8000
npm run check
npm test
xvfb-run -a python tests/browser_test.py
```

Os testes de navegador usam Playwright para Python e `/usr/bin/chromium`, com SwiftShader em display virtual. Carregam os arquivos de produção em memória; não são testes de aparelhos físicos ou Safari. Consulte `TEST_REPORT.md`.

## Escopo visual

Esta revisão aproxima a composição da cena de neve. Ainda não inclui o cânion, a ponte curva ou as torres numeradas da outra imagem. Os valores ×20/×50/×99 são uma escolha de balanceamento desta versão; não há portão ×999. O acabamento e as animações continuam simplificados. Não é uma reprodução idêntica do anúncio nem uma promessa de 60 FPS em todo celular.

GitHub Pages: branch `main`, pasta raiz, caminhos relativos. Não há login, compras, publicidade, coleta de dados ou service worker.
