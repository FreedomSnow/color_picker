import styles from "./App.module.css";
import { useState } from "react";

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabList = [
    { title: '推荐主题', desc: '精选配色方案，灵感速查' },
    { title: '图片取色', desc: '上传图片，智能提取主色调' },
    { title: '颜色选择', desc: '多种方式精准选色' },
    { title: '色轮调色板', desc: '可视化色轮自由调色' },
  ];
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <div className={styles.logo}>
            {/* 简单icon，可用emoji或svg */}
            {/* <span role="img" aria-label="palette">🎨</span>  */}
            <span className={styles.logoTitle}>ColorPicker</span>
          </div>
          <div className={styles.rightBar}>
            <button className={styles.englishBtn} onClick={() => {document.body.lang = 'en';}}>English <svg style={{marginLeft: '6px', verticalAlign: 'middle'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
            <button className={styles.contactBtn} onClick={() => {document.body.lang = 'en';}}>Contact Us</button>
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
            {selectedTab === 0 && <div>这里是推荐主题内容</div>}
            {selectedTab === 1 && <div>这里是图片取色内容</div>}
            {selectedTab === 2 && <div>这里是颜色选择内容</div>}
            {selectedTab === 3 && <div>这里是色轮调色板内容</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
