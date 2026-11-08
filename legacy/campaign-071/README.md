# Multidão 0.7.1 — Campanha dos Reinos

Evolução da 0.7.0, autorizada para publicação no GitHub Pages. Seis cenários selecionáveis, progressão em sequência, medalhas e melhor tempo salvos localmente, rajada temporária e renderização adaptativa.

## As seis fases

| Fase | Cenário | Invasores | Portão | Chefe / vida |
|---|---|---:|---:|---|
| 1 | Ponte da Aurora, sobre o mar | 1.200 | ×30 | Sentinela das Marés / 280 |
| 2 | Cânion do Guardião, estrada em S | 2.200 | ×50 | Guardião do Desfiladeiro / 480 |
| 3 | Muralha de Gelo, passagem reta na neve | 2.800 | ×99 | Colosso do Inverno / 700 |
| 4 | Desfiladeiro Dourado, curvas invertidas | 2.300 | ×50 | Marechal das Dunas / 550 |
| 5 | Forja Vulcânica, ponte sobre lava | 3.200 | ×75 | Titã da Forja / 850 |
| 6 | Fortaleza Boreal, cerco final | 4.000 | ×99 | Rei da Tempestade / 1.100 |

Escolha uma fase pelo botão FASES ou avance após vencer. As fases são acessíveis sem bloqueio para testes. Os chefes têm variações de cor, vida e parâmetros de ataque, mas compartilham o mesmo modelo-base de cavaleiro; não são seis personagens de arte inteiramente diferentes.

Mire no centro para lançar soldados ou nas torres para obter mais canhões e reforços. A bateria chega a três armas. A rajada dura três segundos, tem recarga de 16 segundos e não concede munição: cada tiro consome uma carga. O som começa após o toque de início. Abrir ajustes ou fases pausa a partida. Medalhas e preferências ficam no navegador, sem conta ou envio de dados; limpar o armazenamento apaga esse progresso.

## Implementação

O núcleo revisado 0.7.0 continua em `engine.js`, `navigation.js`, `levels.js` e `renderer.js`; seus números internos de versão foram mantidos para regressão. `campaign.js` acrescenta seis configurações e a habilidade de rajada; `campaign-renderer.js` implementa os cenários e modelos de distância; `play.js` e `campaign.css` são a interface da versão pública 0.7.1. `index.html` carrega somente os módulos necessários, com URLs versionadas.

A redução de detalhe e o descarte visual de personagens fora do enquadramento não removem combatentes da simulação. O modo AUTO reduz a resolução ao detectar intervalos de desenho elevados; também há HD e LEVE. Não há garantia de 30 FPS em qualquer telefone. Consulte `TEST_REPORT.md` para escopo e limitações.

## Executar e testar

```sh
python -m http.server 8000
npm run check
npm test
npm run test:legacy
python tests/matrix071.py
xvfb-run -a python tests/browser071.py
```

Os testes gráficos exigem Playwright para Python, Chromium em `/usr/bin/chromium` e Xvfb. Carregam os arquivos reais em memória; não são testes em telefone físico. O projeto não exige build, backend, dependências de execução ou CDN.

GitHub Pages: branch `main`, raiz. O cenário 0.6.0 permanece em `legacy/north-wall/`; a revisão 0.7.0 também está preservada no histórico. A arte continua procedural e simplificada em relação ao anúncio de referência.
