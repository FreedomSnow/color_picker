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

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }
  return [Math.round(h * 359), Math.round(s * 100), Math.round(v * 100)];
}

const DEFAULT_H = 0, DEFAULT_S = 50, DEFAULT_B = 50, DEFAULT_A = 1;

// 配色算法工具
function getColorCombinations(h, s, b) {
  // h: 0-359, s: 0-100, b: 0-100
  // 返回 [[{h,s,b}, ...], ...]
  // 1. Complement
  const complement = [
    { h, s, b },
    { h: (h + 180) % 360, s, b }
  ];
  // 2. Split-complementary
  const split = [
    { h, s, b },
    { h: (h + 150) % 360, s, b },
    { h: (h + 210) % 360, s, b }
  ];
  // 3. Triadic
  const triadic = [
    { h, s, b },
    { h: (h + 120) % 360, s, b },
    { h: (h + 240) % 360, s, b }
  ];
  // 4. Analogous
  const analogous = [
    { h, s, b },
    { h: (h + 30) % 360, s, b },
    { h: (h + 330) % 360, s, b }
  ];
  // 5. Monochromatic
  const mono = [
    { h, s, b },
    { h, s: Math.max(0, s - 20), b: Math.min(100, b + 20) },
    { h, s: Math.min(100, s + 20), b: Math.max(0, b - 20) }
  ];
  // 6. Tetradic (rectangle)
  const tetradic = [
    { h, s, b },
    { h: (h + 90) % 360, s, b },
    { h: (h + 180) % 360, s, b },
    { h: (h + 270) % 360, s, b }
  ];
  return [
    { name: 'Complement', colors: complement },
    { name: 'Split-complementary', colors: split },
    { name: 'Triadic', colors: triadic },
    { name: 'Analogous', colors: analogous },
    { name: 'Monochromatic', colors: mono },
    { name: 'Tetradic', colors: tetradic },
  ];
}

