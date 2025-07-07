import styles from "./App.module.css";

function App() {
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
          <div className={styles.left}>
            <h1>
              There is a <br />
              <span className={styles.highlight}>Better Way</span>
              <br />
              to Secure.
            </h1>
            <div className={styles.contact}>
              <span>●</span> Contact Us
            </div>
            <p className={styles.desc}>
              FynSec is a vulnerability scanner that finds cyber security weaknesses in your digital infrastructure, to avoid costly data breaches.
            </p>
          </div>
          <div className={styles.right}>
            {/* 这里放置图片或3D效果 */}
            <div className={styles.imagePlaceholder}>[图片/3D]</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
