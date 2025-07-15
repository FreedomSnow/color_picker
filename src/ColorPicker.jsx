import React, { useEffect, useState, useRef } from 'react';
import styles from './ColorPicker.module.css';
import { useTranslation } from 'react-i18next';

const MODE_OPTIONS = [
  { key: 'HSBA', label: 'HSBA', titles: ['H', 'S', 'B', 'A'] },
  { key: 'RGBA', label: 'RGBA', titles: ['R', 'G', 'B', 'A'] },
];

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  let r = Math.round(f(5) * 255), g = Math.round(f(3) * 255), b = Math.round(f(1) * 255);
  return [r, g, b];
}
function rgbToHex(r, g, b) {
  return (
    '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  );
}

const DEFAULT_H = 0, DEFAULT_S = 60, DEFAULT_B = 60, DEFAULT_A = 1;

const ColorPicker = () => {
  const { i18n, t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [mode, setMode] = useState('HSBA');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 色相（hue）状态，0-359
  const [hue, setHue] = useState(DEFAULT_H);
  // 拖动状态
  const [dragging, setDragging] = useState(false);
  const hueSliderRef = useRef(null);

  // 计算当前色值
  const s = DEFAULT_S, b = DEFAULT_B, a = DEFAULT_A;
  const [r, g, bl] = hsvToRgb(hue, s, b);
  const hex = rgbToHex(r, g, bl);

  // 处理下拉关闭
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

  // 语言切换刷新
  useEffect(() => {
    const handleLanguageChange = () => setForceUpdate(v => v + 1);
    i18n.on('languageChanged', handleLanguageChange);
    return () => { i18n.off('languageChanged', handleLanguageChange); };
  }, [i18n]);

  // 拖动hueThumb
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      const slider = hueSliderRef.current;
      if (!slider) return;
      const rect = slider.getBoundingClientRect();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let y = clientY - rect.top;
      y = Math.max(0, Math.min(y, rect.height));
      const newHue = Math.round((y / rect.height) * 359);
      setHue(newHue);
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging]);

  // 点击hueSlider
  const handleHueSliderClick = (e) => {
    const slider = hueSliderRef.current;
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let y = clientY - rect.top;
    y = Math.max(0, Math.min(y, rect.height));
    const newHue = Math.round((y / rect.height) * 359);
    setHue(newHue);
  };

  // 计算hueThumb位置
  const hueThumbTop = hueSliderRef.current
    ? (hue / 359) * hueSliderRef.current.getBoundingClientRect().height
    : 0;

  // valueRow内容
  const hsbaVals = [hue, s, b, Math.round(a * 100) + '%'];
  const rgbaVals = [r, g, bl, a];
  const currentOption = MODE_OPTIONS.find(opt => opt.key === mode);
  const values = mode === 'HSBA' ? hsbaVals : rgbaVals;

  // svPanel背景色相渐变
  const svPanelBg = `linear-gradient(90deg, #fff, transparent), linear-gradient(0deg, #000, transparent), linear-gradient(0deg, hsl(${hue}, 100%, 50%), hsl(${hue}, 100%, 50%))`;

  return (
    <div className={styles.container}>
      {/* Main Color Picker Area */}
      <div className={styles.pickerArea}>
        <div className={styles.svPanel} style={{background: svPanelBg}}>
          <div className={styles.svThumb}></div>
        </div>
        <div className={styles.hueSliderWapper}>
          <div
            className={styles.hueSlider}
            ref={hueSliderRef}
            onMouseDown={e => { handleHueSliderClick(e); setDragging(true); }}
            onTouchStart={e => { handleHueSliderClick(e); setDragging(true); }}
            onClick={handleHueSliderClick}
            style={{position:'relative', height: '100%'}}
          >
            <div
              className={styles.hueThumb}
              style={{
                top: hueSliderRef.current ? `${(hue / 359) * hueSliderRef.current.getBoundingClientRect().height}px` : '0px',
                background: `hsl(${hue}, 100%, 50%)`
              }}
            ></div>
          </div>
        </div>
        <div className={styles.alphaSliderWapper}>
          <div className={styles.alphaSlider}>
            <div className={styles.alphaThumb}></div>
          </div>
        </div>
        <div className={styles.colorStepsWapper}>
          <div className={styles.colorSteps}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className={styles.colorStep}></div>
            ))}
          </div>
        </div>
      </div>
      {/* Color Value Display */}
      <div className={styles.valueRow}>
        <div className={styles.valueLabelWrap}>
          <span className={styles.valueLabel}>{mode}</span>
          <button className={styles.valueDropdownBtn} onClick={() => setDropdownOpen(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" fill="none" stroke="#333" strokeWidth="2"/></svg>
          </button>
          {dropdownOpen && (
            <div className={styles.valueDropdown} ref={dropdownRef}>
              {MODE_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  className={styles.valueDropdownItem}
                  onClick={() => { setMode(opt.key); setDropdownOpen(false); }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
        {values.map((val, idx) => (
          <div key={idx} className={styles.valueNumWrap}>
            <span className={styles.valueNum}>{val}</span>
            <div className={styles.valueNumTitle}>{currentOption.titles[idx]}</div>
          </div>
        ))}
        <div className={styles.valueNumWrap}>
          <span className={styles.valueHex}>{hex.toUpperCase()}</span>
          <div className={styles.valueHexTitle}>HEX</div>
        </div>
      </div>
      {/* Color Swatches */}
      <div className={styles.swatchBar}>
        <button className={styles.addSwatch}>+</button>
        <div className={styles.swatchList}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className={styles.swatch}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker; 