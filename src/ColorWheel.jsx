import React, { useState, useRef, useEffect } from 'react';
import styles from './ColorWheel.module.css';

const PALETTE_OPTIONS = [
  '自定义', '单色', '相似', '互补', '分裂互补', '三分色', '四方色', '复合', '浓度'
];
const MODE_OPTIONS = ['RGB', 'HSB', 'LAB'];

function Dropdown({ title, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={styles.dropdownWrapper} ref={ref}>
      <div className={styles.dropdownTitle}>{title}</div>
      <button className={styles.dropdownBtn} onClick={() => setOpen(v => !v)}>
        <span>{selected}</span>
        <svg style={{marginLeft: 6, verticalAlign: 'middle'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className={styles.dropdownList}>
          {options.map(opt => (
            <div key={opt} className={styles.dropdownItem} onClick={() => {onSelect(opt); setOpen(false);}}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ColorWheel() {
  const [palette, setPalette] = useState(PALETTE_OPTIONS[0]);
  const [mode, setMode] = useState(MODE_OPTIONS[0]);
  return (
    <div className={styles.container}>
      {/* 左右布局 */}
      <div className={styles.leftPanel}>
        {/* 第一行：两个控件 */}
        <div className={styles.typePanel}>
          <Dropdown
            title="模式"
            options={MODE_OPTIONS}
            selected={mode}
            onSelect={setMode}
          />
          <Dropdown
            title="配色"
            options={PALETTE_OPTIONS}
            selected={palette}
            onSelect={setPalette}
          />
        </div>
        {/* 第二行：色轮 */}
        <div className={styles.colorWheelWrapper}>
          <div className={styles.colorWheel}>
          </div>
        </div>
        {/* 第三行：三个按钮 */}
        <div className={styles.buttonWrapper}>
          <button className={styles.actionBtn} onClick={async () => {
            if (window.EyeDropper) {
              const eyeDropper = new window.EyeDropper();
              try {
                const result = await eyeDropper.open();
                alert(result.srgbHex);
              } catch (e) {
                // 用户取消
              }
            } else {
              alert('当前浏览器不支持 EyeDropper API');
            }
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6, verticalAlign: 'middle'}}><path d="M19.07 4.93a3 3 0 0 1 0 4.24l-1.41 1.41-4.24-4.24 1.41-1.41a3 3 0 0 1 4.24 0z"></path><path d="M17.66 9.66 7.05 20.29a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l10.61-10.63"></path><path d="m8.46 19.12 2.83-2.83"></path></svg>
            吸管取色
          </button>
          {/* <button className={styles.actionBtn}>按钮2</button>
          <button className={styles.actionBtn}>按钮3</button> */}
        </div>
      </div>
      <div className={styles.rightPanel}>{/* 右侧内容留空 */}</div>
    </div>
  );
}
