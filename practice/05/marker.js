/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
// マーカーを作成する関数
function createMarkers(locations, sheetName, markerCluster, infoWindow, sheetColorMap) {
  const markers = locations.map((location, i) => {
    if (!location) return null;
    debugLog(`Creating marker ${i + 1} for ${sheetName}: ${JSON.stringify(location)}`);

    const marker = makeMarker(location, sheetName, sheetColorMap);

    debugLog(`Marker ${i + 1} for ${sheetName} created: ${marker}`);

    // マーカーにマウスカーソルを合わせたときのイベントリスナー
    marker.addListener("mouseover", () => {
      // カーソルを合わせたときの処理
      // 例：マーカーの色を変更する
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'red', // 色を赤に変更
        fillOpacity: 1,
        strokeColor: 'black',
        strokeWeight: 2,
        scale: 12 // サイズを少し大きくする
      });
      infoWindow.close(); // 他の情報ウィンドウを閉じる
      debugLog(`InfoWindow opened for marker ${i + 1} of ${sheetName}`);
    });

    // マーカーからマウスカーソルが離れたときのイベントリスナー
    marker.addListener("mouseout", () => {
      // カーソルが離れたときの処理
      // 例：マーカーの色を元に戻す
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: sheetColorMap[sheetName] || 'black', // 元の色に戻す
        fillOpacity: 1,
        strokeColor: 'black',
        strokeWeight: 2,
        scale: 10 // 元のサイズに戻す
      });
    });

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
  markerCluster.addMarkers(markers.filter(marker => marker !== null));
  debugLog(`Markers added to cluster for ${sheetName}: ${markers.length} markers`);
}

// マーカーを作成する関数
function makeMarker(location, sheetName, sheetColorMap) {
  return new google.maps.Marker({
    position: { lat: location.lat, lng: location.lng },
    title: `${sheetName} - ${location.title}`,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: sheetColorMap[sheetName] || 'black',
      fillOpacity: 1,
      strokeColor: 'black',
      strokeWeight: 2,
      scale: 10
    }
  });
}

// デバッグ用の関数
function debugLog(message) {
  console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
}

// createMarkers 関数を外部から使用できるように export
export { createMarkers };
