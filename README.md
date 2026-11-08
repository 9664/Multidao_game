# Multidão 0.8.0 — Cerco Infinito

Revisão funcional na branch `feat/v0.8.0-endless`. O site público não foi substituído nesta entrega. Base: 0.7.1, commit `aa1c0ea90aa4839357fcfd3b3182021102a1a3bb`.

## Dois modos

**Campanha:** as seis fases originais e suas regras continuam disponíveis.

**Cerco Infinito:** vencer libera a próxima onda, sem um encerramento programado na fase 6. Cada expedição possui uma semente; onda e semente definem o mesmo caminho e configuração, inclusive após uma derrota. Os seis temas aparecem em ordem embaralhada por ciclos. Cada quinta onda é de elite e cada décima é de comandante, com parâmetros de chefe diferentes. São variantes do mesmo modelo-base, não novos personagens de arte exclusivos.

A dificuldade cresce de forma limitada. A quantidade inicial de inimigos não passa de 3.600 e o multiplicador não ultrapassa ×99. O gerador usa inteiros seguros de JavaScript; não se promete um número matematicamente infinito de estados nem exclusividade de todos os mapas. Foram testados índices até 1.000.000 e validação de configuração no limite dos inteiros seguros.

**Retomar** reinicia a onda salva, não restaura tropas no meio do combate. O recorde registra a maior onda vencida. **Nova expedição** troca a semente e volta à primeira onda, mantendo o recorde e as medalhas da campanha. O salvamento é local, sem conta, ranking online ou sincronização. Há migração do progresso 0.7.1 e aviso quando o armazenamento não está disponível.

## Visual e desempenho

Novos canhões, armaduras, capacetes, chefe, iluminação, detalhes do piso e menus. Movimento interpolado entre os passos fixos da simulação. Tropas próximas usam modelos 3D; tropas distantes usam cartões texturizados de dois triângulos, um por unidade viva. A textura é criada proceduralmente, sem baixar imagens. É simplificação visual, não um exército fictício ou um contador inflado.

Buffers de instâncias são reutilizados. A amostragem da estrada usa busca indexada mantendo as regras de colisão. AUTO reduz resolução sob carga; HD e LEVE continuam disponíveis. Para impedir acúmulo de trabalho, o loop processa no máximo três passos de simulação por quadro. Se o dispositivo atrasar mais de 100 ms, a partida desacelera em relação ao relógio real; esse tempo descartado é instrumentado.

No modo infinito, a geração de reforços aguarda em fila quando a frente está saturada. A fila permanece separada dos aliados vivos. Não se eliminam soldados para melhorar FPS.

## Executar

Sem dependências de produção, build, CDN ou backend:

```sh
python -m http.server 8000
npm run check
npm test
npm run test:legacy
python tests/matrix080.py
xvfb-run -a python tests/browser080.py
```

Os testes gráficos exigem Playwright para Python, Chromium em `/usr/bin/chromium` e Xvfb. Os arquivos são carregados em memória no ambiente de testes. `legacy/campaign-071` preserva a base do comparativo; `legacy/north-wall` mantém a versão 0.6.0.

O pacote da conversa também fornece um HTML único, com os mesmos scripts e estilos embutidos, para teste local. Não existe nova URL publicada para 0.8.0 nesta revisão.

## Limitações de liberação

O comparativo por software melhorou, mas ficou abaixo de 30 FPS na cena pesada. Android físico, iPhone e Safari não foram testados. Não anunciar garantia de fluidez, equivalência visual ao anúncio ou validação de aparelho. Detalhes e métodos estão em `TEST_REPORT.md`.

Referência técnica consultada: MDN, WebGL best practices — https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
