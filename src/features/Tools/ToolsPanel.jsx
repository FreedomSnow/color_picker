

import React, { useState, useRef, useEffect } from 'react';
import styles from './ToolsPanel.module.css';
import { useTranslation } from 'react-i18next';

const COLOR_FORMATS = [
  { key: 'hex', label: 'HEX', placeholder: '#RRGGBB' },
  { key: 'rgb', label: 'RGB', placeholder: 'rgb(255, 255, 255)' },
  { key: 'hsl', label: 'HSL', placeholder: 'hsl(0, 0%, 100%)' },
  { key: 'hwb', label: 'HWB', placeholder: 'hwb(0, 0%, 100%)' },
  { key: 'cmyk', label: 'CMYK', placeholder: 'cmyk(0, 0, 0, 0)' },
  { key: 'ncol', label: 'NCOL', placeholder: 'ncol(0, 0, 0)' },
];


function parseColor(input, type) {
  // 简单色值解析，支持 hex/rgb/hsl/hwb/cmyk/ncol 互转（仅演示，部分格式为伪实现）
  // 实际项目建议用 colorjs.io 或 colord 等库
  input = input.trim();
  if (!input) return {};
  let r=0,g=0,b=0;
  let result = {};
  if (type === 'hex' && /^#([0-9a-fA-F]{6})$/.test(input)) {
    r = parseInt(input.slice(1,3),16);
    g = parseInt(input.slice(3,5),16);
    b = parseInt(input.slice(5,7),16);
  } else if (type === 'rgb' && /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.test(input)) {
    const m = input.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/);
    r = Number(m[1]); g = Number(m[2]); b = Number(m[3]);
  } else {
    // 其他格式可扩展
    return {};
  }
  // HEX
  result.hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
  // RGB
  result.rgb = `rgb(${r}, ${g}, ${b})`;
  // HSL
  let max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h,s,l;
  l = (max+min)/2/255*100;
  if (max===min) { h=s=0; }
  else {
    let d = max-min;
    s = l>50 ? d/(510-max-min)*100 : d/(max+min)*100;
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0);break;
      case g: h=(b-r)/d+2;break;
      case b: h=(r-g)/d+4;break;
    }
    h = Math.round(h*60);
  }
  result.hsl = `hsl(${h||0}, ${Math.round(s)||0}%, ${Math.round(l)||0}%)`;
  // HWB（伪实现）
  result.hwb = `hwb(${h||0}, 0%, 0%)`;
  // CMYK（伪实现）
  let c=0,m=0,y=0,k=0;
  if (max===0) {c=m=y=0;k=100;}
  else {
    c = 100*(1-r/255);
    m = 100*(1-g/255);
    y = 100*(1-b/255);
    k = 100*(1-max/255);
  }
  result.cmyk = `cmyk(${Math.round(c)}, ${Math.round(m)}, ${Math.round(y)}, ${Math.round(k)})`;
  // NCOL（伪实现）
  result.ncol = `ncol(${r}, ${g}, ${b})`;
  return result;
}

