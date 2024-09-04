import * as dat from 'dat.gui'
import * as Cesium from 'cesium'
import Particle3D from './src/modules/particle3D.js'
/* eslint-disable */
//加载粒子
// 声明一个全局变量 particleObj
let particleObj = null

function loadParticle(url) {
  var viewer = window.viewer

  // 粒子系统配置
  const systemOptions = {
    maxParticles: 250000, // 最大粒子数(会自动取平方数)
    particleHeight: 1000.0, // 粒子高度
    fadeOpacity: 0.996, // 拖尾透明度
    dropRate: 0.003, // 粒子重置率
    dropRateBump: 0.01, // 随速度增加的粒子重置率百分比，速度越快越密集，
    // 最终的粒子重置率particleDropRate = dropRate + dropRateBump * speedNorm;
    speedFactor: 1.0, // 粒子速度
    lineWidth: 4.0, // 线宽
    dynamic: true // 是否动态运行
  }

  // 粒子颜色色带
  const colorTable = [
    [0.015686, 0.054902, 0.847059], // 深蓝色，表示低速
    [0.12549, 0.313725, 1.0], // 蓝色
    [0.0, 0.807843, 0.819608], // 青色
    [0.0, 0.988235, 0.0], // 绿色
    [1.0, 1.0, 0.0], // 黄色，表示中速
    [1.0, 0.647059, 0.0], // 橙色
    [1.0, 0.0, 0.0] // 红色，表示高速
  ]
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      // 将 blob 传递给 Particle3D
      particleObj = new Particle3D(viewer, {
        input: blob,
        colorTable: colorTable,

        systemOptions: systemOptions,
        fields: {
          U: 'water_u',
          V: 'water_v'
          // tem: 'tem',
          // H: 'dem',
          // W: ''
        }
      })
      // console.log(particleObj)
      // particleObj.data.H.forEach((element) => {
      //   element = 10000
      // })
      //获取数据

      particleObj.init().then((res) => {
        // 将 H.array 中的所有值替换为统一值，例如 10000
        // for (let i = 0; i < particleObj.data.H.array.length; i++) {
        //   particleObj.data.H.array[i] = 1000000.00584891
        // }
        particleObj.show()
        addClickHandler(particleObj.data)
        addGUI()
        // particleObj.remove()
      })

      // 更新粒子系统配置的回调函数
      function updateOptions() {
        particleObj.optionsChange(systemOptions)
      }
      function addGUI() {
        // 初始化dat.GUI
        const gui = new dat.GUI()

        // 添加控制面板选项
        gui
          .add(systemOptions, 'maxParticles', 1000, 10000)
          .onChange(updateOptions)
        gui
          .add(systemOptions, 'particleHeight', 0, 5000000)
          .onChange(updateOptions)
        gui.add(systemOptions, 'fadeOpacity', 0.9, 1.0).onChange(updateOptions)
        gui.add(systemOptions, 'dropRate', 0.0, 0.1).onChange(updateOptions)
        gui.add(systemOptions, 'dropRateBump', 0.0, 0.1).onChange(updateOptions)
        gui.add(systemOptions, 'speedFactor', 0.1, 5.0).onChange(updateOptions)
        gui.add(systemOptions, 'lineWidth', 1.0, 10.0).onChange(updateOptions)
        gui.close()
      }

      return particleObj
    })

  // systemOptions.fadeOpacity = 0.9
  // particleObj.optionsChange(systemOptions) // 更新粒子系统配置

  // particleObj.hide() // 停止粒子系统
  // particleObj.remove() // 移除粒子系统
}
//点击获取粒子值
function addClickHandler(data) {
  var viewer = window.viewer
  // 初始化事件处理器
  var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  // 监听鼠标点击事件

  handler.setInputAction(function (click) {
    console.log(click.position)
    var cartesian = viewer.scene.pickPosition(click.position)
    console.log(cartesian)
    if (Cesium.defined(cartesian)) {
      var cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      var lon = Cesium.Math.toDegrees(cartographic.longitude)
      var lat = Cesium.Math.toDegrees(cartographic.latitude)

      // 判断点击位置是否在数据范围内
      if (
        lon >= data.lon.min &&
        lon <= data.lon.max &&
        lat >= data.lat.min &&
        lat <= data.lat.max
      ) {
        // 根据经纬度计算索引
        var lonIndex = Math.floor(
          ((lon - data.lon.min) / (data.lon.max - data.lon.min)) *
            (data.dimensions.lon - 1)
        )
        var latIndex = Math.floor(
          ((lat - data.lat.min) / (data.lat.max - data.lat.min)) *
            (data.dimensions.lat - 1)
        )
        var index = latIndex * data.dimensions.lon + lonIndex

        // 获取对应的数据
        var H = data.H.array[index]
        var U = data.U.array[index]
        var V = data.V.array[index]
        var W = data.W.array[index]
        var tem = data.tem.array[index]
        var dem = data.dem.array[index]
        var hs = data.hs.array[index]
        var dirm = data.dirm.array[index]
        // 输出点击位置的数据
        console.log(`点击位置: 经度=${lon}, 纬度=${lat}`)
        console.log(
          `H=${H}, U=${U}, V=${V}, W=${W}, tem = ${tem},dem = ${dem},dirm = ${dirm},hs = ${hs}`
        )
      } else {
        console.log('点击位置不在数据范围内')
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

function removeParticle() {
  if (particleObj) {
    particleObj.remove()
    particleObj = null
  } else {
    console.log('粒子系统未加载或已被移除')
  }
}
export default {
  loadParticle,
  addClickHandler,
  removeParticle
}
