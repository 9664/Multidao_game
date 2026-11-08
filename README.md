# Multidão 0.7.0 — Cerco do Cânion

**Versão funcional para revisão na branch `feat/v0.7.0-canyon`. Não publicada no GitHub Pages.** Base preservada: v0.6.0, commit `9f0bc11179645a36ec6288bbb8a8f6dd3e57ab95`.

## Jogar

Inicie o cerco e arraste a bateria ou use a barra inferior. No centro, cada tiro lança um soldado que atravessa o portão ×50. Mire na torre esquerda para conquistar um canhão adicional; na direita, para receber 99 soldados. As torres também podem ser selecionadas pelo botão sobre a estrutura.

A partida começa com 4.000 invasores, um canhão, 90 cargas individuais e cinco pontos de defesa. Duas torres de melhoria permitem chegar a três canhões. Cada arma efetivamente dispara e consome uma carga; salvas são escalonadas. A torre de reforços entrega 99 soldados depois do multiplicador, sem multiplicação adicional. Recompensas em espera aparecem separadamente dos aliados presentes.

O Guardião do Desfiladeiro entra aos 30 segundos ou após 45% das baixas da horda. Sua vida é real: 600 pontos iniciais. O golpe é anunciado com área no chão e contagem regressiva. Para vencer, é preciso eliminar a horda e o Guardião sem perder a defesa. Limite: 90 segundos.

ÁUDIO permite ajustar música, efeitos, volume e vibração visual. HD/LEVE só altera gráficos. Pausar ou ocultar a aba interrompe simulação e áudio. A fase anterior continua disponível em `legacy/north-wall/index.html`.

## Executar localmente

Não há dependências de produção, build, CDN, backend ou conta de usuário.

```sh
python -m http.server 8000
# Abra http://localhost:8000 no navegador.
npm run check
npm test
npm run test:legacy
python tests/matrix.py
```

Testes gráficos exigem Python com Playwright, Chromium e Xvfb. Os scripts usam `/usr/bin/chromium`; ajuste esse caminho ao seu ambiente. Para gravar vídeo, instale também o componente FFmpeg do Playwright (`playwright install ffmpeg`) ou configure seu equivalente local.

```sh
xvfb-run -a python tests/browser_test.py
xvfb-run -a python tests/audio_test.py
xvfb-run -a python tests/record_session.py
```

O carregador de testes usa os arquivos reais em memória, pois este ambiente bloqueou navegação HTTP no Chromium. Isso não equivale a testar o site publicado nem um celular físico. Leia `TEST_REPORT.md`.

## Estrutura

- `levels.js`: parâmetros explícitos e fixos de balanceamento.
- `navigation.js`: estrada em S compartilhada por piso, parapeitos, movimento, alcance e passagem pelo portão.
- `engine.js`: simulação a 30 passos por segundo, filas de geração, tiros, torres, combate, chefe e invariantes.
- `renderer.js`: WebGL instanciado; cânion, torres, bateria, tropas, chefe e efeitos procedurais originais.
- `audio.js`: áudio procedural orientado a eventos da simulação, sem arquivos externos licenciados.
- `app.js` / `index.html`: toque, interface, acessibilidade básica, preferências locais e ciclo de vida.
- `legacy/north-wall/`: snapshot completo da versão 0.6.0, sem modificar suas regras.
- `tests/`: lógica, estratégias, interface, áudio e gravação contínua.

## Estado de revisão

Os resultados reais estão em `TEST_REPORT.md`; os logs e capturas estão no pacote de evidências. Funcionalidade foi verificada, mas a meta de desempenho em aparelho ainda não foi aprovada. A captura com SwiftShader ficou abaixo de 30 quadros/s. Android físico, iPhone e Safari não foram testados. Não tratar aprovação dos testes lógicos como aprovação visual definitiva ou garantia de fluidez.

O vídeo é uma captura contínua, sem acelerar a simulação, mas sem faixa sonora capturada pelo Playwright. O áudio do jogo foi testado separadamente. A arte permanece estilizada e simplificada; não é uma cópia idêntica do anúncio. A câmera mantém o enquadramento com tremor opcional limitado; não foi adicionado zoom cinematográfico.

Não fazer merge em `main` nem alterar GitHub Pages sem autorização específica. Não há serviços pagos, analytics, compras, login ou coleta de dados.
