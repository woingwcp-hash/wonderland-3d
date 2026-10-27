# 🎡 數字奇幻樂園 (Number Wonderland 3D)
專為幼稚園幼兒（K1 - K3）設計的 Web 3D 認讀數字與數感互動遊戲。採用 **Three.js** 立體渲染與 **Web Audio API** 即時音樂合成，支援 iPad、觸控大電視及電腦瀏覽器免安裝即開即玩。

---

## 📂 專案檔案架構 (Modular Structure)

```text
number-wonderland-3d/
├── index.html          # 主畫面 HTML 骨架與 UI 介面
├── README.md           # 專案說明文件與開發擴充指南
├── css/
│   └── style.css       # 立體玩具按鈕、動畫與響應式視覺樣式
└── js/
    ├── config.js       # 數字詞庫、積木顏色、玩具獎勵目錄與全局狀態 (gameState)
    ├── audio.js        # 純 Web Audio 合成音效（木琴音階、跳躍聲、金幣聲、過關號角）
    ├── scene3d.js      # Three.js 3D 場景、扭蛋機、小火車、馬利奧舞台及 3D 數字模型生成
    └── main.js         # 四大遊戲模式邏輯、觸控 Raycaster 判定、獎勵系統與 60FPS 動畫迴圈
```

---

## 🎮 四大 3D 遊戲模式
1. **🔮 扭蛋尋寶 (`gacha`)**：觀察目標數字提示卡，在 3D 扭蛋機前找出對應的立體數字公仔。
2. **🚂 數字小火車 (`train`)**：3D 小火車駛入車站並展示車頭數字牌，進行視覺字形配對。
3. **🎨 自由點讀 (`explore`)**：無壓力探索 `1-5` 及 `6-10`，點擊即彈出對應數量的 3D 紅蘋果與木琴音階。
4. **🍄 數字大冒險 (`mario`)**：馬利奧風格 3D 頂磚塊闖關！支援直接點擊空中金磚塊或使用下方方向鍵控制主角跳起頂磚塊、收集 3D 金幣並跑向終點旗杆過關。

---

## 🚀 如何新增下一個小遊戲模式（擴充指南）
1. **在 `index.html` 頂部導航欄**新增一個模式按鈕，例如 `onclick="switchMode('newMode')"`。
2. **在 `js/scene3d.js`** 建立該模式的專屬 `THREE.Group()` 3D 場景物件並加入 `scene`。
3. **在 `js/main.js` 的 `switchMode()` 與 `startNewRound()`** 加入新模式的初始化邏輯，即可共用現有的「星星獎勵」、「數與量 1..N 點數」與「教學調適設定」！

---

## 🌐 部署至 GitHub Pages
1. 將以上檔案上傳至你的 GitHub Repository。
2. 前往 **Settings -> Pages**，在 **Branch** 選擇 `main` (root) 並按 **Save**。
3. 數十秒後即可透過專屬網址在任何 iPad 或課室電子白板上開啟遊玩！