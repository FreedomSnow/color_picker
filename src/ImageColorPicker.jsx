import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ImageColorPicker.module.css';


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

// K-means聚类算法实现
function kmeans(colors, k = 5, maxIter = 10) {
  // colors: [[r,g,b], ...]
  // k: 聚类数
  // maxIter: 最大迭代次数
  if (colors.length === 0) return [];
  // 随机初始化中心点
  let centroids = [];
  const used = new Set();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * colors.length);
    if (!used.has(idx)) {
      centroids.push(colors[idx]);
      used.add(idx);
    }
  }
  let assignments = new Array(colors.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // 1. 分配每个点到最近的中心
    for (let i = 0; i < colors.length; i++) {
      let minDist = Infinity, minIdx = 0;
      for (let j = 0; j < centroids.length; j++) {
        const d = Math.sqrt(
          (colors[i][0] - centroids[j][0]) ** 2 +
          (colors[i][1] - centroids[j][1]) ** 2 +
          (colors[i][2] - centroids[j][2]) ** 2
        );
        if (d < minDist) {
          minDist = d;
          minIdx = j;
        }
      }
      assignments[i] = minIdx;
    }
    // 2. 更新中心点
    const newCentroids = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = Array(k).fill(0);
    for (let i = 0; i < colors.length; i++) {
      const c = assignments[i];
      newCentroids[c][0] += colors[i][0];
      newCentroids[c][1] += colors[i][1];
      newCentroids[c][2] += colors[i][2];
      counts[c]++;
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        newCentroids[j][0] = Math.round(newCentroids[j][0] / counts[j]);
        newCentroids[j][1] = Math.round(newCentroids[j][1] / counts[j]);
        newCentroids[j][2] = Math.round(newCentroids[j][2] / counts[j]);
      } else {
        // 若某类无点，随机重置
        newCentroids[j] = colors[Math.floor(Math.random() * colors.length)];
      }
    }
    // 检查收敛
    let converged = true;
    for (let j = 0; j < k; j++) {
      if (
        centroids[j][0] !== newCentroids[j][0] ||
        centroids[j][1] !== newCentroids[j][1] ||
        centroids[j][2] !== newCentroids[j][2]
      ) {
        converged = false;
        break;
      }
    }
    centroids = newCentroids;
    if (converged) break;
  }
  // 统计每个聚类的数量
  const clusterCounts = Array(k).fill(0);
  for (let i = 0; i < assignments.length; i++) {
    clusterCounts[assignments[i]]++;
  }
  // 返回聚类中心和占比
  return centroids.map((c, i) => ({
    rgb: `rgb(${c[0]}, ${c[1]}, ${c[2]})`,
    hex: rgbToHex(`rgb(${c[0]}, ${c[1]}, ${c[2]})`),
    ratio: clusterCounts[i]
  }));
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
  const [kValue, setKValue] = useState(5); // K值，默认5
  const [kInput, setKInput] = useState('5'); // 输入框受控
  const [kError, setKError] = useState('');
  const [hoverPos, setHoverPos] = useState(null); // 鼠标悬停坐标
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierColor, setMagnifierColor] = useState({hex: '', rgb: ''});
  const magnifierRef = useRef(null);

  // 如果selectedTheme变化，自动显示图片和颜色
  useEffect(() => {
    if (selectedTheme) {
      setImage(selectedTheme.image);
      // 直接用主题色作为主色
      setPalette(selectedTheme.colors || []);
      setMainColors((selectedTheme.colors || []).map(hex => ({ hex, rgb: hexToRgb(hex) })));
      setSelectedColor(null); // 切换主题时重置选中
      setKInput(String(kValue));
      setKError('');
    }
  }, [selectedTheme]);

  // hex转rgb
  function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
  }

  // 颜色提取函数（K-means版）
  const extractColors = (img, k = kValue) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorArr = [];
    for (let i = 0; i < data.length; i += 4 * 10) { // 步长10，降采样加速
      const r = data[i], g = data[i+1], b = data[i+2];
      colorArr.push([r, g, b]);
    }
    // palette 依然显示原始色块
    const colorMap = {};
    for (let i = 0; i < colorArr.length; i++) {
      const key = colorArr[i].join(',');
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
    const topColors = sorted.slice(0, 8).map(([rgb]) => {
      const [r, g, b] = rgb.split(',');
      return `rgb(${r}, ${g}, ${b})`;
    });
    setPalette(topColors);
    // K-means聚类
    const clusters = kmeans(colorArr, k, 10);
    const total = colorArr.length;
    const sortedClusters = clusters.sort((a, b) => b.ratio - a.ratio);
    setMainColors(sortedClusters.map(c => ({
      hex: c.hex,
      rgb: c.rgb,
      ratio: (c.ratio / total * 100).toFixed(1) // 百分比
    })));
    // 默认选中第一个主色
    setTimeout(() => {
      if (sortedClusters.length > 0) {
        setSelectedColor({
          hex: sortedClusters[0].hex,
          rgb: sortedClusters[0].rgb,
          ratio: (sortedClusters[0].ratio / total * 100).toFixed(1)
        });
      }
    }, 0);
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
    extractColors(e.target, kValue);
  };

  // 点击图片获取颜色
  const handleImageClick = (e) => {
    if (!imageRef.current) return;
    const imgRect = imageRef.current.getBoundingClientRect();
    const boxRect = imageRef.current.parentElement.getBoundingClientRect();
    // 鼠标在图片上的相对坐标
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;
    // 鼠标在imageBox内的绝对坐标（用于marker定位）
    const markerLeft = imgRect.left - boxRect.left + x;
    const markerTop = imgRect.top - boxRect.top + y;
    // 取色逻辑
    const scaleX = imageRef.current.naturalWidth / imgRect.width;
    const scaleY = imageRef.current.naturalHeight / imgRect.height;
    const realX = Math.round(x * scaleX);
    const realY = Math.round(y * scaleY);
    const canvas = document.createElement('canvas');
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageRef.current, 0, 0);
    const pixel = ctx.getImageData(realX, realY, 1, 1).data;
    const hex = rgbToHex(`rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);
    const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    setMarker({ left: markerLeft, top: markerTop, hex, rgb });
    setSelectedColor(null);
  };

  // 鼠标在图片上移动，显示十字准星和放大镜
  const handleImageMouseMove = (e) => {
    if (!imageRef.current) return;
    const imgRect = imageRef.current.getBoundingClientRect();
    const boxRect = imageRef.current.parentElement.getBoundingClientRect();
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;
    setHoverPos({ x, y, imgRect, boxRect });
    setShowMagnifier(true);
  };
  const handleImageMouseLeave = () => {
    setShowMagnifier(false);
    setHoverPos(null);
  };
  const handleImageMouseEnter = () => {
    setShowMagnifier(true);
  };

  // 放大镜绘制逻辑
  useEffect(() => {
    if (!showMagnifier || !hoverPos || !imageRef.current || !magnifierRef.current) return;
    const img = imageRef.current;
    const canvas = magnifierRef.current;
    const ctx = canvas.getContext('2d');
    // 放大镜参数
    const zoom = 6; // 放大倍数
    const size = 15; // 取样区域大小
    const magSize = 90; // 放大镜canvas大小
    // 计算真实像素坐标
    const scaleX = img.naturalWidth / hoverPos.imgRect.width;
    const scaleY = img.naturalHeight / hoverPos.imgRect.height;
    const realX = Math.round(hoverPos.x * scaleX);
    const realY = Math.round(hoverPos.y * scaleY);
    // 取样区域左上角
    const sx = Math.max(0, realX - Math.floor(size / 2));
    const sy = Math.max(0, realY - Math.floor(size / 2));
    // 清空
    ctx.clearRect(0, 0, magSize, magSize);
    // 绘制像素块放大内容
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      sx, sy, size, size,
      0, 0, magSize, magSize
    );
    // 绘制中心小红色十字标
    ctx.save();
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 3;
    const center = magSize / 2;
    const crossLen = 10; // 十字长度
    ctx.beginPath();
    ctx.moveTo(center - crossLen / 2, center);
    ctx.lineTo(center + crossLen / 2, center);
    ctx.moveTo(center, center - crossLen / 2);
    ctx.lineTo(center, center + crossLen / 2);
    ctx.stroke();
    ctx.restore();
    // 采样中心像素色值
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);
    const pixel = tempCtx.getImageData(realX, realY, 1, 1).data;
    const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    const hex = rgbToHex(rgb);
    setMagnifierColor({hex, rgb});
  }, [showMagnifier, hoverPos]);

  // 放大镜位置自适应计算
  let magLeft = 0, magTop = 0, colorPanelTop = 0;
  if (showMagnifier && hoverPos) {
    const magSize = 90;
    const margin = 8;
    const boxWidth = hoverPos.imgRect.width;
    const boxHeight = hoverPos.imgRect.height;
    magLeft = hoverPos.x + (hoverPos.imgRect.left - hoverPos.boxRect.left) + 32;
    magTop = hoverPos.y + (hoverPos.imgRect.top - hoverPos.boxRect.top) - 45;
    // 右侧超出
    if (hoverPos.x + 32 + magSize > boxWidth) {
      magLeft = hoverPos.x + (hoverPos.imgRect.left - hoverPos.boxRect.left) - magSize - 16;
    }
    // 上方超出
    if (hoverPos.y - 45 < 0) {
      magTop = hoverPos.y + (hoverPos.imgRect.top - hoverPos.boxRect.top) + margin;
    }
    // 下方超出
    if (hoverPos.y + margin + magSize > boxHeight) {
      magTop = boxHeight - magSize - margin;
    }
    colorPanelTop = magTop + magSize + 4;
    if (colorPanelTop + 28 > boxHeight) {
      colorPanelTop = magTop - 28;
    }
  }

  return (
    <div className={styles.root}>
        {/* Left side: two rows */}
        <div className={styles.leftPanel}>
          {/* First row: image upload */}
          <div className={styles.imageWapper}>
            <div className={styles.imageHeader}>
              <div className={styles.imageTitle}>{t('imagePicker.image')}</div>
              <div className={styles.imageActions}>
                {/* <button className={styles.actionBtn} title={t('imagePicker.position')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.73 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
                </button> */}
                <button className={styles.changeImageBtn} title={t('imagePicker.changeImage')}  onClick={handleImageBoxClick}>
                  {/* 更换图片图标 */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 21l-6-6M21 21v-4M21 21h-4"/></svg>
                </button>
              </div>
            </div>
            <div
              className={`${styles.imageBox} ${dragActive ? styles.dragActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!image && (
                <div className={styles.uploadPanel} onClick={handleImageBoxClick} style={{cursor: 'pointer'}}>
                  <div className={styles.uploadIcon}>
                    <svg width="56" height="56" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 21l-6-6M21 21v-4M21 21h-4"/></svg>
                  </div>
                  <div className={styles.uploadText}>{t('imagePicker.clickToUpload') || 'Click To Upload'}</div>
                  <div className={styles.uploadDesc}>{t('imagePicker.orDrag') || 'Or Drag And Drop'}</div>
                  <div className={styles.uploadTip}>{t('imagePicker.maxSize') || 'Max File Size: 15 MB'}</div>
                </div>
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
                    onMouseMove={handleImageMouseMove}
                    onMouseLeave={handleImageMouseLeave}
                    onMouseEnter={handleImageMouseEnter}
                    style={{cursor:'crosshair'}}
                  />
                  {/* 移除跟随鼠标的蓝色十字准星SVG */}
                  {/* 放大镜 */}
                  {showMagnifier && hoverPos && (
                    <>
                      <canvas
                        ref={magnifierRef}
                        width={90}
                        height={90}
                        style={{
                          position: 'absolute',
                          left: magLeft,
                          top: magTop,
                          width: 90,
                          height: 90,
                          borderRadius: '50%',
                          border: '3px solid #fff',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                          zIndex: 30,
                          pointerEvents: 'none',
                          background: '#fff',
                        }}
                      />
                      {/* 放大镜下方色值 */}
                      <div
                        style={{
                          position: 'absolute',
                          left: magLeft,
                          top: colorPanelTop,
                          zIndex: 31,
                          background: 'rgba(255,255,255,0.95)',
                          color: '#222',
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          border: '1px solid #eee',
                          fontFamily: 'monospace',
                        }}
                      >
                        {magnifierColor.hex} / {magnifierColor.rgb}
                      </div>
                    </>
                  )}
                  {/* marker图标 */}
                  {marker && (
                    <div style={{
                      position: 'absolute',
                      left: marker.left - 10,
                      top: marker.top - 20,
                      pointerEvents: 'none',
                      zIndex: 10,
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35)) drop-shadow(0 0 2px #fff)'
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
          {/* Second row: colorsTitle and colorsPanel */}
          <div>
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
        {/* Right side: paletteTitle and paletteRow */}
        <div style={{ flex: 1, marginLeft: 32, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div className={styles.paletteTitle}>{t('imagePicker.colorPalette')}</div>
            <label className={styles.kInputTitle} htmlFor="k-input">{t('imagePicker.kInputLabel')}</label>
            <input
              className={styles.kInput}
              id="k-input"
              type="number"
              min={3}
              max={20}
              value={kInput}
              placeholder={t('imagePicker.kInputPlaceholder')}
              onChange={e => {
                setKInput(e.target.value);
                setKError('');
              }}
              onBlur={e => {
                let v = Number(e.target.value);
                if (!Number.isInteger(v) || v < 3 || v > 20) {
                  setKError(t('imagePicker.kInputError'));
                  setKInput(String(kValue));
                  return;
                }
                setKValue(v);
                setKInput(String(v));
                setKError('');
                // 重新聚类
                if (imageRef.current) {
                  // 重新聚类后，按marker状态决定选中逻辑
                  const img = imageRef.current;
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  ctx.drawImage(img, 0, 0);
                  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                  const colorArr = [];
                  for (let i = 0; i < data.length; i += 4 * 10) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    colorArr.push([r, g, b]);
                  }
                  // palette 依然显示原始色块
                  const colorMap = {};
                  for (let i = 0; i < colorArr.length; i++) {
                    const key = colorArr[i].join(',');
                    colorMap[key] = (colorMap[key] || 0) + 1;
                  }
                  const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
                  const topColors = sorted.slice(0, 8).map(([rgb]) => {
                    const [r, g, b] = rgb.split(',');
                    return `rgb(${r}, ${g}, ${b})`;
                  });
                  setPalette(topColors);
                  // K-means聚类
                  const clusters = kmeans(colorArr, v, 10);
                  const total = colorArr.length;
                  const sortedClusters = clusters.sort((a, b) => b.ratio - a.ratio);
                  setMainColors(sortedClusters.map(c => ({
                    hex: c.hex,
                    rgb: c.rgb,
                    ratio: (c.ratio / total * 100).toFixed(1)
                  })));
                  // 选中逻辑
                  setTimeout(() => {
                    if (marker) {
                      // marker存在，paletteRow无高亮，selectedColor=null
                      setSelectedColor(null);
                    } else {
                      // marker为空，paletteRow第一个高亮，更新colorsTitle/colorsPanel
                      if (sortedClusters.length > 0) {
                        setSelectedColor({
                          hex: sortedClusters[0].hex,
                          rgb: sortedClusters[0].rgb,
                          ratio: (sortedClusters[0].ratio / total * 100).toFixed(1)
                        });
                        setMarker(null);
                      }
                    }
                  }, 0);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
            />
            {kError && <span className={styles.kInputErrorTitle}>{kError}</span>}
          </div>
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