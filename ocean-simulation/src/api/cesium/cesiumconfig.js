import CesiumPopupComponent from './popup'
var boatLayer = []
async function addProjectMarker(url) {
  var points = await fetch(url)
  var pointArr = await points.json()

  // 加载点位

  //   if (boatLayer.length != 0) {
  //     boatLayer.forEach((item) => {
  //       window.viewer.entities.remove(item)
  //     })
  //   }
  var lon, lat, mname
  pointArr.features.forEach((item, i) => {
    boatLayer[i] = window.viewer.entities.add({
      id: item.properties.id,
      name: item.properties.name,
      position: Cesium.Cartesian3.fromDegrees(
        item.geometry.coordinates[0],
        item.geometry.coordinates[1],
        0
      ),

      billboard: {
        // 图像地址，URI或Canvas的属性
        image: item.img || '/json/marker/marker.png', // image: item.img,
        // 设置颜色和透明度
        color: Cesium.Color.WHITE.withAlpha(0.8),
        // 高度（以像素为单位）
        height: 64, // 宽度（以像素为单位）
        width: 64, // 逆时针旋转,表示Billboard绕其原点旋转的角度（弧度）
        // rotation: -(((item.hdg > 360 ? item.cog : item.hdg) * Math.PI) / 180), // rotation:-Cesium.Math.PI_OVER_FOUR *2,
        // 大小是否以米为单位
        sizeInMeters: false, // 相对于坐标的垂直位置
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        // 相对于坐标的水平位置
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
        pixelOffset: new Cesium.Cartesian2(0, -50),
        scaleByDistance: new Cesium.NearFarScalar(2000, 1, 100000000, 0.1), // 显示在距相机的距离处的属性，多少区间内是可以显示的
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
          0,
          100000000
        ),
        show: true, // 是否显示
        // alignedAxis: Cesium.Cartesian3.ZERO // default
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
      label: {
        text: item.properties.name,
        show: true,
        font: '10px Source Han Sans CN', //字体样式
        fillColor: Cesium.Color.WHITE, //字体颜色
        backgroundColor: Cesium.Color.fromCssColorString('red').withAlpha(0), //背景颜色
        showBackground: true, //是否显示背景颜色
        style: Cesium.LabelStyle.FILL_AND_OUTLINE, //label样式
        outlineWidth: 3, // verticalOrigin: Cesium.VerticalOrigin.CENTER, //垂直位置
        // horizontalOrigin: Cesium.HorizontalOrigin.LEFT, //水平位置
        pixelOffset: new Cesium.Cartesian2(0, -15) //偏移
      },
      clampToGround: true
    })
    lon = item.geometry.coordinates[0]
    lat = item.geometry.coordinates[1]
    mname = item.properties.name
    console.log(boatLayer[i])

    setPopup(mname, lon, lat)
  })

  handleClick()
}

function handleClick(name, lon, lat) {
  var viewer = window.viewer
  // 设置单击事件的处理句柄，如果尚未设置

  var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction(function (movement) {
    var cartesian = viewer.scene.pickPosition(movement.position)
    var pick = viewer.scene.pick(movement.position) // drillPick 深度测试
    var cartographic, lon, lat
    console.log(pick)

    if (pick == undefined) {
      CesiumPopupComponent.clearAllPopups()

      cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      lon = Cesium.Math.toDegrees(cartographic.longitude)
      lat = Cesium.Math.toDegrees(cartographic.latitude)

      // 输出点击位置的数据
      console.log(`点击位置: 经度=${lon}, 纬度=${lat}`)
    } else {
      removeUnderLayerPopuop()
      setTimeout(() => {
        window.$supervise.$router.push('/2dMaps') // 跳转地图
      }, 500)

      return
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

var popupComponent
function removeUnderLayerPopuop() {
  // 移除弹出框
  if (popupComponent) {
    popupComponent.removePopup()
  }
}
function setPopup(pidckid, lon, lat) {
  if (isNaN(lon) || isNaN(lat)) {
    console.error('Invalid coordinates: lon and lat must be numbers.')
    return
  }
  let content = pidckid
  let title = '工程位置'
  // 创建一个新的 CesiumPopup 组件实例
  popupComponent = new CesiumPopupComponent(window.viewer, {
    longitude: lon,
    latitude: lat,
    height: 0,
    htmlContent:
      `<div class="title">` +
      title +
      `</div><div class="content" id="content-project" style="width:300px">` +
      content +
      `</div>`,
    popupClassName: 'earth-popup-imgbg-blue',
    popPosition: 'leftbottom'
  })

  // 更新位置
  popupComponent.updatePosition(lon, lat, 500)

  // 移除弹出框
  // popupComponent.removePopup()
}
export default { addProjectMarker, handleClick }
