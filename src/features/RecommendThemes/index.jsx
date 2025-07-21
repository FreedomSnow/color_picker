import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './RecommendThemes.module.css';
import themesData from '../../config/data/themes.json';

// 缓存变量
let cachedThemes = null;

// 计算文字颜色（黑色或白色）
const getTextColor = (backgroundColor) => {
  // 移除#号并转换为RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // 亮度大于128用黑色文字，否则用白色文字
  return brightness > 128 ? '#000000' : '#ffffff';
};

const RecommendThemes = ({ onThemeSelect }) => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;

  useEffect(() => {
    const loadThemes = async () => {
      // 如果已经有缓存数据，直接使用
      if (cachedThemes) {
        setThemes(cachedThemes);
        setLoading(false);
        return;
      }

      try {
        // 从文件读取数据
        const themesFromFile = themesData.themes;
        
        // 缓存数据
        cachedThemes = themesFromFile;
        
        // 设置状态
        setThemes(themesFromFile);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load themes:', error);
        setLoading(false);
      }
    };

    loadThemes();
  }, []);

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChange = () => {
      // 强制重新渲染
      setThemes([...themes]);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, themes]);

  // 获取当前语言的标题
  const getLocalizedTitle = (titleObj) => {
    if (typeof titleObj === 'string') {
      return titleObj; // 兼容旧格式
    }
    return titleObj[currentLanguage] || titleObj.zh || titleObj.en || t('recommendThemes.untitled');
  };

  if (loading) {
    return <div className={styles.loading}>{t('recommendThemes.loading')}</div>;
  }

  return (
    <div className={styles.grid}>
      {themes.map(theme => (
        <div key={theme.id}>
          <div className={styles.card} onClick={() => onThemeSelect && onThemeSelect(theme)} style={{ cursor: 'pointer' }}>
            <img className={styles.image} src={theme.image} alt="theme" />
            <div className={styles.colors}>
              {theme.colors.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className={styles.colorBlock + (idx === 3 ? ' ' + styles.colorBlockBottom : '')}
                  style={{ backgroundColor: color }}
                >
                  <span 
                    className={styles.colorText}
                    style={{ color: getTextColor(color) }}
                  >
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.title}>{getLocalizedTitle(theme.title)}</div>
        </div>
      ))}
    </div>
  );
};

export default RecommendThemes;
