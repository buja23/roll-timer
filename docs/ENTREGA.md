# Registro da entrega

Este documento registra a entrega original 1.0.0. Para a interface atual, rotação manual, fonte incorporada e validações da versão 1.2.0, consulte [REDESIGN.md](REDESIGN.md).

Data: 23/10/2026. A pasta de trabalho estava vazia e sem repositório Git inicializado. Nenhum código existente de produto foi substituído.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Passou, TypeScript estrito sem erros |
| `npm run lint` | Passou, sem erros ou avisos |
| `npm test` | 21 testes passaram |
| `npm run export:android` | Bundle Hermes Android gerado; Router reconhece `src/app` |
| `npm run prebuild:android` | Projeto Android gerado sem erros |
| Autolinking Android | `expo.modules.rolltimer.RollTimerModule` reconhecido |
| `npx expo install --check` | Dependências compatíveis com SDK instalado |
| `npx expo-doctor@latest` | 20/20 checks passaram |
| Gradle/Kotlin Android | `:app:assembleRelease` passou no EAS; Java continua ausente no ambiente local |
| Testes Kotlin/JVM | Incluídos, ainda não executados por falta de toolchain |
| APK | Gerada no EAS, 90.868.949 bytes; manifesto, bundle offline e quatro WAV verificados no ZIP |
| Instalação e aparelho | Ainda não executados; Android SDK/aparelho não disponíveis neste ambiente |
| Auditoria npm online | 19 alertas altos transitivos; veja abaixo |

Os testes de lógica cobrem contagem, limites de etapa, rodadas/ciclos, infinito, pausa/retomada/reinício/avanço, favoritos, persistência, dados corrompidos, falha de armazenamento, atrasos de várias etapas e especificação de avisos únicos. Uma sequência linear independente verifica o plano calculado em combinações de rodadas, ciclos e descansos zero/não zero.

Os testes de áudio TypeScript verificam a regra de disparo e isolamento do relógio, **não reprodução física**. O serviço usa a implementação Kotlin dessa regra e tem testes JVM próprios. Não houve execução da interface em emulador ou aparelho; responsividade/orientação são implementadas, mas a apresentação real ainda depende de inspeção em Android.

Foram tentadas correções npm sem `--force`. Permanecem os avisos de `braces` e `node-forge` e seus dependentes Expo/Metro. O npm sugeriu downgrade incompatível para Expo 44; isso não foi aplicado. Uma auditoria offline pode reportar zero por não consultar a base remota; o resultado online é o relevante. Verificar novamente antes da distribuição.

## Arquivos principais criados/alterados

| Área | Arquivos |
| --- | --- |
| Projeto e build | `package.json`, `package-lock.json`, `app.json`, `eas.json`, `tsconfig.json`, `tsconfig.core.json`, `eslint.config.js`, `.gitignore` |
| Rotas | `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/workout.tsx`, `src/app/settings.tsx`, `src/app/timer.tsx` |
| Lógica | `src/core/timer.ts`, `src/core/preferences.ts`, `src/core/alerts.ts` |
| Estado e componentes | `src/state/AppProvider.tsx`, `src/ui/components.tsx` |
| Ponte Android e tela | `src/platform/nativeTimer.ts`, `src/platform/useTrainingDisplay.ts` |
| Módulo local | `modules/roll-timer/package.json`, `expo-module.config.json`, `android/build.gradle`, `android/src/main/AndroidManifest.xml` |
| Plugin de build | `plugins/withRollTimerAndroid.js` (mínimo Android 8/API 26) |
| Kotlin | `RollTimerModule.kt`, `TimerService.kt`, `SessionStore.kt`, `Timeline.kt`, `CueGate.kt`, `AlertAudio.kt` em `modules/roll-timer/android/src/main/java/expo/modules/rolltimer/` |
| Testes | `tests/core.test.cjs`, `modules/roll-timer/android/src/test/java/expo/modules/rolltimer/TimelineTest.kt`, `scripts/test.mjs` |
| Recursos | `scripts/generate-assets.mjs`, `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `assets/favicon.png` e quatro WAV locais em `modules/roll-timer/android/src/main/assets/roll-timer/` |
| Documentação | `README.md`, `docs/ARQUITETURA.md`, `docs/TESTES-ANDROID.md`, `docs/ENTREGA.md` |

O template gerou `AGENTS.md`, `LICENSE` e arquivos iniciais de configuração. `App.tsx` do template foi removido em favor do Router. `android/`, `.expo/`, `.test-build/` e `dist/` são derivados locais ignorados no Git. O código permanente do módulo nativo está fora do `android/` raiz.

## Pendências para aprovação de release

1. Executar os testes JVM com toolchain Android. Compilação Kotlin e geração da APK já passaram no EAS.
2. Instalar a APK e executar o roteiro em `TESTES-ANDROID.md`, incluindo bloqueio, chamadas, áudio indisponível, recuperação do processo e modo avião.
3. Revisar layout real em aparelhos pequenos, horizontal e fonte ampliada; capturar screenshots.
4. Reavaliar auditoria de dependências, configurar assinatura de distribuição e validar requisitos Play para `specialUse` caso a distribuição seja pela loja.

Implementação em segundo plano está presente no código; **confiabilidade em Android real não está declarada concluída**. As instruções completas para gerar e instalar estão no README.

## APK de teste gerada em 23/10/2026

- [Build concluída](https://expo.dev/accounts/buja23/projects/roll-timer/builds/08334057-ea5b-49cd-b1d3-b125025a8fe4).
- [Download da APK, aproximadamente 91 MB](https://expo.dev/artifacts/eas/jmlyAzLkBsa3ppLTjkPVyIp5fA0PGq4bFlIsXbbCpjo.apk).
- A primeira tentativa falhou porque o comando customizado incluía uma tarefa `testReleaseUnitTest` indisponível. O perfil `preview` voltou ao comando padrão de APK do EAS; os testes JVM continuam pendentes, sem impedir a compilação de instalação.
- O serviço nativo Kotlin compilou; a build completou `lintVitalRelease`, otimização R8 e `assembleRelease` com sucesso.
- Conta Expo vinculada e assinatura remota configurada. `.easignore` exclui artefatos locais e metadados das ferramentas do upload.
