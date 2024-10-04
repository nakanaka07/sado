let map, infoWindow, markerCluster;

async function initMap() {
  console.log('initMap function called'); // デバッグ用ログ

  // 地図オプションの設定
  const mapOptions = {
    center: { lat: 38.0682, lng: 138.3716 }, // 地図の中心座標（佐渡島）
    zoom: 10, // 初期ズームレベル
    mapId: "80e5f5b3e30e783d" // Google Maps Platform で取得したマップID
  };

  // 地図の初期化
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  console.log('Map initialized:', map); // デバッグ用ログ

  // マーカークラスタを初期化
  markerCluster = new markerClusterer.MarkerClusterer({
    map: map,
    imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
  });
  console.log('MarkerClusterer initialized:', markerCluster); // デバッグ用ログ

  // 情報ウィンドウの初期化
  infoWindow = new google.maps.InfoWindow({
    disableAutoPan: false // 情報ウィンドウ表示時に自動的にパンする
  });
  console.log('InfoWindow initialized:', infoWindow); // デバッグ用ログ

  // スプレッドシートからデータを取得
  console.log('Fetching sheet data...'); // デバッグ用ログ
  const locations = await getSheetData();
  console.log('Fetched locations:', locations); // デバッグ用ログ

  // データ取得に失敗した場合の処理
  if (locations.length === 0) {
    console.error('Error: Failed to fetch location data.');
    // エラーメッセージを表示
    const errorMessage = document.createElement('div');
    errorMessage.textContent = '地図データの取得に失敗しました。';
    errorMessage.style.color = 'red';
    document.getElementById('map').appendChild(errorMessage);
    return; // initMap 関数を終了
  }

  // マーカーの作成
  const markers = locations.map((location, i) => {
    if (!location) return null;
    console.log(`Creating marker ${i + 1}:`, location); // デバッグ用ログ

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: `${i + 1}`
    });
    console.log(`Marker ${i + 1} created:`, marker); // デバッグ用ログ

    // マーカークリック時のイベントリスナー
    marker.addListener("click", () => {
      infoWindow.close(); // 既に開いている情報ウィンドウを閉じる
      infoWindow.setContent(
        `<div>
          <h3>${location.title}</h3>
          <p>${location.details}</p>
        </div>`
      );
      infoWindow.open(map, marker);
      console.log(`InfoWindow opened for marker ${i + 1}`); // デバッグ用ログ

      // マーカーをクリックした際に地図の中心をマーカーの位置に設定
      map.setCenter({ lat: location.lat, lng: location.lng });
    });

    return marker;
  });

  // マーカーをクラスタに追加
  markerCluster.addMarkers(markers);
  console.log('Markers added to cluster:', markers.length); // デバッグ用ログ

  // 現在地への移動ボタン
  createLocationButton();

  // 地図クリック時のイベントリスナー
  map.addListener("click", () => {
    infoWindow.close(); // 開いている情報ウィンドウを閉じる
    console.log('InfoWindow closed due to map click'); // デバッグ用ログ
  }, { passive: true });
}

// 現在地への移動ボタンを作成する関数
function createLocationButton() {
  console.log('Creating location button'); // デバッグ用ログ
  const locationButton = document.createElement("button");
  locationButton.textContent = "現在地に移動";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    console.log('Location button clicked'); // デバッグ用ログ
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Current position:', pos); // デバッグ用ログ
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
async function getSheetData() {
  console.log('getSheetData function called');

  const spreadsheetId = '1DNAL3F57kW8r8awyMGc4PRcH52SPMffEpo8z1ZEFOow'; // スプレッドシートのID
  const sheetName = 'シート1'; // シート名

  try {
    console.log('Fetching data from spreadsheet...');
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${sheetName}&tqx=out:csv`
    );
    const csvData = await response.text();
    console.log('CSV data received');

    const parsedData = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    console.log('Parsed data:', parsedData);

    const locations = parsedData.map((row) => {
      const lat = parseFloat(row['北緯']);
      const lng = parseFloat(row['東経']);
      if (isNaN(lat) || isNaN(lng)) {
        console.error(`Invalid coordinates: lat=${row['北緯']}, lng=${row['東経']}`);
        return null; // 無効な座標はスキップ
      }
            console.log(`Processing row: lat=${lat}, lng=${lng}, title=${row['名称']}`);
      return {
        lat: lat,
        lng: lng,
        details: `<h3>${row['名称']}</h3>${row['Google マップで見る'] ? `<p><a href="${row['Google マップで見る']}" target="_blank">Google マップで見る</a></p>` : ''}`,
      };
    });

    console.log('Processed locations:', locations);
    return locations;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

// 現在地取得エラー時の処理
function handleLocationError(browserHasGeolocation) {
  console.log('handleLocationError called', browserHasGeolocation); // デバッグ用ログ

  const errorMessage = browserHasGeolocation
    ? '現在地の取得に失敗しました。'
    : 'このブラウザは位置情報サービスに対応していません。';

  infoWindow.setPosition(map.getCenter());
  infoWindow.setContent(`<div><p>${errorMessage}</p></div>`);
  infoWindow.open(map);

  console.log('Error message displayed:', errorMessage); // デバッグ用ログ
}

// Google Maps API の読み込みが完了してから initMap を実行する
window.addEventListener('load', () => {
  console.log('Window load event fired'); // デバッグ用ログ
  initMap();
});

// デバッグ用の関数（必要に応じて使用）
function debugLog(message) {
  console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
}