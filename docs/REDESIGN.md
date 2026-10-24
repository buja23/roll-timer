# Redesign e temporizador — versão 1.2.0

Registro da etapa anterior. A atualização solicitada como **1.1.0 / código Android 4** substitui a fonte alongada, acrescenta áudio por evento e abre o treino na horizontal. Consulte [V1.1.0.md](V1.1.0.md) para o comportamento e a validação atuais. As capturas em `redesign/` foram atualizadas para essa nova entrega.

## Resultado

O temporizador usa uma superfície inteira por etapa: preparar `#FACC15` com números pretos, luta `#9AFF3D` com números pretos e descanso `#EF3128` com números brancos. Pausar conserva o fundo, acrescenta “PAUSADO” à etapa e troca pausa por reprodução. A conclusão retorna à identidade escura.

O cabeçalho contém voltar, rodada, ciclo quando necessário e rotação. Na horizontal com espaço suficiente, a etapa fica no próprio cabeçalho. Na vertical, aparece acima do relógio. O tempo fica diretamente sobre o fundo, seguido de uma barra de progresso de 3 dp e dois controles com ícones: reinício e pausa/retomada. A interface não oferece avanço manual nem menu de controles.

Voltar, inclusive pelo comando Android, pede confirmação para encerrar. Cancelar conserva a sessão. Confirmar executa `stop` e volta ao início; uma falha desse comando mantém a tela e informa o erro. Reiniciar também pede confirmação durante o treino.

As telas inicial e de configuração mantêm o redesign preto/vermelho anterior; a alteração 1.2.0 se concentra no temporizador. Favoritos continuam compactos e selecionáveis, com ações em menu. Não foi adicionado histórico ou backend.

## Tipografia e dimensão

Foram comparados os arquivos oficiais Anton Regular e Bebas Neue Regular, do repositório Google Fonts. Medições locais em Chromium, com tamanho de 1.000 pontos:

| Fonte | Largura dos dígitos | Altura aproximada da tinta | Decisão |
| --- | --- | --- | --- |
| Anton | 494,14; o “1” tem 330,57 | 890,63 | Exigiria compensar a largura do “1” |
| Bebas Neue | 400 para todos os dígitos | 734,38 | Escolhida pela estabilidade e leitura condensada |

