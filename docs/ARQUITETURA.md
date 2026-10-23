# Arquitetura e decisões

## Uma referência de tempo

No Android, a fonte de verdade é `SystemClock.elapsedRealtime()`, incluindo suspensão. A sessão persiste configuração, plano, tempo acumulado, âncora monotônica, pausa e contador de boot em SharedPreferences. AsyncStorage guarda preferências e favoritos; esses dados não são usados como relógio.

Tempo ativo = acumulado + (agora monotônico − âncora). Na pausa, o acumulado é congelado e a âncora é substituída. Retomar muda apenas âncora/pausa. Avançar define o acumulado como o fim da etapa atual. Reiniciar volta a zero com a mesma configuração. A troca do relógio civil não afeta a sessão. Uma mudança de boot invalida sua âncora.

O plano contém preparação e uma lista de etapas de **um ciclo**. A divisão do tempo pelo período determina o ciclo; uma busca limitada às etapas desse ciclo determina rodada, fase e prazo. O término finito remove o descanso final. O descanso de ciclo ocupa o lugar do comum, inclusive quando zero. Não é preciso executar uma transição por vez para alcançar o presente; nem uma sessão infinita gera uma lista crescente.

`src/core/timer.ts` é a implementação pura usada pela interface. `Timeline.kt` interpreta o mesmo plano serializado no serviço. Testes TypeScript comparam o cálculo com uma sequência linear independente. Testes JVM em `TimelineTest.kt` cobrem a interpretação Kotlin; precisam de toolchain Android/Java para rodar. A concordância em tempo de execução ainda deve ser verificada em aparelho.

## Interface e serviço

Expo Router organiza quatro telas. AppProvider lê snapshots nativos a cada 150 ms, exclusivamente para renderizar; atraso no JavaScript não altera o treino. O serviço executa um Handler a cada 100 ms para consultar a referência monotônica. O Handler também não é o relógio.

Começar uma sessão chama `startForegroundService` enquanto a Activity está visível. O módulo é autolinkado de `modules/roll-timer`. Não existe dependência de Expo Go nem de tarefas JavaScript em segundo plano. Notificação persistente oferece pausar/continuar e encerrar. O serviço usa `START_STICKY` para permitir recriação pelo Android, sem garantir que ocorrerá imediatamente.

Na recriação, a sessão usa a âncora persistida. Não são recuperados sons de etapas passadas. A última chave de aviso é persistida antes da tentativa de áudio para favorecer a não duplicação em caso de morte do processo. É impossível garantir atomicidade entre escrita em disco e reprodução física: uma morte nesse intervalo pode perder o aviso, que não será repetido.

O wake lock parcial tem prazo de 10 minutos renovado a cada 5 minutos enquanto o relógio roda, inclusive no infinito. A pausa e o encerramento o liberam. A tela ligada é controlada separadamente pelo Expo KeepAwake enquanto houver treino ativo, inclusive pausado. Tela cheia/orientação são aplicadas na tela do treino e restauradas na saída.

## Áudio

Os quatro WAV são síntese original reproduzível por `npm run assets:generate`: tick curto e três sinais de transição distintos. O serviço usa `MediaPlayer` com volume local de 0 a 1; não modifica o volume do Android. Não precisa de biblioteca Expo de áudio, pois alertas são inteiramente nativos e precisam continuar sem o JavaScript.

Cada reprodução cancela a anterior, incluindo TTS e vibração. O anúncio só começa após o término do sinal de transição. Cada aviso solicita foco transitório e o libera após uma janela curta; perder foco interrompe a reprodução. Durante modos de chamada/comunicação não inicia áudio. Falhas de reprodução são contidas no serviço e não alteram o tempo.

`CueGate.kt` decide uma única tentativa por fase/segundo, sem reproduzir segundos perdidos. `src/core/alerts.ts` expressa a mesma regra para testes da especificação. Testes JVM cobrem deduplicação, restauração e falha de áudio; os testes de alto-falante, TTS e foco exigem aparelho.

TTS procura uma voz pt-BR que declare não precisar de rede. Sem voz adequada, anúncios são omitidos. Não há solicitação de internet, download nem promessa de voz disponível em todos os aparelhos.

## Permissões e políticas

O mínimo é Android 8.0/API 26, necessário para `AudioFocusRequest` e canais de notificação. O config plugin `plugins/withRollTimerAndroid.js` aplica esse requisito em cada prebuild.

| Permissão | Finalidade |
| --- | --- |
| `FOREGROUND_SERVICE` | Serviço visível de treino |
| `FOREGROUND_SERVICE_SPECIAL_USE` | Tipo explícito do temporizador no Android 14+ |
| `POST_NOTIFICATIONS` | Controles visíveis; solicitada ao iniciar treino no Android 13+ |
| `WAKE_LOCK` | CPU disponível para os avisos com tela bloqueada |
| `VIBRATE` | Vibração opcional |

A consulta `TTS_SERVICE` permite descobrir mecanismos de fala no Android 11+. Microfone, armazenamento externo e sobreposição são bloqueados na configuração. O template inclui `INTERNET` para desenvolvimento Expo/Metro; o código do produto não faz requisições e a build release tem seu bundle local. Não se solicita telefone, localização, alarme exato ou exclusão automática das otimizações de bateria.

O tipo `specialUse` descreve o treino temporizado iniciado pelo usuário, sem usar indevidamente `dataSync` ou `mediaPlayback`. O manifesto inclui a justificativa; distribuição pela Play exige declaração e revisão. Não há receiver de boot nem tentativa de reiniciar após encerramento forçado pelo usuário.

As políticas Android/fabricante podem matar ou atrasar o serviço. A referência monotônica mantém a consistência ao retomar, mas não assegura sons enquanto o processo estiver morto. **Segundo plano permanece pendente de validação real.**
