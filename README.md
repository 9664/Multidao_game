# Multidão — Grande Cerco 0.5.0

Jogo medieval 3D para navegador, com centenas de combatentes reais, multiplicadores, navegação entre muralhas e trilha procedural. Evolução da versão 0.4.0, sem usar imagens ou áudio do anúncio de referência.

## Jogar

Abra o site e toque em **COMEÇAR O GRANDE CERCO**. Arraste o campo ou a barra inferior para mover o canhão; ele dispara automaticamente. Na primeira fase há 720 invasores, 80 cargas e até 120 segundos. Portões ×2/×5 e ×3/×4 multiplicam cada soldado uma vez por fileira. Uma passagem ×5 seguida de ×4 gera 20 soldados reais, não apenas uma alteração no contador.

A horda fica em formação por seis segundos, avança e entra em combate. A partida termina ao eliminar os invasores, perder cinco pontos de defesa, ficar sem tropas e cargas, ou esgotar o tempo. As fases seguintes alternam o cenário e aumentam a tropa inimiga até 960.

**ÁUDIO** abre controles independentes de música, efeitos, volume geral e vibração visual da câmera. **HD/LEVE** altera a resolução e o detalhe das tropas. Pausar também interrompe o áudio. Ao trocar de aba, a partida é pausada. Preferências são guardadas somente no navegador, quando o armazenamento local está disponível.

## Arquitetura

- `engine.js`: simulação determinística a 60 passos por segundo, navegação por campo de distâncias e busca espacial de adversários.
- `renderer.js`: WebGL instanciado, perspectiva fixa, modelos próximos/distantes, geometria procedural e efeitos.
- `audio.js`: sons de canhão, multiplicação, passos, impactos, tambores, metais e fanfarra, criados com Web Audio. Sem arquivos externos de áudio.
- `app.js`: toque, teclado, mira, pausa, resultados, configurações e ciclo de áudio.
- `index.html`: interface responsiva, com scripts locais versionados.

## Executar e verificar

Sem build ou dependências de produção:

```sh
python -m http.server 8000
npm run check
npm test
```

Os testes gráficos exigem Python com Playwright, Chromium e Xvfb:

```sh
xvfb-run -a python tests/browser_test.py
```

Por padrão, os testes carregam os arquivos em memória: o ambiente de desenvolvimento bloqueia a navegação HTTP do navegador. Isso não equivale a testar um telefone físico ou a navegar no site público. Consulte `TEST_REPORT.md`.

## Hospedagem e limites

GitHub Pages: branch `main`, raiz. Todos os caminhos são relativos, compatíveis com `/Multidao_game/`. Não há CDN, banco de dados, login, anúncios, compras ou coleta de dados. Não há service worker.

O visual é low-poly. Milhares de unidades e 60 FPS em qualquer aparelho não são prometidos. Desempenho e som nos alto-falantes de Android/iPhone físicos, além de Safari, ainda precisam de validação. O botão LEVE reduz a carga gráfica sem inventar nem remover combatentes.

Referências técnicas: documentação MDN de Web Audio (`https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices`) e ANGLE instancing (`https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays`).
