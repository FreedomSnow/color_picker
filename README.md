# ColorPicker

## 项目简介 | Project Introduction

本项目是一个基于 Node.js (Express) + React (Vite) 的全栈网站示例，首页 UI 结构仿照指定设计，适合用作前端练习或全栈项目模板。

This project is a full-stack website example based on Node.js (Express) and React (Vite). The homepage UI is designed according to a given reference, suitable for frontend practice or as a full-stack project template.

---

## 目录结构 | Directory Structure

```
color_picker/
  ├─ backend/         # Node.js/Express 后端 | Backend
  │    └─ index.js
  └─ frontend/        # React 前端 | Frontend
       ├─ src/
       │    ├─ App.jsx
       │    ├─ App.module.css
       │    └─ main.jsx
       ├─ index.html
       ├─ package.json
       └─ vite.config.js
```

---

## 启动方法 | How to Run

### 1. 启动后端 | Start Backend
```bash
cd backend
node index.js
```
后端服务默认运行在 http://localhost:3001

### 2. 启动前端 | Start Frontend
```bash
cd frontend
npm install  # 仅首次需要
npm run dev
```
前端服务默认运行在 http://localhost:5173

---

## 功能说明 | Features
- 响应式首页布局
- 顶部导航栏、右上角语言选择、右下角模式切换
- 可自定义内容和样式
- 后端提供简单 API 示例

---

## 其他 | Others
如需进一步开发、API 对接、UI 美化等，欢迎自行扩展。

For further development, API integration, or UI enhancement, feel free to extend the project. 