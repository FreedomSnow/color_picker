import React, { useRef, useState, useEffect } from 'react';
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

// 颜色聚类函数，RGB距离小于40视为同组
function clusterColors(colorCountMap, threshold = 40) {
  // colorCountMap: { 'r,g,b': count }
  const clusters = [];
  const colorKeys = Object.keys(colorCountMap);
  for (const key of colorKeys) {
    const [r, g, b] = key.split(',').map(Number);
    let found = false;
    for (const cluster of clusters) {
      const [cr, cg, cb] = cluster.representative.split(',').map(Number);
      const dist = Math.sqrt((r-cr)**2 + (g-cg)**2 + (b-cb)**2);
      if (dist < threshold) {
        cluster.members.push({ key, count: colorCountMap[key], rgb: [r,g,b] });
        cluster.total += colorCountMap[key];
        found = true;
        break;
      }
    }
    if (!found) {
      clusters.push({
        representative: key,
        members: [{ key, count: colorCountMap[key], rgb: [r,g,b] }],
        total: colorCountMap[key],
      });
    }
  }
  // 选出每组中占比最大的颜色为代表色
  return clusters.map(cluster => {
    const maxMember = cluster.members.reduce((a, b) => (a.count > b.count ? a : b));
    return {
      hex: rgbToHex(`rgb(${maxMember.rgb[0]}, ${maxMember.rgb[1]}, ${maxMember.rgb[2]})`),
      rgb: `rgba(${maxMember.rgb[0]}, ${maxMember.rgb[1]}, ${maxMember.rgb[2]})`,
      ratio: cluster.total,
    };
  });
}

const ImageColorPicker = ({ selectedTheme }) => {
  const { t } = useTranslation();
  const [image, setImage] = useState(null); // 默认不显示图片
  const [mainColors, setMainColors] = useState([]); // 颜色数组
  const [palette, setPalette] = useState([]); // 兼容旧逻辑
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null); // palette 选中色块
  const [marker, setMarker] = useState(null); // {x, y, color}

  // 如果selectedTheme变化，自动显示图片和颜色
  useEffect(() => {
    if (selectedTheme) {
      setImage(selectedTheme.image);
      // 直接用主题色作为主色
      setPalette(selectedTheme.colors || []);
      setMainColors((selectedTheme.colors || []).map(hex => ({ hex, rgb: hexToRgb(hex) })));
      setSelectedColor(null); // 切换主题时重置选中
    }
  }, [selectedTheme]);

  // hex转rgb
  function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
  }

  // 颜色提取函数（聚类版）
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
    // palette 依然显示原始色块
    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
    const topColors = sorted.slice(0, 8).map(([rgb]) => {
      const [r, g, b] = rgb.split(',');
      return `rgb(${r}, ${g}, ${b})`;
    });
    setPalette(topColors);
    // 聚类并按占比排序
    const clusters = clusterColors(colorMap, 100);
    const total = Object.values(colorMap).reduce((a, b) => a + b, 0);
    const sortedClusters = clusters.sort((a, b) => b.ratio - a.ratio);
    setMainColors(sortedClusters.map(c => ({
      hex: c.hex,
      rgb: c.rgb,
      ratio: (c.ratio / total * 100).toFixed(1) // 百分比
    })));
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

  // 点击图片获取颜色
  const handleImageClick = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    const realX = Math.round(x * scaleX);
    const realY = Math.round(y * scaleY);
    // 获取像素颜色
    const canvas = document.createElement('canvas');
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageRef.current, 0, 0);
    const pixel = ctx.getImageData(realX, realY, 1, 1).data;
    const hex = rgbToHex(`rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);
    const rgb = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    setMarker({ x, y, hex, rgb });
    setSelectedColor(null); // 取消 palette 选中色块
  };

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        {/* 左上：图片头部和图片上传区 */}
        <div className={styles.topleft}>
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
              // onClick={handleImageBoxClick} // 移除点击上传
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
                <div style={{position:'relative', width:'100%', height:'100%'}}>
                  <img
                    ref={imageRef}
                    src={image}
                    alt="uploaded"
                    className={styles.imagePreview}
                    onLoad={handleImgLoad}
                    onClick={handleImageClick}
                    style={{cursor:'crosshair'}}
                  />
                  {marker && (
                    <div style={{
                      position: 'absolute',
                      left: marker.x - 10,
                      top: marker.y - 20,
                      pointerEvents: 'none',
                      zIndex: 10
                    }}>
                      {/* 地图大头针风格icon */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" fill="#f44336"/>
                        <circle cx="12" cy="9" r="2.5" fill="#fff"/>
                      </svg>
                    </div>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
        </div>
        {/* 右上：颜色信息面板 */}
        <div className={styles.topright} style={{ marginLeft: 20 }}>
          <div className={styles.colorsTitle}>{t('imagePicker.colors')}</div>
          <div className={styles.colorsPanel}>
            {marker ? (
              <div className={styles.mainColorInfoPanel}>
                <div className={styles.mainColorBlockVertical} style={{ background: marker.hex }}></div>
                <div className={styles.mainColorTextPanel}>
                  <div className={styles.mainColorHexText}>{t('imagePicker.hex', 'HEX:')} <span>{marker.hex.toUpperCase()}</span></div>
                  <div className={styles.mainColorRgbText}>{t('imagePicker.rgb', 'RGB:')} <span>{marker.rgb}</span></div>
                </div>
              </div>
            ) : (selectedColor || mainColors[0]) && (
              <div className={styles.mainColorInfoPanel}>
                <div className={styles.mainColorBlockVertical} style={{ background: (selectedColor || mainColors[0]).hex }}></div>
                <div className={styles.mainColorTextPanel}>
                  <div className={styles.mainColorHexText}>{t('imagePicker.hex', 'HEX:')} <span>{(selectedColor || mainColors[0]).hex.toUpperCase()}</span></div>
                  <div className={styles.mainColorRgbText}>{t('imagePicker.rgb', 'RGB:')} <span>{(selectedColor || mainColors[0]).rgb}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 下方：色板标题和色板 */}
      <div className={styles.bottom}>
        <div className={styles.paletteTitle}>{t('imagePicker.colorPalette')}</div>
        <div className={styles.paletteRow}>
          {mainColors.map((c, i) => (
            <div
              className={
                selectedColor && selectedColor.hex === c.hex
                  ? `${styles.paletteColor} ${styles.paletteColorActive}`
                  : styles.paletteColor
              }
              key={c.hex + i}
              onClick={() => { setSelectedColor(c); setMarker(null); }}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.paletteBlock} style={{ background: c.hex }}></div>
              <div className={styles.paletteHex}>{c.hex}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageColorPicker; 