Fonte: [Bebas Neue oficial](https://github.com/google/fonts/tree/main/ofl/bebasneue). O arquivo `assets/fonts/BebasNeue-Regular.ttf` usa peso 400 real; a licença SIL OFL 1.1 está em `assets/fonts/OFL.txt`. O plugin `expo-font` do SDK 58 incorpora e registra a família Android `RollTimerClock` durante a compilação. Não há download de fonte ao abrir o treino.

`TimerDisplay` mede a área central com `onLayout`. `clockLayout` considera os avanços reais da fonte (0,400 em por dígito e 0,188 em por dois-pontos), largura, altura e comprimento do formato. A largura alvo é 94% da área central. Escalas por eixo, limitadas a 2,2, aumentam a altura dos números na vertical e a ocupação horizontal em telas baixas. Tanto a linha transformada quanto seus glifos devem caber na área medida; telas extremas priorizam a altura disponível. Não há animação de escala durante a contagem.

A dimensão depende do formato, não do valor dos dígitos. Etapas de uma hora ou mais mantêm `HH:MM:SS` até terminar. O relógio ajusta os números à área disponível; os demais textos respeitam a ampliação de fonte do sistema. Os dígitos conservam contraste integral durante a pausa.

## Arquivos e componentes

| Área | Arquivos |
| --- | --- |
| Tela e saída segura | `src/app/timer.tsx` |
| Layout por orientação | `src/ui/TimerPresentation.tsx` |
| Relógio e dimensão estável | `src/ui/TimerDisplay.tsx`, `src/ui/layout.ts` |
| Cores, etapa, rodada e progresso | `src/ui/TimerIndicators.tsx` |
| Controles acessíveis, toque mínimo 48 × 48 | `src/ui/TimerControls.tsx`, `src/ui/TimerIconButton.tsx`, `src/ui/OrientationToggle.tsx`, `src/ui/Icon.tsx` |
| Fonte e versão Android | `assets/fonts/`, `app.json`, `package.json`, `package-lock.json` |
| Rotação já implementada | `src/platform/useTrainingDisplay.ts`, `src/platform/orientationController.ts` |
| Redesign anterior dos menus | `src/ui/theme.ts`, `components.tsx`, `HomeContent.tsx`, `PresetCard.tsx`, `ActionMenu.tsx`, `src/app/index.tsx`, `workout.tsx`, `settings.tsx`, `_layout.tsx` |
| Verificação | `tests/display.test.cjs`, `tests/ui/`, `scripts/ui-check.mjs`, `scripts/test.mjs`, `tsconfig.core.json` |

A rotação serializa solicitações ao Android, alterna vertical/horizontal e restaura a orientação dos menus ao sair. Nenhuma solicitação de rotação chama pausa, reinício, avanço ou geração de alertas. Preferências visuais são persistidas sem trocar a configuração da sessão em andamento.

## Verificação executada

- `npm run lint` e `npm run typecheck`: passaram.
- `npm test`: 28 testes passaram, incluindo contagem, transições, alertas, persistência, dimensões estáveis e concorrência nas solicitações de orientação.
- `npm run test:ui`: 106 verificações passaram em Chromium com os componentes reais via React Native Web e APIs Android substituídas somente no harness de testes.
- Dimensões verificadas: 320 × 568, 360 × 640, 393 × 852, 430 × 932, 568 × 320, 640 × 360 e 844 × 390; também recortes laterais e textos ampliados.
- Valores `00:05`, `00:59`, `05:00`, `59:59`, horas, medidas constantes durante mudanças dos segundos, cores por fase, pausa, retomada, reinício e cancelamento/confirmação de saída. Retorno Android exercitado por callback simulado.
- Rotações repetidas durante luta, pausa, últimos segundos e descanso; transição automática enquanto a orientação muda; nenhum comando de temporizador disparado pela rotação. Layout também exercitado com rede bloqueada após o carregamento.
- `npm run prebuild:android`: passou. A geração registrou `RollTimerClock` em `MainApplication` e incluiu o recurso de fonte XML/TTF.
- `npm run export:android`: passou, bundle Hermes Android com 1.288 módulos.
- `expo-doctor`: 20/20 verificações passaram.
- Comparação SHA-256 com o código da primeira APK: 19 arquivos do módulo nativo, recursos de áudio, motor, regras de alertas, estado e ponte Android permaneceram idênticos.
- Compilação EAS: `BUILD SUCCESSFUL`, 930 tarefas, Gradle concluído em 12 min 36 s. APK 1.2.0 / código 3, assinada com a mesma credencial do projeto.
- APK publicada conferida por HTTP Range: 97.056.298 bytes, manifesto, bundle offline e quatro WAV presentes. A fonte extraída (`res/n1.ttf`, nome otimizado pelo Android) tem o mesmo SHA-256 do TTF original licenciado: `08e4623805102d819f58601e46e345648846075e363b2ceb23313c2d1c83ec73`.

### Capturas revisadas

São capturas dos componentes no navegador de testes, **não de um Android real**:

| Tela | Captura |
| --- | --- |
| Temporizador vertical, luta | [timer-vertical.png](redesign/timer-vertical.png) |
| Temporizador horizontal, descanso e recorte lateral | [timer-horizontal.png](redesign/timer-horizontal.png) |
| Pausa preservando o fundo | [timer-pausado.png](redesign/timer-pausado.png) |
| Preparação | [timer-preparar.png](redesign/timer-preparar.png) |
| Formato com horas | [timer-horas.png](redesign/timer-horas.png) |
| Início, configuração e preferências do redesign anterior | [inicio.png](redesign/inicio.png), [configurar-treino.png](redesign/configurar-treino.png), [preferencias.png](redesign/preferencias.png) |

Contagem e limites da verificação automatizada: [checks.json](redesign/checks.json).

## Limites e teste no aparelho

O ambiente não possui aparelho/emulador Android, JDK ou Android SDK para testes nativos locais. A compilação Android é feita no EAS. As verificações no navegador não reproduzem áudio, vibração, rotação física, comportamento da barra do sistema, recuperação após encerramento ou serviço em segundo plano. Esses recursos foram preservados, mas precisam ser exercitados na nova APK no aparelho. Os testes Kotlin/JVM existentes não foram executados nesta tarefa.

No celular, confirmar fonte incorporada e números completos nas duas orientações; alternar repetidamente perto dos últimos cinco segundos; pausar, retomar e reiniciar; cancelar e confirmar voltar pela seta e pelo gesto/botão Android; conferir bips, transição, voz e vibração; repetir em modo avião, com tela bloqueada e retornando do segundo plano. O roteiro detalhado continua em [TESTES-ANDROID.md](TESTES-ANDROID.md).

Instalar a nova APK como atualização do mesmo pacote `com.rolltimer.app`, com a mesma assinatura EAS. Não é necessário desinstalar a versão anterior. A versão deste código é 1.2.0, `versionCode` 3.

[Baixar APK 1.2.0 — aproximadamente 97 MB](https://expo.dev/artifacts/eas/tpYSIT3o8qMoxzxHPVqAP-Qxi1xhKJ5_ey6jSN6mBD4.apk). Abrir o link no celular, baixar e instalar como atualização. Se o Android solicitar, permitir instalação pela origem usada para abrir o arquivo. [Build e logs no Expo](https://expo.dev/accounts/buja23/projects/roll-timer/builds/f5096b2e-7142-4e0d-bea2-c4edd2220539).
