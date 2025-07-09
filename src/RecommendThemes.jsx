import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './RecommendThemes.module.css';
import themesData from './data/themes.json';

// 缓存变量
let cachedThemes = null;

const RecommendThemes = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { i18n } = useTranslation();
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
      setForceUpdate(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // 获取当前语言的标题
  const getLocalizedTitle = (titleObj) => {
    if (typeof titleObj === 'string') {
      return titleObj; // 兼容旧格式
    }
    return titleObj[currentLanguage] || titleObj.zh || titleObj.en || 'Untitled';
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  return (
    <div className={styles.grid}>
      {themes.map(theme => (
        <div key={theme.id}>
          <div className={styles.card}>
            <img className={styles.image} src={theme.image} alt="theme" />
            <div className={styles.colors}>
              {theme.colors.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className={styles.colorBlock + (idx === 3 ? ' ' + styles.colorBlockBottom : '')}
                  style={{ backgroundColor: color }}
                >
                  <span className={styles.colorText}>{color}</span>
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