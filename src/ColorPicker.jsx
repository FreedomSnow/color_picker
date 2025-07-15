import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
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

const DEFAULT_H = 0, DEFAULT_S = 50, DEFAULT_B = 50, DEFAULT_A = 1;

const ColorPicker = () => {
  const { i18n, t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [mode, setMode] = useState('RGBA');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 色相（hue）状态，0-359
  const [hue, setHue] = useState(DEFAULT_H);
  // 拖动状态
  const [dragging, setDragging] = useState(false);
  const hueSliderRef = useRef(null);

  // 新增：saturation/brightness拖拽
  const [saturation, setSaturation] = useState(DEFAULT_S);
  const [brightness, setBrightness] = useState(DEFAULT_B);
  // 记录上一次hue
  const prevHueRef = useRef(DEFAULT_H);
  const svPanelRef = useRef(null);
  const [svDragging, setSvDragging] = useState(false);

  // 新增：alpha拖拽
  const [alpha, setAlpha] = useState(DEFAULT_A);
  const alphaSliderRef = useRef(null);
  const [alphaDragging, setAlphaDragging] = useState(false);

  // 计算当前色值
  const s = saturation, b = brightness, a = alpha;
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

  // svThumb位置
  const svPanelRect = svPanelRef.current ? svPanelRef.current.getBoundingClientRect() : {width: 0, height: 0};
  const svThumbLeft = svPanelRect.width > 0 ? (s / 100) * svPanelRect.width : '50%';
  const svThumbTop = svPanelRect.height > 0 ? svPanelRect.height - (b / 100) * svPanelRect.height : '50%';

  // svPanel拖拽/点击
  const handleSvPanelMove = (clientX, clientY) => {
    if (!svPanelRef.current) return;
    const rect = svPanelRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    setSaturation(Math.round((x / rect.width) * 100));
    setBrightness(Math.round(100 - (y / rect.height) * 100));
  };
  const handleSvPanelMouseDown = (e) => {
    if (e.button !== 0) return;
    setSvDragging(true);
    handleSvPanelMove(e.clientX, e.clientY);
  };
  useEffect(() => {
    if (!svDragging) return;
    const handleMove = (e) => {
      handleSvPanelMove(e.touches ? e.touches[0].clientX : e.clientX, e.touches ? e.touches[0].clientY : e.clientY);
    };
    const handleUp = () => setSvDragging(false);
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
  }, [svDragging]);
  const handleSvPanelClick = (e) => {
    handleSvPanelMove(e.clientX, e.clientY);
  };

  // hue变化时svThumb回到中间
  useEffect(() => {
    if (prevHueRef.current !== hue) {
      setSaturation(DEFAULT_S);
      setBrightness(DEFAULT_B);
      prevHueRef.current = hue;
    }
  }, [hue]);

  // svPanel首次渲染后，强制设置svThumb到中间
  useLayoutEffect(() => {
    setSaturation(DEFAULT_S);
    setBrightness(DEFAULT_B);
  }, []);

  // 计算hueThumb位置
  const hueThumbTop = hueSliderRef.current
    ? (hue / 359) * hueSliderRef.current.getBoundingClientRect().height
    : 0;

  // alphaThumb位置
  const alphaSliderRect = alphaSliderRef.current ? alphaSliderRef.current.getBoundingClientRect() : {height: 1};
  const alphaThumbTop = (1 - alpha) * alphaSliderRect.height;

  // alphaSlider拖拽/点击
  const handleAlphaSliderMove = (clientY) => {
    if (!alphaSliderRef.current) return;
    const rect = alphaSliderRef.current.getBoundingClientRect();
    let y = clientY - rect.top;
    y = Math.max(0, Math.min(y, rect.height));
    setAlpha(1 - y / rect.height);
  };
  const handleAlphaSliderMouseDown = (e) => {
    if (e.button !== 0) return;
    setAlphaDragging(true);
    handleAlphaSliderMove(e.clientY);
  };
  useEffect(() => {
    if (!alphaDragging) return;
    const handleMove = (e) => {
      handleAlphaSliderMove(e.touches ? e.touches[0].clientY : e.clientY);
    };
    const handleUp = () => setAlphaDragging(false);
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
  }, [alphaDragging]);
  const handleAlphaSliderClick = (e) => {
    handleAlphaSliderMove(e.clientY);
  };

  // valueRow内容
  const hsbaVals = [hue, s, b, Math.round(alpha * 100) + '%'];
  const rgbaVals = [r, g, bl, Number(alpha.toFixed(2))];
  const currentOption = MODE_OPTIONS.find(opt => opt.key === mode);
  const values = mode === 'HSBA' ? hsbaVals : rgbaVals;

  // svPanel背景色相渐变
  const svPanelBg = `linear-gradient(90deg, #fff, transparent), linear-gradient(0deg, #000, transparent), linear-gradient(0deg, hsl(${hue}, 100%, 50%), hsl(${hue}, 100%, 50%))`;

  return (
    <div className={styles.container}>
      {/* Main Color Picker Area */}
      <div className={styles.pickerArea}>
        <div
          className={styles.svPanel}
          ref={svPanelRef}
          style={{background: svPanelBg}}
          onMouseDown={handleSvPanelMouseDown}
          onClick={handleSvPanelClick}
          onTouchStart={e => { setSvDragging(true); handleSvPanelMove(e.touches[0].clientX, e.touches[0].clientY); }}
        >
          {(svPanelRect.width > 0 && svPanelRect.height > 0) ? (
            <div
              className={styles.svThumb}
              style={{
                left: svThumbLeft - 14,
                top: svThumbTop - 14,
                background: `rgb(${r},${g},${bl})`,
                position: 'absolute',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                zIndex: 2
              }}
            ></div>
          ) : (
            <div
              className={styles.svThumb}
              style={{
                left: '50%',
                top: '50%',
                background: `rgb(${r},${g},${bl})`,
                position: 'absolute',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                zIndex: 2,
                transform: 'translate(-50%, -50%)'
              }}
            ></div>
          )}
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
          <div
            className={styles.alphaSlider}
            ref={alphaSliderRef}
            onMouseDown={handleAlphaSliderMouseDown}
            onClick={handleAlphaSliderClick}
            onTouchStart={e => { setAlphaDragging(true); handleAlphaSliderMove(e.touches[0].clientY); }}
            style={{ background: `linear-gradient(to bottom, rgba(${r},${g},${bl}, 1), rgba(${r},${g},${bl}, 0))` }}
          >
            <div
              className={styles.alphaThumb}
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                top: `${alphaThumbTop}px`,
                background: `rgba(${r},${g},${bl}, 0.1)`
              }}
            ></div>
          </div>
        </div>
        <div className={styles.colorStepsWapper} style={{display: 'flex', flexDirection: 'row', gap: 12}}>
          {/* Shades 列：当前色到黑 */}
          <div className={styles.colorSteps} style={{flex: 1}}>
            {[...Array(11)].map((_, i) => {
              // Shades: 明度从当前明度递减到0
              const stepB = brightness * (1 - i / 10);
              const [sr, sg, sb] = hsvToRgb(hue, saturation, stepB);
              const stepHex = rgbToHex(sr, sg, sb);
              const brightnessVal = (sr * 299 + sg * 587 + sb * 114) / 1000;
              const textColor = brightnessVal > 140 ? '#222' : '#fff';
              const isCurrent = i === 0;
              return (
                <div
                  key={i}
                  className={styles.colorStep}
                  style={{
                    background: `rgb(${sr},${sg},${sb})`,
                    border: isCurrent ? '2px solid #fff' : 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <span className={styles.colorStepHex} style={{color: textColor}}>{stepHex}</span>
                </div>
              );
            })}
          </div>
          {/* Tints 列：当前色到白（Tints算法） */}
          <div className={styles.colorSteps} style={{flex: 1}}>
            {[...Array(11)].map((_, i) => {
              // Tints: 添加量从0到1
              const tintAmount = i / 10;
              const [baseR, baseG, baseB] = hsvToRgb(hue, saturation, brightness);
              const sr = Math.round(baseR + (255 - baseR) * tintAmount);
              const sg = Math.round(baseG + (255 - baseG) * tintAmount);
              const sb = Math.round(baseB + (255 - baseB) * tintAmount);
              const stepHex = rgbToHex(sr, sg, sb);
              const brightnessVal = (sr * 299 + sg * 587 + sb * 114) / 1000;
              const textColor = brightnessVal > 140 ? '#222' : '#fff';
              const isCurrent = i === 0;
              return (
                <div
                  key={i}
                  className={styles.colorStep}
                  style={{
                    background: `rgb(${sr},${sg},${sb})`,
                    border: isCurrent ? '2px solid #fff' : 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <span className={styles.colorStepHex} style={{color: textColor}}>{stepHex}</span>
                </div>
              );
            })}
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
      {/* <div className={styles.swatchBar}>
        <button className={styles.addSwatch}>+</button>
        <div className={styles.swatchList}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className={styles.swatch}></div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default ColorPicker; 