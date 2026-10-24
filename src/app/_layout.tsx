import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppProvider';
import { colors, Label, Screen } from '../ui/components';
function Navigation() {
  const { ready, error } = useApp();
  if (!ready) return <Screen><Label>Carregando Roll Timer…</Label></Screen>;
  return <><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
    <Stack.Screen name="index" options={{ headerShown: false, orientation: 'portrait_up' }} />
    <Stack.Screen name="workout" options={{ title: 'Configurar treino', orientation: 'portrait_up' }} />
    <Stack.Screen name="settings" options={{ title: 'Preferências', orientation: 'portrait_up' }} />
    <Stack.Screen name="timer" options={{ headerShown: false, gestureEnabled: false }} />
  </Stack>{error && <Label style={{ backgroundColor: '#321619', padding: 14 }} accessibilityLiveRegion="polite">{error}</Label>}</>;
}
export default function Layout() { return <SafeAreaProvider><AppProvider><Navigation /></AppProvider></SafeAreaProvider>; }
