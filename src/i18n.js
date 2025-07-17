import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

/**
 * get brower language
 **/
const getDefaultLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;

  // 检查是否是中文（包括 zh-CN, zh-TW, zh-HK 等）
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }

  // 检查是否是英文
  if (browserLang.startsWith('en')) {
    return 'en';
  }

  // 默认返回中文
  return 'zh';
};



i18n // internationalization
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: getDefaultLanguage(), // TODO consider using system language and brower language. definition of priority of options
    fallbackLng: 'en', // english as default
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 