import styles from "./App.module.css";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import RecommendThemes from './RecommendThemes';
import ImageColorPicker from './ImageColorPicker';
import ColorPicker from './ColorPicker';
import ColorWheel from './ColorWheel';
import ContactUs from './components/ContactUs';

function App() {
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(null); // 新增
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const tabList = [
    { title: t('app.tab.theme'), desc: t('app.desc.theme') },
    { title: t('app.tab.image'), desc: t('app.desc.image') },
    { title: t('app.tab.color'), desc: t('app.desc.color') },
    { title: t('app.tab.wheel'), desc: t('app.desc.wheel') },
  ];
  const languages = [
    { code: 'zh', label: t('app.language', { lng: 'zh' }) },
    { code: 'en', label: t('app.language', { lng: 'en' }) },
  ];
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setDropdownOpen(false);
  };
  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <div className={styles.logo}>
            {/* 简单icon，可用emoji或svg */}
            {/* <span role="img" aria-label="palette">🎨</span>  */}
            <span className={styles.logoTitle}>{t('app.title')}</span>
          </div>
          <div className={styles.rightBar} style={{position: 'relative'}}>
            <button
              className={styles.languageBtn}
              onClick={() => setDropdownOpen((v) => !v)}
            >
              {t('app.language')} <svg style={{marginLeft: '6px', verticalAlign: 'middle'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {dropdownOpen && (
              <div className={styles.languageDropdown} ref={dropdownRef}>
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className={styles.languageDropdownItem}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    {lang.label}
                  </div>
                ))}
              </div>
            )}
            <button 
              className={styles.contactBtn}
              onClick={() => setContactModalOpen(true)}
            >
              {t('app.contact')}
            </button>
          </div>
        </div>
        {/* 主体内容 */}
        <div className={styles.mainContent}>
          <div className={styles.verticalTabs}>
            {tabList.map((tab, idx) => (
              <div
                key={tab.title}
                className={selectedTab === idx ? styles.tabCardActive : styles.tabCard}
                onClick={() => setSelectedTab(idx)}
              >
                <div className={styles.tabCardTitle}>{tab.title}</div>
                <div className={styles.tabCardDesc}>{tab.desc}</div>
              </div>
            ))}
          </div>
          <div className={styles.tabContent}>
            {selectedTab === 0 && (
              <RecommendThemes
                onThemeSelect={theme => {
                  setSelectedTheme(theme);
                  setSelectedTab(1);
                }}
              />
            )}
            {selectedTab === 1 && (
              <ImageColorPicker selectedTheme={selectedTheme} />
            )}
            {selectedTab === 2 && <ColorPicker />}
            {selectedTab === 3 && <ColorWheel />}
          </div>
        </div>
      </div>
      
      <ContactUs 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
      />
    </div>
  );
}

export default App;
