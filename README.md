# Roll Timer

Temporizador offline para Android 8.0+ (API 26), destinado a professores, atletas e academias de jiu-jitsu. Preparação, luta e descanso avançam automaticamente; o tempo ocupa o centro da tela para leitura à distância.

Implementado com Expo SDK 58, React Native, TypeScript estrito, Expo Router e AsyncStorage. Um módulo local Kotlin executa o relógio e os alertas no Android, independentemente do JavaScript. Sem conta, backend, publicidade, histórico ou sincronização.

## Funcionalidades

- Preparação, luta, descanso, rodadas, ciclos e modo infinito.
- Descanso entre ciclos substitui o descanso comum; o treino termina na última luta.
- Pausar, continuar, reiniciar e encerrar, com confirmação nas ações de reinício/encerramento.
- Treino abre na horizontal, com rotação manual; menus verticais e cronômetro responsivo em Roboto Condensed Bold, sem deformação dos caracteres.
- Sete efeitos originais: bip eletrônico, competição, gongo, sino de boxe, buzina, apito e alarme; sons independentes por evento e versões curtas para a contagem.
- Intensidades Normal/Forte/Máximo, volume relativo ao volume de mídia, prévia individual e de cinco bips mais gongo, voz pt-BR offline opcional e vibração.
- Favoritos padrão e personalizados: criar, editar, usar, iniciar, excluir personalizados e restaurar padrões.
- Preferências locais, tela ligada, tela cheia e visual de alto contraste.
- Serviço Android `specialUse`, notificação com pausa/continuação e encerramento, relógio monotônico e recuperação da sessão no mesmo boot.

