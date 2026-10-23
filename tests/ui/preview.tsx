import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Home from '../../src/app/index';
import Timer from '../../src/app/timer';
import Settings from '../../src/app/settings';
import Workout from '../../src/app/workout';
import { PreviewParams, PreviewProvider } from './mocks';
const query = new URLSearchParams(window.location.search);
function Preview() {
  const [history, setHistory] = useState([{ name: query.get('screen') ?? 'index', params: {} as Record<string, string> }]);
  const current = history.at(-1)!;
  useEffect(() => {
    const listener = (event: Event) => {
      const { type, path } = (event as CustomEvent).detail;
      if (type === 'back') { setHistory(h => h.length > 1 ? h.slice(0, -1) : [{ name: 'index', params: {} }]); return; }
      const route = { name: (typeof path === 'string' ? path : path.pathname).replace(/^\//, '') || 'index', params: typeof path === 'object' ? path.params ?? {} : {} };
      setHistory(h => type === 'replace' ? [...h.slice(0, -1), route] : [...h, route]);
    };
    window.addEventListener('preview-navigation', listener);
    return () => window.removeEventListener('preview-navigation', listener);
  }, []);
  const notch = query.has('notch');
  const insets = notch ? { top: 0, bottom: 16, left: 44, right: 20 } : { top: 24, bottom: 16, left: 0, right: 0 };
  const Screen = current.name === 'timer' ? Timer : current.name === 'settings' ? Settings : current.name === 'workout' ? Workout : Home;
  return <SafeAreaFrameContext.Provider value={{ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }}><SafeAreaInsetsContext.Provider value={insets}><PreviewProvider><PreviewParams value={current.params}><Screen /></PreviewParams></PreviewProvider></SafeAreaInsetsContext.Provider></SafeAreaFrameContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