function ToolsPanel() {
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // 持久化 key
  const STORAGE_KEY = 'toolsPanelData';
  // 初始化时从 localStorage 读取
  const getInitialData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // 兼容格式
        return {
          selectedFormat: COLOR_FORMATS.find(f => f.key === data.selectedFormat?.key) || COLOR_FORMATS[0],
          inputValue: data.inputValue || '',
          colorResults: data.colorResults || { hex: '', rgb: '', hsl: '', hwb: '', cmyk: '', ncol: '' }
        };
      }
    } catch {}
    return {
      selectedFormat: COLOR_FORMATS[0],
      inputValue: '',
      colorResults: { hex: '', rgb: '', hsl: '', hwb: '', cmyk: '', ncol: '' }
    };
  };
  const [selectedFormat, setSelectedFormat] = useState(getInitialData().selectedFormat);
  const [inputValue, setInputValue] = useState(getInitialData().inputValue);
  const [colorResults, setColorResults] = useState(getInitialData().colorResults);
  const [pendingEyeDropper, setPendingEyeDropper] = useState(null);
  const dropdownRef = useRef(null);

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

  // 持久化保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      selectedFormat,
      inputValue,
      colorResults
    }));
  }, [selectedFormat, inputValue, colorResults]);

  // 失焦或回车时解析
  const handleInputBlurOrEnter = () => {
    const parsed = parseColor(inputValue, selectedFormat.key);
    setColorResults(parsed && Object.keys(parsed).length ? parsed : { hex: '', rgb: '', hsl: '', hwb: '', cmyk: '', ncol: '' });
  };

  // 监听 EyeDropper 结果，自动填充 inputValue 并解析
  useEffect(() => {
    if (pendingEyeDropper) {
      // 先解析 hex 得到所有格式
      const parsed = parseColor(pendingEyeDropper, 'hex');
      console.log('Parsed color:', parsed);
      setColorResults(parsed && Object.keys(parsed).length ? parsed : { hex: '', rgb: '', hsl: '', hwb: '', cmyk: '', ncol: '' });
      // 按当前 selectedFormat 转换 inputValue
      let value = '';
      if (parsed && parsed[selectedFormat.key]) {
        value = parsed[selectedFormat.key];
      }
      // 强制同步 inputValue，触发 input 框和下方色值行更新
      setInputValue(value);
      setTimeout(() => {
        setColorResults(prev => ({ ...prev, [selectedFormat.key]: value }));
      }, 0);
      setPendingEyeDropper(null);
    }
  }, [pendingEyeDropper, selectedFormat]);

  return (
    <div className={styles.toolsPanelRoot}>
      {/* 左侧输入区 */}
      <div className={styles.leftPanel}>
        {/* 标题 */}
        <div className={styles.title}>{t('toolsPanel.title')}</div>
        {/* 第一行：下拉+输入框 */}
        <div className={styles.inputRow}>
          <div className={styles.dropdownWrap} ref={dropdownRef}>
            <button
              className={styles.dropdownBtn}
              onClick={() => setDropdownOpen(v => !v)}
              style={(function() {
                // 仅在输入框有有效颜色时改变背景，否则用默认色
                const parsed = parseColor(inputValue, selectedFormat.key);
                let bg = '#f7f7f7';
                if (parsed && parsed.hex && /^#([0-9a-fA-F]{6})$/.test(parsed.hex)) {
                  bg = parsed.hex;
                }
                // 判断亮度，决定字体颜色
                let color = '#222';
                if (/^#([0-9a-fA-F]{6})$/.test(bg)) {
                  const r = parseInt(bg.slice(1,3),16);
                  const g = parseInt(bg.slice(3,5),16);
                  const b = parseInt(bg.slice(5,7),16);
                  // YIQ公式，亮度阈值 180
                  const yiq = (r*299 + g*587 + b*114) / 1000;
                  color = yiq >= 180 ? '#222' : '#fff';
                }
                return { background: bg, color };
              })()}
            >
              {selectedFormat.label}
              <svg style={{ marginLeft: 6 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                {COLOR_FORMATS.map(fmt => (
                  <div
                    key={fmt.key}
                    className={styles.dropdownItem + (selectedFormat.key === fmt.key ? ' ' + styles.dropdownItemActive : '')}
                    onClick={() => { setSelectedFormat(fmt); setDropdownOpen(false); setInputValue(''); }}
                  >
                    {fmt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            className={styles.inputBox}
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              // 允许输入时立即更新 colorResults 的当前格式内容，其他格式保持原值
              setColorResults(prev => ({ ...prev, [selectedFormat.key]: e.target.value }));
            }}
            placeholder={selectedFormat.placeholder}
            onBlur={handleInputBlurOrEnter}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        {/* 其余6行 */}
        {COLOR_FORMATS.map((fmt, idx) => (
          <div key={fmt.key} className={styles.resultRow}>
            <div className={styles.resultTitle}>{fmt.key}</div>
            <div className={styles.resultContent}>
              {colorResults[fmt.key] || '--'}
            </div>
          </div>
        ))}
      </div>
      {/* 右侧可扩展区域 */}
      <div className={styles.rightPanel}>
        <div className={styles.buttonWrapper}>
          <button className={styles.pickerBtn} onClick={async () => {
            if (window.EyeDropper) {
              const eyeDropper = new window.EyeDropper();
              try {
                const result = await eyeDropper.open();
                // 兼容大小写问题，部分浏览器为 sRGBHex，部分为 srgbHex
                const hex = result.sRGBHex || result.srgbHex;
                if (hex) {
                  setPendingEyeDropper(hex);
                }
              } catch (e) {
                // 用户取消
              }
            } else {
              alert(t('toolsPanel.eyeDropperNotSupported', { defaultValue: '当前浏览器不支持 EyeDropper API' }));
            }
          }}>
            <span className={styles.pickerIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6, verticalAlign: 'middle'}}><path d="M19.07 4.93a3 3 0 0 1 0 4.24l-1.41 1.41-4.24-4.24 1.41-1.41a3 3 0 0 1 4.24 0z"></path><path d="M17.66 9.66 7.05 20.29a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l10.61-10.63"></path><path d="m8.46 19.12 2.83-2.83"></path></svg>
            </span>
            <span className={styles.pickerText}>{t('toolsPanel.screenPickerBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ToolsPanel;
