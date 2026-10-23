import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Preferences, Preset } from '../core/preferences';
import { makePlan, Workout } from '../core/timer';
import { Button, Card, IconButton, Label, Screen, ScreenHeader, s } from './components';
import { PresetCard } from './PresetCard';
import { formatDisplayTime } from './layout';
export function sameWorkout(a: Workout, b: Workout) { return (Object.keys(a) as (keyof Workout)[]).every(k => a[k] === b[k]); }
export interface HomeContentProps {
  prefs: Preferences; sessionExists: boolean; onStart: () => void; onResume: () => void;
  onConfigure: () => void; onSettings: () => void; onCreate: () => void;
  onSelect: (p: Preset) => void; onPresetMenu: (p: Preset) => void; onListMenu: () => void;
}
function SummaryMetric({ title, value }: { title: string; value: string }) {
  const { width, fontScale } = useWindowDimensions();
  const available = Math.min(568, width - 72);
  const units = [...value].reduce((sum, c) => sum + (c === ':' ? .32 : .65), 0);
  const fontSize = Math.min(34, (available - 8) / (units * fontScale));
  return <View style={{ gap: 6, flexGrow: 1, minWidth: units * fontSize * fontScale }}><Label style={s.sectionTitle}>{title}</Label><Label style={{ fontSize, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 }}>{value}</Label></View>;
}
export function HomeContent(p: HomeContentProps) {
  const w = p.prefs.workout;
  const selected = p.prefs.presets.find(x => x.id === p.prefs.selectedPresetId && sameWorkout(x.workout, w)) ?? p.prefs.presets.find(x => sameWorkout(x.workout, w));
  const total = makePlan(w).total;
  return <Screen>
    <ScreenHeader title="ROLL TIMER" action={<IconButton name="settings" label="Abrir preferências" onPress={p.onSettings} />} />
    {p.sessionExists && <Button title="Voltar à sessão" icon="timer" secondary compact onPress={p.onResume} />}
    <View style={{ gap: 16 }}>
      <View style={{ gap: 5 }}><Label style={s.sectionTitle}>Treino selecionado</Label><Label style={{ fontSize: 20, fontWeight: '700' }}>{selected?.name ?? 'Treino personalizado'}</Label></View>
      <Card style={{ gap: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
          <SummaryMetric title="LUTA" value={formatDisplayTime(w.fight * 1000)} /><SummaryMetric title="DESCANSO" value={formatDisplayTime(w.rest * 1000)} />
        </View>
        <View style={{ gap: 4 }}><Label>{w.infinite ? 'Rodadas ilimitadas' : `${w.rounds} rodadas`}{w.cycles > 1 ? ` · ${w.cycles} ciclos` : ''}</Label><Label muted>{formatDisplayTime(w.prepare * 1000)} de preparação · {total < 0 ? 'Sem limite' : `${formatDisplayTime(total)} no total`}</Label></View>
      </Card>
      <Button testID="start-workout" title="Iniciar treino" icon="play" onPress={p.onStart} />
      <Button title="Configurar treino" secondary icon="edit" compact onPress={p.onConfigure} />
    </View>
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Label style={s.sectionTitle}>Favoritos</Label><View style={{ flexDirection: 'row' }}><IconButton name="plus" label="Criar favorito" onPress={p.onCreate} /><IconButton name="more" label="Mais opções dos favoritos" onPress={p.onListMenu} /></View></View>
      {p.prefs.presets.length ? p.prefs.presets.map(preset => <PresetCard key={preset.id} preset={preset} selected={preset.id === selected?.id} onSelect={() => p.onSelect(preset)} onMenu={() => p.onPresetMenu(preset)} />) : <Label muted>Nenhum favorito salvo. Toque em + para criar.</Label>}
    </View>
  </Screen>;
}
