# Multidão 0.9.1 — Cânion em Foco

Revisão do enquadramento e da apresentação visual da versão 0.9.0. Campanha, modo infinito, moedas e Refúgio Secreto permanecem disponíveis, com as mesmas chaves de armazenamento local.

## O que muda

Câmera mais próxima e campo visual com menor profundidade aparente; canhões remodelados, chefe maior, iluminação de armaduras, sombras de contato, paredões facetados, piso e torres azuis com números grandes. O piso continua além da borda inferior da tela, eliminando a aparência de plataforma cortada. A interface ocupa menos área; o reinício fica no botão circular junto à pausa.

No tema de cânion, os mesmos invasores são distribuídos de forma contínua entre a curva e o platô. Não há soldados decorativos contabilizados como combatentes nem recompensas fictícias. A mudança de formação pode mudar o tempo do confronto; dano, munição, recompensas e condições de vitória não foram alterados.

O parâmetro `?stage=2&v=0.9.1` abre o Cânion do Guardião diretamente. Omitir `stage` conserva a seleção salva. As outras fases permanecem acessíveis pelo menu.

## Módulos

- `visual091.js`: geometria, materiais, câmera, sombras e apresentação das unidades.
- `visual091.css`: interface compacta e sinalização das torres.
- `formation091.js`: formação contínua dos inimigos somente no tema cânion.
- `play.js`: âncoras dos rótulos, barra do chefe, botão de reinício e seleção opcional de fase pelo endereço.

O núcleo, os modos e a base secreta são os da 0.9.0. Modelos e texturas continuam procedurais e originais; nenhuma imagem ou modelo do anúncio foi incorporado. O acabamento ainda é simplificado, especialmente nas animações e nos personagens distantes.

## Executar e testar

```sh
python -m http.server 8000
npm test
node --test legacy/north-wall/tests/core.test.cjs
CASE=phone360,phone390,phone393 xvfb-run -a python tests/browser091.py
CASE=landscape,desktop xvfb-run -a python tests/browser091.py
```

Os testes de navegador usam Playwright para Python e Chromium em `/usr/bin/chromium`, com SwiftShader em Xvfb. Consulte `TEST_REPORT.md`. A renderização foi testada com arquivos reais em memória, não em aparelhos físicos. Não há promessa de equivalência ao anúncio ou de 30/60 FPS em todo celular.

GitHub Pages: `main`, raiz. Todos os caminhos continuam relativos, sem build, backend ou CDN.
