

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
  const [selectedFormat, setSelectedFormat] = useState(COLOR_FORMATS[0]);
  const [inputValue, setInputValue] = useState('');
  const [colorResults, setColorResults] = useState({ hex: '', rgb: '', hsl: '', hwb: '', cmyk: '', ncol: '' });
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

  // 失焦或回车时解析
  const handleInputBlurOrEnter = () => {
    const parsed = parseColor(inputValue, selectedFormat.key);
    setColorResults(parsed && Object.keys(parsed).length ? parsed : { hex: '', rgb: '', hsl: '', hwb: '', cmyk: '', ncol: '' });
  };

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
      <div className={styles.rightPanel}></div>
    </div>
  );
}

export default ToolsPanel;
