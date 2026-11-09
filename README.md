# Multidão 1.0.0 — Ascensão dos Reinos

Versão aprovada pelo usuário para publicação no GitHub Pages em 9 de novembro de 2026, sobre a base 0.9.2 (`2f2a1bfe4837ae08c92bb0b2764cc2a979cfa11d`). Os scripts e estilos de produção são os mesmos do pacote de revisão aprovado.

## Jogar

Antes de iniciar, escolha a doutrina: **Vanguarda** dá +1 de vida aos novos soldados; **Artilharia** dobra o dano contra torres com salvas 20% mais espaçadas; **Enxame** reduz o intervalo das salvas em 18%, com 6 cargas a menos e menos 1 de vida por soldado. A escolha só muda antes da partida.

Durante o cerco, use **Impacto** para bombardear a frente mais próxima ou **Geada** para desacelerar os inimigos atingidos. As habilidades consomem energia e têm recarga. Duas conquistas de abates pausam a batalha para escolher reforços; o efeito vale somente naquela partida.

O comandante recebe experiência e patentes por partidas concluídas. As nove fases, o modo infinito, as moedas e o Refúgio Secreto permanecem. Campanha e base conservam suas chaves de armazenamento; o comando usa `multidao-command-100`. O progresso é local, sem conta ou sincronização entre aparelhos. Limpar os dados do navegador pode apagá-lo.

No celular, arraste no campo ou use a barra de mira. No teclado, as setas movem a bateria, 1 aciona Impacto, 2 aciona Geada e espaço pausa. A qualidade gráfica pode ser AUTO, HD ou LEVE. Não há compras nem envio automático para redes sociais.

## Executar e testar

Não há build, CDN, banco ou dependências de produção.

```sh
python -m http.server 8000
npm run check
npm test
npm run test:legacy
python tests/matrix100.py
CASE=phone390 xvfb-run -a python tests/browser100.py
mkdir -p evidence-v100
node tests/bench100.cjs
```

Os testes gráficos exigem Playwright para Python, Chromium em `/usr/bin/chromium` e Xvfb. Carregam os arquivos reais em memória; não equivalem a um teste em telefone físico ou a navegação no endereço público.

## Implementação e limites

`tactics100.js` implementa doutrinas, habilidades, escolhas, progresso do comandante e busca de vizinhos. `ascension-view100.js` implementa atlas animado e efeitos; `ascension100.css` define a interface. Integrações em `play.js`, `index.html` e `visual091.js`.

Modelos e texturas são procedurais. O ganho medido na revisão é de tempo de simulação em Node, não de FPS no celular. Android físico, iPhone e Safari não foram testados. Não se promete desempenho de 30/60 FPS nem equivalência ao acabamento do anúncio. Veja `TEST_REPORT.md`.

A versão anterior permanece no histórico Git. A confirmação do deploy deve ser consultada no workflow do GitHub Pages associado ao commit desta versão.
