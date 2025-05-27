import * as Localization from 'expo-localization';
import i18n from 'i18n-js';

import en from './en.json';
import es from './es.json';

(i18n as any).translations = {
  en,
  es,
};

(i18n as any).locale = Localization.locale.split('-')[0];
(i18n as any).fallbacks = true;

export default i18n;
