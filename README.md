# Multidão — Cerco Medieval 0.4.0

Jogo web 3D para celular, publicado por GitHub Pages. Arte procedural original; sem imagens do anúncio de referência. Não exige build, backend, chave de API ou CDN.

## Como jogar

Abra `index.html` por um servidor HTTP, inicie o cerco e arraste o campo ou o controle de mira. O canhão dispara soldados automaticamente. Cada soldado atravessa no máximo um multiplicador de cada fileira. As tropas contornam os muros, procuram adversários e causam dano em combate. A fase termina com a derrota de todos os invasores, três invasões da defesa ou 90 segundos. Há 60 cargas por fase; pausa, reinício, próxima fase, som opcional e modo LEVE.

## Estrutura

- `engine.js`: simulação determinística de 60 passos/segundo, navegação por campo de distâncias, colisões, multiplicadores e combate. Independente do navegador.
- `renderer.js`: renderização WebGL, geometria medieval procedural e instanciamento de personagens. Câmera fixa e enquadramento responsivo.
- `app.js`: controle por toque, mouse, teclado e slider; HUD, pausa, áudio e recuperação de erros.
- `index.html`: interface e carregamento dos três arquivos locais, com identificação de versão.
- `tests/`: testes reproduzíveis de lógica e navegador.

## Executar e testar

```sh
python -m http.server 8000
node --test tests/core.test.cjs
```

Abra `http://localhost:8000`. Para os testes de navegador, instale Playwright para Python e Chromium; o script usa `/usr/bin/chromium`. Em Linux sem interface gráfica:

```sh
xvfb-run -a python tests/browser_test.py
```

Os testes de navegador carregam os arquivos reais em memória, usam Chromium com WebGL por SwiftShader e emulam tamanhos de tela/toque. Não são testes em aparelho Android/iPhone físico nem em Safari. Consulte `TEST_REPORT.md`.

## Publicação

GitHub Pages: branch `main`, pasta raiz. O site usa caminhos relativos compatíveis com `/Multidao_game/`. Atualize a versão no motor, HTML e URLs de scripts ao alterar uma versão publicada. Não há service worker nesta versão.

## Limites conhecidos

O visual é low-poly e o balanceamento ainda é de protótipo. Desempenho em aparelhos reais e compatibilidade com Safari/iOS ainda precisam de validação. O modo LEVE reduz a resolução de renderização. O jogo não coleta dados e não possui ranking online, login ou compras.
