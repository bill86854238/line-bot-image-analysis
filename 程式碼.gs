const LINE_CHANNEL_ACCESS_TOKEN = '';

const GEMINI_API_KEY = '';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + GEMINI_API_KEY;

/**
 * 接收 LINE webhook POST 請求的主入口函式
 * @param {object} e - 請求事件物件
 * @returns {ContentService.TextOutput} 回傳狀態 JSON，告知 LINE 伺服器接收成功
 */
function doPost(e) {
  // 解析 LINE 傳來的事件資料，只取第一個事件（通常一個 webhook call 只會有一個事件）
  const event = JSON.parse(e.postData.contents).events[0];
  
  // 紀錄收到的 LINE 事件
  writeLog("LINE event received", event);

  // 判斷事件是否為「訊息事件」且訊息類型是「圖片」
  if (event.type === 'message' && event.message.type === 'image') {
    const messageId = event.message.id;   // LINE 圖片訊息的 ID，用來下載圖片
    const userId = event.source.userId;   // 發訊息的使用者 ID

    try {
      // 從 LINE 伺服器抓取圖片，回傳 Blob 物件
      const imageBlob = getImageFromLine(messageId);

      // 將圖片送給 Gemini API 進行分析，不需要存到 Google Drive
      const result = analyzeWithGemini(imageBlob);
      
      // 紀錄 Gemini API 回傳的結果
      writeLog("Gemini 回傳", result);

      // 回覆給使用者 Gemini 分析結果
      replyToUser(userId, result);

    } catch (error) {
      // 發生錯誤時，紀錄錯誤訊息並回覆使用者提示
      writeLog("處理圖片錯誤", error.toString());
      replyToUser(userId, "圖片處理失敗，請稍後再試。");
    }

  } else {
    // 若不是圖片訊息，也紀錄收到的訊息內容
    writeLog("收到非圖片訊息", event.message);
  }

  // 回傳給 LINE 一個簡單的成功 JSON，避免 webhook 重發
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 依照 LINE 圖片訊息 ID 從 LINE 伺服器取得圖片 Blob
 * @param {string} messageId - LINE 圖片訊息的 ID
 * @returns {Blob} 圖片的 Blob 物件
 */
function getImageFromLine(messageId) {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const options = {
    headers: {
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,  // 使用頻道存取權杖授權
    },
    muteHttpExceptions: true,
  };
  // 取得圖片並設定檔名為 messageId.jpg
  return UrlFetchApp.fetch(url, options).getBlob().setName(`${messageId}.jpg`);
}

/**
 * 使用 Gemini API 分析圖片內容
 * @param {Blob} imageBlob - 要分析的圖片 Blob
 * @returns {string} Gemini 回傳的分析結果文字，無法辨識則回傳預設訊息
 */
function analyzeWithGemini(imageBlob) {
  const url = GEMINI_API_URL;

  // 將圖片 Blob 轉成 Base64 字串
  const imageBase64 = Utilities.base64Encode(imageBlob.getBytes());

  // 紀錄圖片的 MIME 類型與 Base64 字串前面部分，方便除錯
  writeLog("image mimeType", imageBlob.getContentType());
  writeLog("image base64 start", imageBase64.substring(0, 30));

  // 準備 Gemini API 的請求內容，圖片以 inlineData 方式傳送
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "請幫我分析這張圖片的內容，並用中文回答。",
          },
          {
            inlineData: {
              mimeType: imageBlob.getContentType(),
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true,
  };

  // 呼叫 Gemini API
  const response = UrlFetchApp.fetch(url, options);

  // 將回應解析成 JSON
  const result = JSON.parse(response.getContentText());

  // 紀錄回應與結果，方便除錯
  writeLog("response", response);
  writeLog("result", result);

  // 取出 Gemini 回傳的文字內容，若無則回傳預設錯誤訊息
  return result.candidates?.[0]?.content?.parts?.[0]?.text || "無法辨識圖片內容。";
}

/**
 * 對指定使用者回覆 LINE 訊息
 * @param {string} userId - LINE 使用者 ID
 * @param {string} message - 要回覆的文字訊息
 */
function replyToUser(userId, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [
      {
        type: 'text',
        text: message,
      },
    ],
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    payload: JSON.stringify(payload),
  };

  // 呼叫 LINE Messaging API 發送訊息
  UrlFetchApp.fetch(url, options);
}

