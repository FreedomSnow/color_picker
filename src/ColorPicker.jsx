import React, { useEffect, useState, useRef } from 'react';
import styles from './ColorPicker.module.css';
import { useTranslation } from 'react-i18next';

const MODE_OPTIONS = [
  { key: 'HSBA', label: 'HSBA', titles: ['H', 'S', 'B', 'A'] },
  { key: 'RGBA', label: 'RGBA', titles: ['R', 'G', 'B', 'A'] },
];

const HSBA_VALUES = [237, 60, 60, '100%'];
const RGBA_VALUES = [237, 60, 60, 1];

const ColorPicker = () => {
  const { i18n, t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [mode, setMode] = useState('HSBA');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleLanguageChange = () => {
      setForceUpdate(prev => prev + 1);
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

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

  const currentOption = MODE_OPTIONS.find(opt => opt.key === mode);
  const values = mode === 'HSBA' ? HSBA_VALUES : RGBA_VALUES;

  return (
    <div className={styles.container}>
      {/* Main Color Picker Area */}
      <div className={styles.pickerArea}>
        <div className={styles.svPanel}>
          <div className={styles.svThumb}></div>
        </div>
        <div className={styles.hueSlider}>
          <div className={styles.hueThumb}></div>
        </div>
        <div className={styles.alphaSlider}>
          <div className={styles.alphaThumb}></div>
        </div>
        <div className={styles.colorSteps}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className={styles.colorStep}></div>
          ))}
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
          <span className={styles.valueHex}>ED3C3C</span>
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