const ColorPicker = () => {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const getFontFamily = () => lang === 'zh' ? 'XiangCuiSong-Bold, Josefin Slab, serif' : 'Josefin Slab, XiangCuiSong-Bold, serif';
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
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const newHue = Math.round((x / rect.width) * 359);
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
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const newHue = Math.round((x / rect.width) * 359);
    setHue(newHue);
  };

  // svThumb位置
  const svPanelRect = svPanelRef.current ? svPanelRef.current.getBoundingClientRect() : {width: 0, height: 0};
  const svThumbLeft = svPanelRect.width > 0
    ? (s / 100) * svPanelRect.width
    : '50%';
  const svThumbTop = svPanelRect.height > 0
    ? svPanelRect.height - (b / 100) * svPanelRect.height
    : '50%';

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
    setHue(DEFAULT_H); // 保证首次加载hue为0（红色）
  }, []);

  // 计算hueThumb位置
  const hueThumbLeft = hueSliderRef.current
    ? (hue / 359) * hueSliderRef.current.getBoundingClientRect().width
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

  // RGBA输入受控状态（只影响UI，不影响主色盘逻辑）
  const [rgbaInputs, setRgbaInputs] = useState([r, g, bl, a]);
  // 标记是否是用户主动输入，避免死循环
  const userInputRef = useRef(false);
  // 同步主色变化到输入框
  useEffect(() => {
    if (!userInputRef.current) {
      setRgbaInputs([r, g, bl, a]);
    }
  }, [r, g, bl, a]);
  // 监听rgbaInputs变化，反向驱动主色盘
  useEffect(() => {
    if (!userInputRef.current) return;
    const [nr, ng, nb, na] = rgbaInputs;
    const [nh, ns, nbri] = rgbToHsv(nr, ng, nb);
    setHue(nh);
    setSaturation(ns);
    setBrightness(nbri);
    setAlpha(na);
    userInputRef.current = false;
  }, [rgbaInputs]);

  // svPanel背景色相渐变
  // 正确顺序：底层为hue纯色，中间黑色透明渐变（下黑上透明），最上层白色透明渐变（左白右透明）
  const svPanelBg = `
    linear-gradient(90deg, #fff, transparent),
    linear-gradient(0deg, transparent, #000),
    hsl(${hue}, 100%, 50%)
  `;

  return (
    <div className={styles.container}>
      <div className={styles.splitWrap}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <div
            className={styles.svPanel}
            ref={svPanelRef}
            style={{
              background: svPanelBg.trim().replace(/\s+/g, ' '),
            }}
            onMouseDown={handleSvPanelMouseDown}
            onClick={handleSvPanelClick}
            onTouchStart={e => { setSvDragging(true); handleSvPanelMove(e.touches[0].clientX, e.touches[0].clientY); }}
          >
            {(svPanelRect.width > 0 && svPanelRect.height > 0) ? (
              <div
                className={styles.svThumb}
                style={{
                  left: svThumbLeft,
                  top: svThumbTop,
                  transform: 'translate(-50%, -50%)',
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
          {/* 2. hueSliderWapper: same width as svPanel */}
          <div className={styles.hueSliderWapper}>
            <div
              className={styles.hueSlider}
              ref={hueSliderRef}
              onMouseDown={e => { handleHueSliderClick(e); setDragging(true); }}
              onTouchStart={e => { handleHueSliderClick(e); setDragging(true); }}
              onClick={handleHueSliderClick}
            >
              <div
                className={styles.hueThumb}
                style={{
                  left: hueThumbLeft,
                  top: '50%',
                  background: `hsl(${hue}, 100%, 50%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              ></div>
            </div>
          </div>
          {/* 3. valueNumWrap: HEX row */}
          <div className={styles.hexRow}>
            <div className={styles.valueHexTitle}>HEX</div>
            <input
              className={styles.valueHexInput}
              value={hex.toUpperCase()}
              onChange={() => {}} // 逻辑不变
              readOnly
            />
            <div className={styles.hexColorBlock} style={{background: hex}}></div>
          </div>
          {/* 4. valueLabelWrap: 4 rows, R/G/B/A, input + slider */}
          <div className={styles.rgbaRows}>
            {['R','G','B','A'].map((label, idx) => {
              // 滑杆高亮色
              const accent = idx === 0 ? '#f00' : idx === 1 ? '#0f0' : idx === 2 ? '#00f' : '#222';
              const min = idx < 3 ? 0 : 0;
              const max = idx < 3 ? 255 : 1;
              const step = idx < 3 ? 1 : 0.01;
              const percent = ((rgbaInputs[idx] - min) / (max - min)) * 100;
              return (
                <div key={idx} className={styles.rgbaRow}>
                  <span className={styles.rgbaLabel}>{label}</span>
                  <input
                    className={styles.rgbaInput}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={rgbaInputs[idx]}
                    style={{width: 60, margin: '0 8px'}}
                    onChange={e => {
                      const v = idx < 3 ? Math.max(min, Math.min(max, Number(e.target.value))) : Math.max(min, Math.min(max, Number(e.target.value)));
                      userInputRef.current = true;
                      setRgbaInputs(inputs => inputs.map((x, i) => i === idx ? v : x));
                    }}
                  />
                  <input
                    className={styles.rgbaSlider}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={rgbaInputs[idx]}
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      '--slider-accent': accent,
                      '--slider-percent': percent + '%',
                    }}
                    onChange={e => {
                      const v = idx < 3 ? Math.max(min, Math.min(max, Number(e.target.value))) : Math.max(min, Math.min(max, Number(e.target.value)));
                      userInputRef.current = true;
                      setRgbaInputs(inputs => inputs.map((x, i) => i === idx ? v : x));
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {/* Right Panel: 保持原有色阶/色板等内容 */}
        <div className={styles.rightPanel}>
          <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
            {/* 第一列：Variations（含色阶） */}
            <div className={styles.variations}>
              <div className={styles.topTitle} style={{ fontFamily: getFontFamily() }}>{t('colorPicker.variations', 'Variations')}</div>
              <div className={styles.colorStepsWapper}>
                {/* Shades 列：当前色到黑 */}
                <div className={styles.colorSteps}>
                  <div className={styles.secondTitle} style={{ fontFamily: getFontFamily() }}>{t('colorPicker.shades', 'Shades')}</div>
                  {[...Array(11)].map((_, i) => {
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
                        <span className={styles.colorStepHex} style={{ color: textColor }}>{stepHex}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Tints 列：当前色到白（Tints算法） */}
                <div className={styles.colorSteps}>
                  <div className={styles.secondTitle} style={{ fontFamily: getFontFamily() }}>{t('colorPicker.tints', 'Tints')}</div>
                  {[...Array(11)].map((_, i) => {
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
                        <span className={styles.colorStepHex} style={{ color: textColor }}>{stepHex}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* 第二列：Color Combinations */}
            <div className={styles.combinations}>
              <div className={styles.topTitle} style={{ fontFamily: getFontFamily() }}>{t('colorPicker.combinations', 'Color Combinations')}</div>
              {getColorCombinations(hue, saturation, brightness).map((comb, idx) => (
                <div key={comb.name} style={{ marginBottom: 12 }}>
                  <div className={styles.secondTitle} style={{ fontFamily: getFontFamily() }}>{t(`colorPicker.comb.${comb.name.toLowerCase()}`, comb.name)}</div>
                  <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {comb.colors.map((c, i) => {
                      const [cr, cg, cb] = hsvToRgb(c.h, c.s, c.b);
                      const hex = rgbToHex(cr, cg, cb);
                      // 亮度算法: Y = 0.299*R + 0.587*G + 0.114*B
                      const brightnessVal = (cr * 299 + cg * 587 + cb * 114) / 1000;
                      const textColor = brightnessVal > 140 ? '#222' : '#fff';
                      return (
                        <div className={styles.combColorBlock} key={i} style={{ background: hex }}>
                          <span className={styles.colorBlockHexTitle} style={{ color: textColor }}>{hex}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker; 