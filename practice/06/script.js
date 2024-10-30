// scripts.js
import { createMarkers } from './marker.js';
import { fetchSheetData } from './sheetData.js';
import { sheetColorMap, sheetNames } from './map.js';

let map, markerCluster, infoWindow;

// 地図の初期化
async function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 38.0682, lng: 138.3716 }, // 地図の中心座標を佐渡島に修正
    zoom: 10
  });

  // infoWindow を初期化
  infoWindow = new google.maps.InfoWindow({
    disableAutoPan: false // 情報ウィンドウ表示時に自動的にパンする
  });

  // MarkerClustererPlusライブラリを読み込む
  await loadMarkerClustererPlus();

  // markerCluster を初期化
  markerCluster = new markerClustererplus.MarkerClusterer({
    map: map,
    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m/',
    gridSize: 60,
    zoomOnClick: false,
  });

  await fetchSheetDataAndCreateMarkers();
}

// MarkerClustererPlusライブラリを読み込む
async function loadMarkerClustererPlus() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// スプレッドシートからデータを取得し、マーカーを作成する
async function fetchSheetDataAndCreateMarkers() {
  for (const sheetName of sheetNames) {
    try {
      const locations = await fetchSheetData(sheetName);
      createMarkers(locations, sheetName, markerCluster, infoWindow, sheetColorMap);
    } catch (error) {
      console.error(`Error fetching data for sheet ${sheetName}:`, error);
      handleError(`${sheetName} のデータの読み込みに失敗しました。`);
      // ループを中断
      break;
    }
  }
}

// エラーメッセージを表示する
function handleError(message) {
  // 例えば、alertでエラーメッセージを表示する
  alert(message);
}

window.initMap = initMap;
