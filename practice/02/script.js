let map, infoWindow, currentInfoWindow = null; // currentInfoWindow をグローバル変数として宣言

async function initMap() {
  const mapOptions = {
    center: { lat: -35.693235, lng: 139.757864 },
    zoom: 3,
    mapId: "80e5f5b3e30e783d"
  };

  map = new google.maps.Map(document.getElementById('map'), mapOptions);

  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

// 情報ウィンドウの初期化
infoWindow = new google.maps.InfoWindow({
  disableAutoPan: true // 自動パンを無効に設定
});

  // 現在地への移動ボタン
  const locationButton = document.createElement("button");
  locationButton.textContent = "現在地に移動";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          infoWindow.setPosition(pos);
          infoWindow.setContent("現在地が見つかりました。");
          infoWindow.open(map);
          map.setCenter(pos);
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });

  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // マーカーの作成
  const markers = locations.map((position, i) => {
    const label = labels[i % labels.length];
    const customIconUrl = "http://maps.google.com/mapfiles/ms/icons/blue-pushpin.png";
    const marker = new google.maps.Marker({
      map: map,
      position: position,
      label: {
        text: label,
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "bold"
      },
      icon: {
        url: customIconUrl,
        labelOrigin: new google.maps.Point(0, 0)
      }
    });

    // マーカークリック時のイベントリスナー
    marker.addListener("click", () => {
      if (currentInfoWindow) {
        currentInfoWindow.close();
      }
      infoWindow.setContent(`<div class="custom-info-window"><p>タイトル: ${label}</p><p>詳細情報</p></div>`);
      // 情報ウィンドウの閉じるボタンを削除
      infoWindow.setOptions({ disableAutoPan: true });
      // 情報ウィンドウとマーカーをマップの中心に表示
      infoWindow.setPosition(marker.getPosition());
      map.setCenter(marker.getPosition());
      infoWindow.open(map);
      currentInfoWindow = infoWindow; // currentInfoWindow を更新
    });

    return marker;
  });

  // 地図クリック時のイベントリスナー
  map.addListener("click", () => {
    if (currentInfoWindow) {
      currentInfoWindow.close();
      currentInfoWindow = null;
    }
  });

  // マーカーのクラスタリング
  new markerClusterer.MarkerClusterer({
    map,
    markers: markers,
    imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
  });
}

const locations = [
  { lat: -31.56391, lng: 147.154312 },
  { lat: -33.718234, lng: 150.363181 },
  { lat: -33.727111, lng: 150.371124 },
  { lat: -33.848588, lng: 151.209834 },
  { lat: -33.851702, lng: 151.216968 },
  { lat: -34.671264, lng: 150.863657 },
  { lat: -35.304724, lng: 148.662905 },
  { lat: -36.817685, lng: 175.699196 },
  { lat: -36.828611, lng: 175.790222 },
  { lat: -37.75, lng: 145.116667 },
  { lat: -37.759859, lng: 145.128708 },
  { lat: -37.765015, lng: 145.133858 },
  { lat: -37.770104, lng: 145.143299 },
  { lat: -37.7737, lng: 145.145187 },
  { lat: -37.774785, lng: 145.137978 },
  { lat: -37.819616, lng: 144.968119 },
  { lat: -38.330766, lng: 144.695692 },
  { lat: -39.927193, lng: 175.053218 },
  { lat: -41.330162, lng: 174.865694 },
  { lat: -42.734358, lng: 147.439506 },
  { lat: -42.734358, lng: 147.501315 },
  { lat: -42.735258, lng: 147.438 },
  { lat: -43.999792, lng: 170.463352 },
];

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "エラー: ジオロケーションサービスに失敗しました。"
      : "エラー: このブラウザはジオロケーションをサポートしていません。"
  );
  infoWindow.open(map);
}

window.initMap = initMap;
