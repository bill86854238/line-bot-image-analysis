# 📸 LINE Gemini Image Analyzer

使用 Google Apps Script 建立的 LINE Bot，讓使用者上傳圖片後，透過 Gemini API 分析圖片內容並以文字回覆使用者。

---

## 🚀 功能介紹

- 支援 LINE Bot 接收圖片訊息
- 將圖片轉為 Base64 傳送至 Gemini API 分析
- 回傳分析內容給使用者（以文字訊息呈現）
- 無需儲存至 Google Drive，即時處理與回應

---

## 🛠️ 技術架構

- **LINE Messaging API**：處理圖片上傳與訊息回覆
- **Google Apps Script (GAS)**：作為 Webhook Server
- **Gemini API (Flash / Flash Lite)**：進行圖片內容分析

---

## 🔧 專案設定

### 1. 啟用 Google Apps Script

1. 建立一個新的 Google Apps Script 專案
2. 建立檔案：
   - `程式碼.gs`（主程式）
   - `Log.gs`（可選，用來封裝日誌紀錄功能）

### 2. 設定 LINE Bot

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立 Messaging API Channel
3. 記下：
   - `Channel Access Token`
   - `Channel Secret`
4. 設定 Webhook URL 為部署後的 GAS 網址（`doPost` entry point）

### 3. 啟用 Gemini API 並取得金鑰

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 申請 Gemini API 金鑰（需啟用 Vision 功能）
3. 建議使用 Gemini 1.5 Flash / Flash Lite（1.0 Vision 已棄用）

### 4. 設定環境變數（在 GAS 中加到 Script Properties）

```javascript
LINE_CHANNEL_ACCESS_TOKEN = "你的 LINE Token"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=你的金鑰"
