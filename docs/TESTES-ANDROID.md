# Roteiro em Android real

Status: **não executado**. Registrar modelo, Android/API, versão da APK, política de bateria, resultado e evidências. Preferir dois aparelhos, incluindo um Android 14+ e um fabricante com restrições de bateria. Usar APK `preview` release sem Metro para testes offline.

## Sessão de referência

Preparação 0:10, luta 0:15, descanso 0:06, 3 rodadas. Depois repetir com 2 ciclos e descanso de ciclo 0:08. No primeiro caso total esperado: 1:07. No segundo: 2:12. Comparar com cronômetro independente. Ouvir em ambiente silencioso com volume de mídia conhecido.

| Caso | Procedimento e resultado esperado | Resultado |
| --- | --- | --- |
| Sequência | Preparar → luta → descanso; 3ª luta finaliza sem descanso adicional | Pendente |
| Contagem | Bips em 5, 4, 3, 2, 1; sinal distinto na transição, sem duplicação | Pendente |
| Ciclos | Descanso de 8s substitui o normal no limite do ciclo; não soma 6s + 8s | Pendente |
| Zero | Preparação/descanso zero; luta 1s; sem etapas vazias ou travamento | Pendente |
| Infinito | Passar de três ciclos sem finalizar; testar ambos os descansos de ciclo | Pendente |
| Pausa | Pausar perto de zero, esperar 20s; tempo/etapa ficam congelados | Pendente |
| Retomada | Continuar exatamente do tempo restante; sem bip repetido no mesmo segundo | Pendente |
| Próxima | Avançar preparação, luta e descanso; contar rodada na hora correta | Pendente |
| Próxima pausado | Avançar mantém pausa, sem sinais; continuar inicia a etapa escolhida | Pendente |
| Reinício | Confirmar reinício restaura primeira rodada e preparação; cancelar conserva sessão | Pendente |
| Encerramento | Cancelar mantém treino; confirmar para som, TTS, vibração e notificação | Pendente |
| Notificação | Pausar, continuar e encerrar com app minimizado e tela bloqueada | Pendente |
| Preferências | Fechar/reabrir; som, volume, orientação e tela permanecem salvos | Pendente |
| Favoritos | Criar, editar inclusive padrão, usar, iniciar, excluir personalizado, restaurar padrões | Pendente |
| Validação | Campos vazios, luta zero, segundos 60, rodadas/ciclos 0; formulário impede salvar | Pendente |
| Orientação | Girar durante contagem, pausa e transição; tempo consistente e controles acessíveis | Pendente |
| Tela pequena | Conferir vertical/horizontal, fonte ampliada e barras com navegação por gestos/3 botões | Pendente |
| Tela cheia | Ocultar barras; gesto revela temporariamente; voltar restaura sistema | Pendente |
| Tela ligada | Desligar/ligar opção; treino ativo segue preferência e término restaura repouso | Pendente |
| Sons | Testar bip/apito/gongo em preferências e em sessões; tick difere do sinal de transição | Pendente |
| Voz | Instalar voz pt-BR offline; anunciar preparar/luta/descanso/próxima rodada/fim sem sobrepor gongo | Pendente |
| Sem TTS | Remover/desativar voz offline; timer e sinais principais continuam | Pendente |
| Áudio indisponível | Volume zero, Não Perturbe, áudio Bluetooth desconectado e foco negado; relógio não trava | Pendente |
| Chamada | Receber/atender ligação; áudio cede foco e não disputa chamada; tempo segue consistente | Pendente |
| Offline | Modo avião, Wi-Fi desligado, reiniciar APK release; iniciar, salvar e testar voz offline | Pendente |
| Permissão negada | Negar notificações no Android 13+; sessão não deve travar; conferir limitação de controles | Pendente |

## Segundo plano e recuperação

1. Executar por pelo menos 20 minutos com tela ligada e comparar o tempo com referência independente.
2. Minimizar por 3 etapas e retornar. Fase/rodada/ciclo devem refletir o tempo real, sem reproduzir uma fila de alertas atrasados.
3. Bloquear a tela por 20 minutos. Verificar sinais no instante previsto e controles da notificação. Repetir com economia de bateria e documentar diferenças.
4. Pausar pela notificação, manter tela bloqueada por 2 minutos e continuar. O período pausado não entra no treino.
5. Simular morte **do processo**, sem confundir com force-stop. O Android pode recriar o serviço; ao reabrir no mesmo boot a fase deve ser recalculada pela âncora persistida. Não exigir sinais enquanto o processo não existia.
6. Encerrar pelo gerenciador de apps ativos/force-stop. Verificar que o sistema para o serviço; não prometer retomada automática. Ao reabrir, o snapshot pode ser reconstruído no mesmo boot e haverá apenas os avisos atuais/futuros.
7. Reiniciar o aparelho. A sessão antiga deve ser descartada; nenhum serviço de treino inicia sozinho.
8. Testar relógio civil alterado durante sessão. O tempo monotônico não deve saltar.
9. Em modo infinito, observar uma execução superior a 10 minutos com tela bloqueada para verificar renovação do wake lock e sinais.
10. No fim natural, permitir sinal/voz final e conferir remoção da notificação após cerca de 3,5 segundos. Reiniciar imediatamente nessa janela deve manter a nova sessão ativa.

Registrar também consumo de bateria, erros do `adb logcat`, travamentos e atrasos audíveis. Não marcar segundo plano concluído até os cenários aplicáveis passarem.
