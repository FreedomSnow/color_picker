import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <div className={styles.topBar}>
        <div className={styles.logo}>ColorPicker</div>
        <div className={styles.nav}>
          <button>Services</button>
          <button>Pricing</button> 
          <button>About</button>
        </div>
        <div className={styles.rightBar}>
          <select>
            <option>English</option>
            <option>中文</option>
          </select>
          <button className={styles.connectBtn}>Contact us</button>
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
      {/* 右下角模式切换 */}
      <div className={styles.bottomRight}>
        Crazy mode: <button>On</button> <button>Off</button>
      </div>
    </div>
  );
}

export default App;