**Versão atual: 1.1.0 / código Android 4**, conforme o nome solicitado para esta entrega; o código crescente permite atualizar a APK anterior identificada como 1.2.0 / código 3. [Baixar APK de teste, aproximadamente 98 MB](https://expo.dev/artifacts/eas/oE0JnW-tyhdW7oXoQBBg62ePkxqyaenixuAf7VPvpNY.apk). A [compilação Android no EAS](https://expo.dev/accounts/buja23/projects/roll-timer/builds/059ef69a-e22a-4fe1-b87b-6813961b1d8d) passou. Lint, tipos, 32 testes e 128 verificações de interface passaram. Fonte, bundle offline, 14 WAVs e licenças conferidos na APK. Veja [alterações, arquivos, capturas e limites da validação](docs/V1.1.0.md). Audição real, Bluetooth, rotação física, tela bloqueada e segundo plano precisam de validação no aparelho; testes Kotlin/JVM permanecem pendentes.

## Instalação e desenvolvimento

Requisitos: Node compatível com o SDK 58 (utilizado Node 24.14.1), npm e, para compilação local, Android Studio com SDK Android e JDK compatível com o Gradle gerado. No Windows, use `npm.cmd`/`npx.cmd` caso a política do PowerShell bloqueie os scripts `.ps1`.

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run android
```

`npm run android` gera o projeto nativo e instala uma build de desenvolvimento no emulador ou aparelho com depuração USB. Configure `JAVA_HOME`, `ANDROID_HOME` e `adb` no PATH. Para reiniciar apenas o Metro depois de instalar a build:

```powershell
npm.cmd start
```

**Expo Go não inclui o módulo nativo Roll Timer.** Nele é possível inspecionar as telas; iniciar treino e testar sons exigem uma build Android própria. Não há temporizador simulado como substituto do serviço.

## APK instalável com EAS

EAS exige internet e conta Expo apenas para construir/distribuir; o aplicativo instalado opera offline. O projeto está vinculado a `@buja23/roll-timer`, com assinatura Android configurada no EAS. Para construir em outra conta, faça a vinculação e configure as credenciais dessa conta.

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build:configure
npm.cmd run build:apk
```

O perfil `preview` em [eas.json](eas.json) gera uma APK de release com JavaScript embarcado, sem depender do Metro. Baixe a APK pelo link fornecido pelo EAS e abra no celular, permitindo instalação por essa origem quando o Android solicitar. Alternativa com USB:

```powershell
adb install -r .\RollTimer.apk
```

A APK de teste foi gerada na nuvem e o link acima foi verificado. A inspeção do ZIP confirmou manifesto, bundle offline e recursos locais; os hashes da fonte, dos 14 WAVs e das licenças correspondem aos arquivos do projeto.

## Build local e produção

```powershell
npm.cmd run prebuild:android
.\android\gradlew.bat -p android :roll-timer-native:testDebugUnitTest
.\android\gradlew.bat -p android assembleRelease
```

A APK local fica em `android/app/build/outputs/apk/release/`. O template Expo pode usar chave de debug para release local; para distribuição real configure uma chave própria ou use o gerenciamento de credenciais EAS. Não publique uma APK assinada com chave de debug.

```powershell
npm.cmd run build:production
```

O perfil `production` gera AAB para Google Play. A publicação requer configurar assinatura, ficha do aplicativo e declarar/justificar o serviço `specialUse` na Play Console; a aceitação depende de revisão. A compilação da APK foi verificada no EAS; o AAB de produção e a publicação ainda não foram verificados.

`android/` é gerado por prebuild e ignorado no Git. O código nativo autoral vive em `modules/roll-timer/` e é incluído automaticamente em builds limpas. Faça alterações permanentes no módulo ou em `app.json`, não no diretório gerado.

## Como usar

1. Ajuste o temporizador ou escolha um favorito com **Usar**; **Iniciar** no favorito começa diretamente com ele.
2. Defina tempos em minutos/segundos, rodadas e, se necessário, ciclos ou modo infinito.
3. Em Preferências, teste o sinal, ajuste volume e recursos de tela. Instale previamente uma voz pt-BR offline no Android para anúncios sem rede.
4. Inicie uma vez. A preparação leva à primeira luta, e as demais etapas avançam sozinhas.
5. Pause/continue pela tela ou notificação. **Próxima** termina a etapa atual, preservando o estado de pausa.
6. Encerrar interrompe som, voz, vibração, serviço e wake lock. O fim natural permite tocar o sinal final antes de liberar o serviço.

Alterar preferências ou favoritos não muda uma sessão já iniciada: ela mantém uma cópia da configuração original. A seta no treino volta ao início e mantém a sessão; use **Encerrar** para terminá-la.

## Estrutura

```text
src/app/                     Rotas: início, treino, formulário e preferências
src/core/                    Plano temporal, validação, preferências e especificação dos avisos
src/platform/                Ponte com Android e preferências de tela
src/state/                   Estado da interface e persistência AsyncStorage
src/ui/                      Componentes e paleta
modules/roll-timer/android/   Serviço, relógio, áudio, TTS, notificação e testes JVM
plugins/                     Configuração nativa permanente (Android mínimo API 26)
tests/                       Testes automatizados do motor e persistência
scripts/                     Execução de testes e geração de PNG/WAV originais
assets/                      Ícone, splash e recursos locais
docs/                        Arquitetura, validação e testes em aparelho
```

Detalhes técnicos: [arquitetura e limitações Android](docs/ARQUITETURA.md). Inventário dos arquivos e verificações: [entrega](docs/ENTREGA.md).

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run export:android
npm.cmd run prebuild:android
npx.cmd expo-doctor@latest
```

O bundle exportado valida o JavaScript e os assets do Router; **não é uma APK e não compila Kotlin**. Os WAV do serviço são empacotados pelo Gradle como assets Android, não pelo Metro. O teste de orientação, áudio real, permissões e execução offline completa está no roteiro manual.

## Limitações conhecidas

- Android pode interromper serviços por ação do usuário, encerramento forçado, restrições de bateria ou fabricante. A precisão do relógio não garante que todos os sons serão entregues durante uma interrupção.
- Após morte do processo, a sessão pode ser recuperada no mesmo boot pelo serviço ou ao reabrir. Intervalos perdidos não geram uma fila de bips/gongos. Após reinício do aparelho, a sessão é descartada; não existe inicialização automática no boot.
- Bloquear a tela não pausa o treino. Chamadas, áudio de outros aplicativos, modo Não Perturbe e volume do Android podem impedir sinais. O aplicativo não muda o volume global.
- Voz depende de um mecanismo TTS e de voz pt-BR offline já instalada. Sem ela, os avisos principais seguem funcionando; não há download automático.
- Wake lock parcial durante execução mantém a CPU disponível e consome bateria. É liberado na pausa e no encerramento; a opção de manter tela ligada controla separadamente a tela.
- A auditoria npm encontrou alertas transitivos nas ferramentas Expo/Metro (`braces` e `node-forge`). Correções compatíveis foram tentadas; não foi aplicado o downgrade incompatível sugerido por `audit --force`. Consulte `npm audit` antes de distribuir.
- Instalação, layout real, testes JVM e segundo plano permanecem pendentes. A compilação nativa da APK passou no EAS.

## Screenshots

Espaço reservado para capturas reais da build Android, ainda não produzidas: início, preparação, luta vertical, descanso horizontal e preferências.

## Referências técnicas

- [Módulos locais Expo](https://docs.expo.dev/workflow/customizing/)
- [API de módulos Expo](https://docs.expo.dev/modules/module-api/)
- [Tipos e requisitos de serviços em primeiro plano Android](https://developer.android.com/develop/background-work/services/fgs/service-types#special-use)
- [Relógio monotônico Android](https://developer.android.com/reference/android/os/SystemClock#elapsedRealtime())

Timer Plus foi usado apenas como referência funcional descrita no escopo. Nenhum asset, identidade ou interface foi copiado.
