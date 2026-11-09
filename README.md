# Multidão 0.9.2 — Impacto e Variedade

Atualização solicitada para publicação no GitHub Pages, baseada no commit `40122b9bfa2c407c50e993f652620087501c68c0`. Mantém campanha, modo infinito, moedas e Refúgio Secreto.

## Disparos

Foi reproduzido um problema concreto na versão anterior: 100 efeitos de impacto preenchiam a fila e podiam impedir o clarão do canhão, mesmo com um tiro real disparado. As balas contra torres também completavam o trajeto em cerca de cinco passos de simulação (0,167 s), podendo passar entre quadros lentos.

A nova versão reserva prioridade para o clarão, registra trajetória anterior/atual, desenha rastros curtos independentes da fila de impactos e mantém uma breve marca visual após o contato. Esses efeitos não aplicam dano. Cada bala termina explicitamente em impacto, terreno ou ponto de destino vazio. Uma torre já destruída não concede outra recompensa.

A munição continua limitada e cada tiro consome uma carga. Agora há um aviso de últimas cargas e de **SEM CARGAS — TROPAS CONTINUAM LUTANDO**, distinguindo uma pausa legítima dos disparos de uma falha visual. O rastro respeita a profundidade da cena; não atravessa estruturas para simular acertos.

## Nove fases e mais formatos

As seis fases existentes permanecem; a Ponte da Aurora passa a usar uma ponte suspensa. Entram:

| Fase | Nome | Percurso | Formação inicial |
|---|---|---|---|
| 7 | Ruínas da Floresta | Clareiras alternadas e passagens entre ruínas | Pelotões alternados |
| 8 | Bastiões da Cidadela | Três pátios ligados por gargalos | Duas colunas |
| 9 | Passarelas do Porto | Cotovelos alternados sobre o mar | Centro e flancos |

O conjunto de formações inclui bloco compacto, serpente, cunha, duas colunas, pelotões e flancos. Os caminhos são descritos pela mesma geometria usada no piso e no movimento. Não há bifurcação com controle de duas rotas nem espiral nesta entrega.

O modo infinito também usa os novos formatos, com gerador determinístico de versão 2. As sementes, o recorde e o número da onda salva são preservados, mas os percursos gerados podem diferir dos da 0.9.1. Tentar novamente na 0.9.2 repete a configuração sem ajuste oculto após derrotas.

## Dificuldade explícita

A resistência, a cadência e a proporção de elites aumentam. Couraçados são bronze/dourados, têm três pontos de vida adicionais e se movem mais devagar; batedores avançam mais rápido. Nas fases iniciais o soldado vermelho regular tem 2 HP; nas finais pode chegar a 10 HP. Esses valores têm limites no infinito.

Cada melhoria da bateria também protege **novos** soldados: 3 HP com um canhão, 4 com dois e 5 com três. Não há alteração retroativa em unidades que já estavam no campo. A descrição inicial explica o benefício. As formações mudam o risco de investir cedo: nos bastiões é importante sustentar a frente antes das melhorias.

Quando restam poucos invasores, aliados podem voltar para enfrentar sobreviventes reais, em vez de caminhar até o fim deixando inimigos para trás. O alcance continua limitado pela distância no caminho.

## Execução

```sh
python -m http.server 8000
npm run check
npm test
npm run test:legacy
FULL=1 python tests/matrix092.py
CASE=phone360,phone390,phone393 xvfb-run -a python tests/browser092.py
CASE=landscape,desktop xvfb-run -a python tests/browser092.py
```

Sem build, banco, CDN ou dependências de produção. Testes de navegador usam Playwright para Python, `/usr/bin/chromium` e Xvfb. Neste ambiente os arquivos de produção foram carregados em memória porque a navegação HTTP foi bloqueada pelo Chromium.

Módulos novos: `routes092.js`, `impact092.js`, `impact092-view.js` e `impact092.css`. A página carrega esses módulos após os anteriores. `?stage=7&v=0.9.2` seleciona diretamente a floresta; `stage=8` abre os bastiões e `stage=9` as passarelas. Sem parâmetro, a seleção salva é respeitada.

Veja `TEST_REPORT.md` para resultados reais. Não há teste físico Android/iPhone/Safari nem nova promessa de FPS. O compartilhamento continua dependente de um toque e não envia conteúdo automaticamente.
