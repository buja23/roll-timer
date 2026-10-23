import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { useApp } from '../state/AppProvider';
import { validateWorkout, Workout } from '../core/timer';
import { Button, DurationField, Field, IconButton, ScreenHeader, Label, Screen, Section, Toggle } from '../ui/components';
const toParts = (n: number) => [String(Math.floor(n / 60)), String(n % 60).padStart(2, '0')];
export default function WorkoutScreen() {
  const { prefs, update } = useApp();
  const params = useLocalSearchParams<{ presetId?: string; create?: string }>();
  const preset = prefs.presets.find(p => p.id === params.presetId);
  const initial = preset?.workout ?? prefs.workout;
  const [durations, setDurations] = useState({ prepare: toParts(initial.prepare), fight: toParts(initial.fight), rest: toParts(initial.rest), cycleRest: toParts(initial.cycleRest) });
  const [rounds, setRounds] = useState(String(initial.rounds));
  const [cycles, setCycles] = useState(String(initial.cycles));
  const [infinite, setInfinite] = useState(initial.infinite);
  const [useCycles, setUseCycles] = useState(initial.cycleRestEnabled);
  const [name, setName] = useState(preset?.name ?? 'Meu treino');
  const [saving, setSaving] = useState(false);
  const save = async (asPreset: boolean) => {
    const values = {} as Record<keyof typeof durations, number>;
    for (const k of Object.keys(durations) as (keyof typeof durations)[]) {
      const [min, sec] = durations[k];
      if (!/^\d{1,2}$/.test(min) || !/^\d{1,2}$/.test(sec) || Number(sec) > 59) { Alert.alert('Duração inválida', 'Preencha minutos de 0 a 99 e segundos de 0 a 59.'); return; }
      values[k] = Number(min) * 60 + Number(sec);
    }
    if (useCycles && !infinite && Number(cycles) < 2) { Alert.alert('Confira os ciclos', 'Configure pelo menos 2 ciclos ou desative o descanso entre ciclos.'); return; }
    const workout: Workout = { ...values, rounds: /^\d{1,2}$/.test(rounds) ? Number(rounds) : NaN, cycles: useCycles && !infinite ? (/^\d{1,2}$/.test(cycles) ? Number(cycles) : NaN) : 1, infinite, cycleRestEnabled: useCycles };
    const error = validateWorkout(workout); if (error) { Alert.alert('Confira o treino', error); return; }
    if (asPreset && !name.trim()) { Alert.alert('Nome obrigatório', 'Dê um nome ao favorito.'); return; }
    setSaving(true);
    const entry = { id: preset?.id ?? `custom-${Date.now()}`, name: name.trim(), workout, builtin: preset?.builtin ?? false };
    const presets = asPreset ? preset ? prefs.presets.map(p => p.id === preset.id ? entry : p) : [...prefs.presets, entry] : prefs.presets;
    const ok = await update({ ...prefs, workout, presets, selectedPresetId: asPreset ? entry.id : undefined }); setSaving(false);
    if (ok) router.back(); else Alert.alert('Não foi possível salvar', 'Tente novamente.');
  };
  return <Screen><ScreenHeader title={preset ? 'Editar favorito' : params.create ? 'Novo favorito' : 'Treino'} leading={<IconButton name="back" label="Voltar ao início" onPress={() => router.back()} />} />
    <Section title="Tempos">{(['prepare', 'fight', 'rest'] as const).map(k => <DurationField key={k} title={{ prepare: 'Preparação', fight: 'Luta', rest: 'Descanso' }[k]} value={durations[k]} onChange={v => setDurations(d => ({ ...d, [k]: v }))} />)}</Section>
    <Section title="Rodadas e ciclos"><Toggle title="Modo infinito" detail="O treino continua até você encerrar." value={infinite} onChange={setInfinite} /><Field title={infinite ? 'Rodadas por ciclo' : 'Rodadas por ciclo (1–99)'} numeric maxLength={2} value={rounds} onChange={setRounds} />
      <Toggle title="Descanso entre ciclos" detail="Substitui o descanso normal na última rodada do ciclo." value={useCycles} onChange={setUseCycles} />
      {useCycles && <><DurationField title="Descanso entre ciclos" value={durations.cycleRest} onChange={v => setDurations(d => ({ ...d, cycleRest: v }))} />{!infinite && <Field title="Quantidade de ciclos (2–99)" value={cycles} onChange={setCycles} numeric maxLength={2} />}</>}
      {infinite && !useCycles && <Label muted>Entre ciclos, será usado o descanso comum.</Label>}
    </Section>
    <Button title="Aplicar ao temporizador" icon="check" disabled={saving} onPress={() => void save(false)} />
    <Section title="Favorito"><Field title="Nome do favorito" value={name} onChange={setName} /><Button secondary title={preset ? 'Salvar favorito e usar' : 'Salvar como favorito e usar'} icon="plus" disabled={saving} onPress={() => void save(true)} /></Section>
    <Button title="Sons e preferências" secondary icon="settings" onPress={() => router.push('/settings')} />
    <Label muted style={{ fontSize: 12 }}>Preparação e descanso podem ser zero. A luta precisa de pelo menos 1 segundo.</Label>
  </Screen>;
}
