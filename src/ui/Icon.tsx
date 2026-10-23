import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from './theme';
export type IconName = 'play' | 'pause' | 'restart' | 'next' | 'stop' | 'rotate' | 'back' | 'arrow-left' | 'more' | 'settings' | 'plus' | 'check' | 'edit' | 'copy' | 'delete' | 'sound' | 'timer';
const paths: Partial<Record<IconName, string>> = {
  play: 'M8 5l11 7-11 7z', pause: 'M8 5v14M16 5v14', restart: 'M3 10a9 9 0 1 1 1 7M3 4v6h6',
  next: 'M5 5l10 7-10 7zM19 5v14', stop: 'M6 6h12v12H6z', back: 'M15 5l-7 7 7 7',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  plus: 'M12 5v14M5 12h14', check: 'M5 12l4 4L19 6', edit: 'M15 4l5 5M4 20l5-1L20 8a2 2 0 0 0-4-4L5 15z',
  copy: 'M9 8V4h11v12h-4M4 8h12v12H4z', delete: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7',
  sound: 'M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',
  rotate: 'M3 9a9 9 0 0 1 15-5M18 1v4h-4M21 15a9 9 0 0 1-15 5M6 23v-4h4',
  timer: 'M9 2h6M12 5V2M18 6l2-2M12 9v5l3 2',
};
export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" accessible={false}>
    {paths[name] && <Path d={paths[name]} />}
    {name === 'rotate' && <Rect x={8} y={6} width={8} height={12} rx={1.5} />}
    {name === 'timer' && <Circle cx={12} cy={14} r={8} />}
    {name === 'more' && <>{[5, 12, 19].map(y => <Circle key={y} cx={12} cy={y} r={1} fill={color} />)}</>}
    {name === 'settings' && <><Path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z" /><Circle cx={12} cy={12} r={3} /></>}
  </Svg>;
}
