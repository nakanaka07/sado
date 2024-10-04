/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
// スプレッドシートからデータを取得する関数
async function fetchSheetData(sheetName) {
  // isValidUrl 関数の定義
  function isValidUrl(urlString) {
    try {
      new URL(urlString);
      return true;
    } catch (error) {
      return false;
    }
  }

  debugLog(`fetchSheetData function called for sheet: ${sheetName}`);

  try {
    debugLog(`Fetching data from spreadsheet for sheet: ${sheetName}`);
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/1DNAL3F57kW8r8awyMGc4PRcH52SPMffEpo8z1ZEFOow/gviz/tq?sheet=${sheetName}&tqx=out:csv`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data from sheet ${sheetName}: ${response.status} ${response.statusText}`);
    }

    const csvData = await response.text();
    debugLog(`CSV data received for sheet: ${sheetName}`);

    const parsedData = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    debugLog(`Parsed data for sheet ${sheetName}: ${parsedData.length} rows`);

    const locations = parsedData.map((row) => {
      const lat = parseFloat(row['北緯']);
      const lng = parseFloat(row['東経']);

      if (isNaN(lat) || isNaN(lng)) {
        console.error(`Invalid coordinates in sheet ${sheetName}: lat=${row['北緯']}, lng=${row['東経']}`);
        return null; // 無効な座標はスキップ
      }
      debugLog(`Processing row in sheet ${sheetName}: lat=${lat}, lng=${lng}, title=${row['名称'] || row['店名']}`);

      // 「関連情報」列の値を空白文字で分割
      const relatedInfoList = row['関連情報'] ? row['関連情報'].split(/\s+/) : []; // 空白文字で分割

      // 分割した情報を <li> 要素で囲む
      const relatedInfoItems = relatedInfoList.map((info) => {
        const trimmedInfo = info.trim();// 前後の空白文字を削除
        return isValidUrl(trimmedInfo)
          ? `<li><a href="${trimmedInfo}" target="_blank">${trimmedInfo}</a></li>`
          : `<li>${trimmedInfo}</li>`;
      }).join(''); // 配列の要素を結合

      return {
        lat: lat,
        lng: lng,
        title: row['名称'] || row['店名'] || '', // 「名称」列の値、または「店名」列の値を title プロパティに設定
        details: `<ul>
        ${row['カテゴリー'] ? `<li><b>カテゴリー:</b> ${row['カテゴリー']}</li>` : ''}
        ${row['ジャンル'] ? `<li><b>ジャンル:</b> ${row['ジャンル']}</li>` : ''}
        ${row['月'] ? `<li><b>月:</b> ${row['月']}</li>` : ''}
        ${row['火'] ? `<li><b>火:</b> ${row['火']}</li>` : ''}
        ${row['水'] ? `<li><b>水:</b> ${row['水']}</li>` : ''}
        ${row['木'] ? `<li><b>木:</b> ${row['木']}</li>` : ''}
        ${row['金'] ? `<li><b>金:</b> ${row['金']}</li>` : ''}
        ${row['土'] ? `<li><b>土:</b> ${row['土']}</li>` : ''}
        ${row['日'] ? `<li><b>日:</b> ${row['日']}</li>` : ''}
        ${row['祝'] ? `<li><b>祝:</b> ${row['祝']}</li>` : ''}
        ${row['補足'] ? `<li><b>補足:</b> ${row['補足']}</li>` : ''}
        ${row['予約'] ? `<li><b>予約:</b> ${row['予約']}</li>` : ''}
        ${row['支払'] ? `<li><b>支払:</b> ${row['支払']}</li>` : ''}
        ${row['問い合わせ'] ? `<li><b>問い合わせ:</b> ${row['問い合わせ']}</li>` : ''}
        ${row['所在地'] ? `<li><b>所在地:</b> ${row['所在地']}</li>` : ''}
        ${relatedInfoItems ? `<li><b>関連情報:</b><ul>${relatedInfoItems}</ul></li>` : ''}
        ${(row['Google マップで見る'] && row['Google マップで見る'].trim() !== '') ? `<p><a href="${row['Google マップで見る']}" target="_blank">Google マップで見る</a></p>` : ''}
        </ul>`,
      };
    });

    debugLog(`Processed locations for sheet ${sheetName}: ${locations.length} locations`);
    return locations;
  } catch (error) {
    console.error(`Error fetching data for sheet ${sheetName}:`, error);
    // エラー処理: 例えば、ユーザーにエラーメッセージを表示する
    throw new Error(`${sheetName} のデータの読み込みに失敗しました。`);
  }
}

// デバッグ用の関数
function debugLog(message) {
  console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
}

// fetchSheetData 関数を外部から使用できるように export
export { fetchSheetData };
