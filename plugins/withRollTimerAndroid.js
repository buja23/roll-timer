const { withGradleProperties } = require('expo/config-plugins');

// AudioFocusRequest and NotificationChannel require API 26.
module.exports = function withRollTimerAndroid(config) {
  return withGradleProperties(config, config => {
    config.modResults = config.modResults.filter(item => item.type !== 'property' || item.key !== 'android.minSdkVersion');
    config.modResults.push({ type: 'property', key: 'android.minSdkVersion', value: '26' });
    return config;
  });
};
