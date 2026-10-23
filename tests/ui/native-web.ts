import WebPlatform from 'react-native-web/dist/exports/Platform';
import useWebWindowDimensions from 'react-native-web/dist/exports/useWindowDimensions';
import React from 'react';
import WebSwitch from 'react-native-web/dist/exports/Switch';
import type { SwitchProps } from 'react-native';
import { trace } from './mocks';
export * from 'react-native-web';
export const Platform = { ...WebPlatform, OS: 'android', Version: 36 };
export function Switch(props: SwitchProps) { return React.createElement(WebSwitch, { ...props, activeThumbColor: props.thumbColor }); }
export function useWindowDimensions() { return { ...useWebWindowDimensions(), fontScale: Number(new URLSearchParams(window.location.search).get('scale') ?? 1) }; }
export const PermissionsAndroid = { PERMISSIONS: { POST_NOTIFICATIONS: 'notifications' }, request: async () => 'granted' };
export const TurboModuleRegistry = { getEnforcing: () => ({}) };
export const Alert = { alert: (title: string, message?: string, buttons?: { onPress?: () => void }[]) => { trace.alerts.push(`${title}: ${message ?? ''}`); (trace.confirm ? buttons?.at(-1) : buttons?.[0])?.onPress?.(); } };
export const BackHandler = { addEventListener: (_name: string, callback: () => boolean) => { trace.hardwareBack = callback; return { remove: () => { if (trace.hardwareBack === callback) trace.hardwareBack = null; } }; } };
