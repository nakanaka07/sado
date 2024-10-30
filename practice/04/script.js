let map, infoWindow, markerCluster;

// シート名とマーカー色の対応表
const sheetColorMap = {
  'シート1': 'green',
  'シート2': 'blue'
};

// スプレッドシートID
const spreadsheetId = '1DNAL3F57kW8r8awyMGc4PRcH52SPMffEpo8z1ZEFOow';

// 取得するシート名の配列
const sheetNames = ['シート1', 'シート2'];

async function initMap() {
  debugLog('initMap function called');

  // 地図オプションの設定
  const mapOptions = {
    center: { lat: 38.0682, lng: 138.3716 }, // 地図の中心座標（佐渡島）
    zoom: 10, // 初期ズームレベル
    mapId: "80e5f5b3e30e783d" // Google Maps Platform で取得したマップID
  };

  // 地図の初期化
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  debugLog(`Map initialized: ${map}`);

  // マーカークラスタを初期化
  markerCluster = new markerClusterer.MarkerClusterer({
    map: map,
    imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
    styles: [
      {
        url: 'https://example.com/cluster_icon.png', // クラスタアイコンの画像URL
        height: 50, // クラスタアイコンの高さ
        width: 50, // クラスタアイコンの幅
        textColor: 'white', // クラスタアイコン内のテキストの色
        textSize: 12, // クラスタアイコン内のテキストのサイズ
        backgroundPosition: 'center center' // 背景画像の位置
      },
      // 必要であれば、異なるズームレベルやクラスタ内のマーカー数に応じて、複数のスタイルを指定できます。
    ]
  });
    debugLog(`MarkerClusterer initialized: ${markerCluster}`);

  // 情報ウィンドウの初期化
  infoWindow = new google.maps.InfoWindow({
    disableAutoPan: false // 情報ウィンドウ表示時に自動的にパンする
  });
  debugLog(`InfoWindow initialized: ${infoWindow}`);

  // 各シートのデータを取得し、マーカーを作成
  for (const sheetName of sheetNames) {
    try {
      const locations = await getSheetData(sheetName);
      debugLog(`Fetched locations from ${sheetName}: ${locations.length} locations`);

      if (locations.length === 0) {
        console.error(`Error: Failed to fetch location data from ${sheetName}.`);
        continue; // 次のシートの処理へ
      }

      createMarkersForSheet(locations, sheetName);
    } catch (error) {
      console.error(`Error processing sheet ${sheetName}:`, error);
      // エラー処理: 例えば、ユーザーにエラーメッセージを表示する
      handleError(`${sheetName} のデータの読み込みに失敗しました。`);
    }
  }

  // 現在地への移動ボタン
  createLocationButton();

  // 地図クリック時のイベントリスナー
  map.addListener("click", () => {
    infoWindow.close();
    debugLog('InfoWindow closed due to map click');
  }, { passive: true });
}

// シートのデータからマーカーを作成する関数
function createMarkersForSheet(locations, sheetName) {
  const markers = locations.map((location, i) => {
    if (!location) return null;
    debugLog(`Creating marker ${i + 1} for ${sheetName}: ${JSON.stringify(location)}`);

    const marker = new google.maps.Marker({
      map: map,
      position: { lat: location.lat, lng: location.lng },
      title: `${sheetName} - ${i + 1}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: sheetColorMap[sheetName] || 'black',
        fillOpacity: 1,
        strokeColor: 'black',
        strokeWeight: 2,
        scale: 10
      }
    });

    debugLog(`Marker ${i + 1} for ${sheetName} created: ${marker}`);

    // マーカークリック時のイベントリスナー
    marker.addListener("click", () => {
      infoWindow.close();
      infoWindow.setContent(
        `<div>
          <h3>${location.title}</h3>
          ${location.details}
        </div>`
      );
      infoWindow.open(map, marker);
      debugLog(`InfoWindow opened for marker ${i + 1} of ${sheetName}`);

      // マーカーをクリックした際に地図の中心をマーカーの位置に設定
      map.setCenter(marker.getPosition());
    });

    return marker;
  });

  // マーカーをクラスタに追加
  markerCluster.addMarkers(markers);
  debugLog(`Markers added to cluster for ${sheetName}: ${markers.length} markers`);
}

// 現在地への移動ボタンを作成する関数
function createLocationButton() {
  debugLog('Creating location button');
  const locationButton = document.createElement("button");
  locationButton.textContent = "現在地に移動";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    debugLog('Location button clicked');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          debugLog(`Current position: ${JSON.stringify(pos)}`);
          map.setCenter(pos);
          map.setZoom(15);
        },
        () => {
          handleLocationError(true);
        }
      );
    } else {
      handleLocationError(false);
    }
  });
}

// スプレッドシートからデータを取得する関数
async function getSheetData(sheetName) {
  debugLog(`getSheetData function called for sheet: ${sheetName}`);

  try {
    debugLog(`Fetching data from spreadsheet for sheet: ${sheetName}`);
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${sheetName}&tqx=out:csv`
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
      debugLog(`Processing row in sheet ${sheetName}: lat=${lat}, lng=${lng}, title=${row['名称']}`);
      return {
        lat: lat,
        lng: lng,
        title: row['名称'] || '', // 「名称」列の値を title プロパティに設定
        details: `<h3>${(row['Google マップで見る'] && row['Google マップで見る'].trim() !== '') ? `<p><a href="${row['Google マップで見る']}" target="_blank">Google マップで見る</a></p>` : ''}</h3>`, // 空欄または無効な場合は空文字を表示
      };
    });

    debugLog(`Processed locations for sheet ${sheetName}: ${locations.length} locations`);
    return locations;
  } catch (error) {
    console.error(`Error fetching data for sheet ${sheetName}:`, error);
    // エラー処理: 例えば、ユーザーにエラーメッセージを表示する
    handleError(`${sheetName} のデータの読み込みに失敗しました。`);
    return [];
  }
}

// 現在地取得エラー時の処理
function handleLocationError(browserHasGeolocation) {
  debugLog(`handleLocationError called: browserHasGeolocation=${browserHasGeolocation}`);

  const errorMessage = browserHasGeolocation
    ? '現在地の取得に失敗しました。'
    : 'このブラウザは位置情報サービスに対応していません。';

  infoWindow.setPosition(map.getCenter());
  infoWindow.setContent(`<div><p>${errorMessage}</p></div>`);
  infoWindow.open(map);

  debugLog(`Error message displayed: ${errorMessage}`);
}

// エラーメッセージを表示する関数
function handleError(message) {
  // 例えば、alertでエラーメッセージを表示する
  alert(message);
}

// Google Maps API の読み込みが完了してから initMap を実行する
//window.addEventListener('load', () => {
//  debugLog('Window load event fired');
//});

// デバッグ用の関数
function debugLog(message) {
  console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
}

// initMap()関数の呼び出しを一番最後に移動
initMap();
