declare module 'react-native-web/dist/exports/Platform' {
  const platform: typeof import('react-native').Platform;
  export default platform;
}
declare module 'react-native-web/dist/exports/Dimensions' {
  const dimensions: typeof import('react-native').Dimensions;
  export default dimensions;
}
declare module 'react-native-web/dist/exports/useWindowDimensions' {
  const useDimensions: typeof import('react-native').useWindowDimensions;
  export default useDimensions;
}
declare module 'react-native-web/dist/exports/Switch' {
  const component: import('react').ComponentType<import('react-native').SwitchProps & { activeThumbColor?: import('react-native').SwitchProps['thumbColor'] }>;
  export default component;
}
