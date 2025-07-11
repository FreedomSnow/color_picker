import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ImageColorPicker.module.css';

const demoImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
const demoColors = [
  '#CCD8DE', '#5BACC9', '#35829B', '#EFE4E2', '#F5BBA6', '#2D4645', '#3A5B47'
];
const demoMainColors = [
  { hex: '#EEB09D', rgb: 'rgba(246, 209, 195)' },
  { hex: '#EEB09D', rgb: 'rgba(246, 209, 195)' }
];

// rgb字符串转hex
function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return rgb;
  return (
    '#' +
    result
      .slice(0, 3)
      .map(x => (+x).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

const ImageColorPicker = () => {
  const { t } = useTranslation();
  const [image, setImage] = useState(null); // 默认不显示图片
  const [mainColors, setMainColors] = useState([]); // 颜色数组
  const [palette, setPalette] = useState([]); // 兼容旧逻辑
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // 颜色提取函数（简单版，取像素色块出现频率最高的8个）
  const extractColors = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorMap = {};
    for (let i = 0; i < data.length; i += 4 * 10) { // 步长10，降采样加速
      const r = data[i], g = data[i+1], b = data[i+2];
      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
    const topColors = sorted.slice(0, 8).map(([rgb]) => {
      const [r, g, b] = rgb.split(',');
      return `rgb(${r}, ${g}, ${b})`;
    });
    setPalette(topColors);
  };

  // 处理图片选择
  const handleImageBoxClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  // 拖拽上传
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  // 图片加载后提取主色
  const handleImgLoad = (e) => {
    extractColors(e.target);
  };

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <div className={styles.imageHeader}>
          <div className={styles.imageTitle}>{t('imagePicker.image')}</div>
          <div className={styles.imageActions}>
            <button className={styles.actionBtn} title={t('imagePicker.position')}>
              {/* 定位图标 */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.73 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
            </button>
            <button className={styles.changeImageBtn} title={t('imagePicker.changeImage')}  onClick={handleImageBoxClick}>
              {/* 更换图片图标 */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 21l-6-6M21 21v-4M21 21h-4"/></svg>
            </button>
          </div>
        </div>
        <div
          className={`${styles.imageBox} ${dragActive ? styles.dragActive : ''}`}
          onClick={handleImageBoxClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!image && (
            <>
              <div className={styles.uploadIcon}>
                <svg width="56" height="56" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 21l-6-6M21 21v-4M21 21h-4"/></svg>
              </div>
              <div className={styles.uploadText}>{t('imagePicker.clickToUpload') || 'Click To Upload'}</div>
              <div className={styles.uploadDesc}>{t('imagePicker.orDrag') || 'Or Drag And Drop'}</div>
              <div className={styles.uploadTip}>{t('imagePicker.maxSize') || 'Max File Size: 15 MB'}</div>
            </>
          )}
          {image && (
            <img
              ref={imageRef}
              src={image}
              alt="uploaded"
              className={styles.imagePreview}
              onLoad={handleImgLoad}
            />
          )}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        <div className={styles.paletteTitle}>{t('imagePicker.colorPalette')}</div>
        <div className={styles.paletteRow}>
          {palette.map(color => (
            <div className={styles.paletteColor} key={color}>
              <div className={styles.paletteBlock} style={{ background: color }}></div>
              <div className={styles.paletteHex}>{rgbToHex(color)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.colorsPanel}>
          <div className={styles.colorsTitle}>{t('imagePicker.colors')}</div>
          <div className={styles.colorsList}>
            {mainColors.map((c, i) => (
              <div className={styles.mainColorRow} key={i}>
                <div className={styles.mainColorBlock} style={{ background: c.hex }}></div>
                <div className={styles.mainColorInfo}>
                  <div className={styles.mainColorHex}>HEX: <span>{c.hex.replace('#','').toUpperCase()}</span></div>
                  <div className={styles.mainColorRgb}>RGB: <span>{c.rgb}</span></div>
                </div>
                <button className={styles.copyBtn} title={t('imagePicker.copy')}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageColorPicker; 