// スプレッドシートID
const SPREADSHEET_ID = "1DNAL3F57kW8r8awyMGc4PRcH52SPMffEpo8z1ZEFOow";

// シートごとのマーカーの色設定
const SHEET_STYLES = {
  "公共トイレ": { color: "#ff5d00" },
  "駐車場": { color: "#ffab00" },
  "スナック": { color: "#b5ff00" },
  "両津・相川地区": { color: "#00ff00" },
  "金井・佐和田・新穂・畑野・真野地区": { color: "#00ffe2" },
  "赤泊・羽茂・小木地区": { color: "#00b9ff" },
  "和食": { color: "#2100f1" },
  "中華": { color: "#3d00f1" },
  "洋食": { color: "#ad00f1" },
  "販売": { color: "#f100a7" },
};

// Google Maps API の読み込みが完了したら実行される関数
function initMap() {
  // Google Maps APIが読み込まれているか確認
  if (typeof google === 'undefined') {
    setTimeout(initMap, 100); // 読み込まれていない場合は100ms後に再試行
    return;
  }

  // 地図の設定
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 38.0000, lng: 138.3667 },
    zoom: 10,
  });

  // MarkerClustererの初期化
  const markerCluster = new markerClustererplus.MarkerClusterer({ map });

  // マーカー作成関数
  const createMapMarker = (data, sheetName) => {
    const lat = parseFloat(data.北緯);
    const lng = parseFloat(data.東経);

    // データのバリデーション
    if (isNaN(lat) || isNaN(lng)) {
      console.error(`無効な座標: シート名=${sheetName}, 北緯=${data.北緯}, 東経=${data.東経}`);
      return;
    }

    const title = data['名称'] || data['店名'] || ''; // 名称または店名をタイトルに設定
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: SHEET_STYLES[sheetName].color,
        fillOpacity: 1,
        strokeColor: "#000000",
        strokeWeight: 1,
        scale: 10,
      },
    });

    markerCluster.addMarker(marker);
  };

  // スプレッドシートデータ取得
  const fetchSpreadsheetData = async (sheetName) => {
    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${sheetName}&tqx=out:csv`);
      if (!response.ok) {
        throw new Error(`スプレッドシートデータ取得エラー: ${sheetName}`);
      }
      return await response.text();
    } catch (error) {
      console.error("スプレッドシートデータ取得エラー:", error);
      // エラー処理: 例えば、ユーザーにエラーメッセージを表示
      return null;
    }
  };

  // マーカー作成処理
  const createMarkersFromSheet = async (sheetName) => {
    const csvData = await fetchSpreadsheetData(sheetName);
    if (!csvData) return; // データ取得に失敗した場合は処理を中断

    const parsedData = Papa.parse(csvData, { header: true }).data;
    parsedData.forEach(data => createMapMarker(data, sheetName));
  };

  // 全シートのマーカー作成
  Object.keys(SHEET_STYLES).forEach(createMarkersFromSheet);

  // 現在地ボタン
  const createLocationButton = () => {
    const locationButton = document.createElement("button");
    locationButton.textContent = "現在地に移動";
    locationButton.classList.add("custom-map-control-button");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
    locationButton.addEventListener("click", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude: lat, longitude: lng } }) => {
            const pos = { lat, lng };
            map.setCenter(pos);
            map.setZoom(15);
            new google.maps.Marker({
              position: pos,
              map,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: 'gold',
                fillOpacity: 1,
                strokeColor: 'black',
                strokeWeight: 2,
                scale: 10,
              },
            });
          },
          (error) => {
            console.error("現在地の取得に失敗しました:", error);
            // エラー処理の実装 (例: ユーザーにエラーメッセージを表示)
          }
        );
      } else {
        console.error("現在地を取得できません。");
        // エラー処理の実装 (例: ユーザーにエラーメッセージを表示)
      }
    });
  };

  // 現在地ボタン作成
  createLocationButton();
}

// DOM読み込み後に地図を初期化
document.addEventListener('DOMContentLoaded', initMap);
