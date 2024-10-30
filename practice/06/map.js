/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
// marker.js と sheetData.js を読み込む
import { createMarkers } from './marker.js';
import { fetchSheetData } from './sheetData.js';

// シート名とマーカー色の対応表
const sheetColorMap = {
  '公共トイレ': '#ff5d00',
  '駐車場': '#ffab00',
  'スナック': '#b5ff00',
  '両津・相川地区': '#00ff00',
  '金井・佐和田・新穂・畑野・真野地区': '#00ffe2',
  '赤泊・羽茂・小木地区': '#00b9ff',
  '和食': '#2100f1',
  '中華': '#3d00f1',
  '洋食': '#ad00f1',
  '販売': '#f100a7'
};

// 取得するシート名の配列
const sheetNames = ['公共トイレ', '駐車場', 'スナック', '両津・相川地区', '金井・佐和田・新穂・畑野・真野地区', '赤泊・羽茂・小木地区', '和食', '中華', '洋食', '販売'];

// 地図オブジェクト
let map;
// 情報ウィンドウ
let infoWindow;
// マーカークラスタ
let markerCluster;

// 地図の初期化
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

  // 情報ウィンドウの初期化
  infoWindow = new google.maps.InfoWindow({
    disableAutoPan: false // 情報ウィンドウ表示時に自動的にパンする
  });
  debugLog(`InfoWindow initialized: ${infoWindow}`);

  // 現在地への移動ボタン
  createLocationButton();

  // 地図クリック時のイベントリスナー
  map.addListener("click", () => {
    infoWindow.close();
    debugLog('InfoWindow closed due to map click');
  }, { passive: true });

  // マーカークラスタの初期化 (await を追加)
  await initMarkerClusterer();
}

// マーカークラスタの初期化
async function initMarkerClusterer() {
  // MarkerClustererPlusライブラリを読み込む
  const markerClustererScript = document.createElement('script');
  markerClustererScript.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
  markerClustererScript.async = true;
  markerClustererScript.defer = true;
  document.head.appendChild(markerClustererScript);

  // ライブラリの読み込みが完了してから、マーカークラスタを初期化する
  markerClustererScript.onload = () => {
    // マーカークラスタを初期化
    markerCluster = new markerClustererplus.MarkerClusterer({
      map: map,
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m/',
      gridSize: 60, // グリッドサイズを大きくする
      zoomOnClick: false, // クラスタクリック時のズームを無効にする
    } );

    debugLog( `MarkerClusterer initialized: ${ markerCluster }` );

    // --- createAllMarkers はここで呼び出す ---
    createAllMarkers();

    // クラスタクリック時のイベントリスナー
    google.maps.event.addListener(markerCluster, 'clusterclick', function (cluster) {
      const currentZoom = map.getZoom();
      const targetZoom = 15; // 目的のズームレベル

      // 現在のズームレベルが目的のズームレベルよりも小さい場合のみズームを変更
      if (currentZoom < targetZoom) {
        map.setCenter(cluster.getCenter()); // クラスタの中心に地図を移動
        map.setZoom(targetZoom); // ズームレベルを設定
      }
    });
  };
}

// 全てのマーカーを作成する
async function createAllMarkers() {
  for (const sheetName of sheetNames) {
    try {
      const locations = await fetchSheetData(sheetName);
      debugLog(`Fetched locations from ${sheetName}: ${locations.length} locations`);

      if (locations.length === 0) {
        console.error(`Error: Failed to fetch location data from ${sheetName}.`);
        // エラー処理: 例えば、ユーザーにエラーメッセージを表示する
        handleError(`${sheetName} のデータの読み込みに失敗しました。`);
        continue; // 次のシートの処理へ
      }

      // marker.js の関数を使用。markerCluster を引数として渡す
      createMarkers(locations, sheetName, markerCluster, infoWindow, sheetColorMap);
    } catch (error) {
      console.error(`Error processing sheet ${sheetName}:`, error);
      // エラー処理: 例えば、ユーザーにエラーメッセージを表示する
      handleError(`${sheetName} のデータの読み込みに失敗しました。`);
    }
  }
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

          // 現在地マーカーを作成
          const currentLocationMarker = new google.maps.Marker({
            position: pos,
            map: map,
            icon: { // アイコンをカスタマイズ
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              fillColor: 'gold', // 色を青に設定
              fillOpacity: 1,
              strokeColor: 'black',
              strokeWeight: 2,
              scale: 10
            }
          });
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

// デバッグ用の関数
function debugLog(message) {
  console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
}

// DOMの読み込みが完了してからinitMap関数を実行
window.addEventListener( 'load', initMap );

export { sheetColorMap, sheetNames, initMap };
