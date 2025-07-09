import React from 'react';
import styles from './RecommendThemes.module.css';

// 示例数据
const themes = [
  {
    id: 1,
    title: '温暖日落',
    image: 'https://via.placeholder.com/80',
    colors: ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9']
  },
  {
    id: 2,
    title: '清新海洋',
    image: 'https://via.placeholder.com/80',
    colors: ['#92A8D1', '#955251', '#B565A7', '#009B77']
  },
  {
    id: 3,
    title: '活力橙红',
    image: 'https://via.placeholder.com/80',
    colors: ['#DD4124', '#D65076', '#45B8AC', '#EFC050']
  },
  {
    id: 4,
    title: '优雅紫灰',
    image: 'https://via.placeholder.com/80',
    colors: ['#5B5EA6', '#9B2335', '#DFCFBE', '#55B4B0']
  },
];

const RecommendThemes = () => {
  return (
    <div className={styles.grid}>
      {themes.map(theme => (
        <div key={theme.id}>
          <div className={styles.card}>
            <img className={styles.image} src={theme.image} alt="theme" />
            <div className={styles.colors}>
              {theme.colors.map((color, idx) => (
                <div
                  key={idx}
                  className={styles.colorBlock}
                  style={{ backgroundColor: color }}
                >
                  <span className={styles.colorText}>{color}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.title}>{theme.title}</div>
        </div>
      ))}
    </div>
  );
};

export default RecommendThemes; 