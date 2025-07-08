import styles from "./App.module.css";
import { useState } from "react";
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);
  const tabList = [
    { title: t('app.tab.theme'), desc: t('app.desc.theme') },
    { title: t('app.tab.image'), desc: t('app.desc.image') },
    { title: t('app.tab.color'), desc: t('app.desc.color') },
    { title: t('app.tab.wheel'), desc: t('app.desc.wheel') },
  ];
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <div className={styles.logo}>
            {/* 简单icon，可用emoji或svg */}
            {/* <span role="img" aria-label="palette">🎨</span>  */}
            <span className={styles.logoTitle}>{t('app.title')}</span>
          </div>
          <div className={styles.rightBar}>
            <button className={styles.languageBtn} onClick={() => changeLanguage('zh')}>
              {t('app.language')} <svg style={{marginLeft: '6px', verticalAlign: 'middle'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button className={styles.contactBtn} onClick={() => changeLanguage('zh')}>
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
            {selectedTab === 0 && <div>{t('app.themeContent')}</div>}
            {selectedTab === 1 && <div>{t('app.imageContent')}</div>}
            {selectedTab === 2 && <div>{t('app.colorContent')}</div>}
            {selectedTab === 3 && <div>{t('app.wheelContent')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
