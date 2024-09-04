import { CesiumPopup } from '@/api/cesium/dist/index'

class CesiumPopupComponent {
  static allPopups = [] // 静态数组来存储所有的弹窗实例

  constructor(viewer, options = {}) {
    this.viewer = viewer
    this.longitude = options.longitude || 103.6633339676296
    this.latitude = options.latitude || 36.090254266492465
    this.height = options.height || 1522.8186244347767
    this.htmlContent =
      options.htmlContent ||
      `
      <div class="title">飞机模型</div>
      <div class="content">我在飞机模型上</div>`
    this.popupClassName = options.popupClassName || 'earth-popup-imgbg-blue'
    this.popPosition = options.popPosition || 'leftbottom'
    this.action = options.action || this.defaultActions()
    this.cesiumPopup = null

    this.initCesiumPopup()
    CesiumPopupComponent.allPopups.push(this) // 将新创建的实例添加到静态数组中
  }

  // 默认动作
  defaultActions() {
    return {
      remove: (popup) => {
        console.log(popup, '被移除了')
      },
      onChange: (popup) => {
        console.log(popup, '移动完成')
      },
      editAttr: (popup) => {
        console.log(popup, '需要编辑属性！')
        popup.setContent('我的内容被改变了！')
      }
    }
  }

  // 初始化 CesiumPopup
  initCesiumPopup() {
    const cartesianPosition = Cesium.Cartesian3.fromDegrees(
      this.longitude,
      this.latitude,
      this.height
    )

    this.cesiumPopup = new CesiumPopup(
      this.viewer,
      {
        position: cartesianPosition,
        html: this.htmlContent,
        className: this.popupClassName,
        popPosition: this.popPosition
      },
      this.action
    )
  }

  // 移除 CesiumPopup
  removePopup() {
    if (this.cesiumPopup) {
      this.cesiumPopup.remove()
      this.cesiumPopup = null
    }
  }

  // 更新 CesiumPopup 位置
  updatePosition(longitude, latitude, height) {
    const newCartesianPosition = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      height
    )

    if (this.cesiumPopup) {
      this.cesiumPopup.setPosition(newCartesianPosition)
    }
  }

  // 更新 CesiumPopup 的内容
  updateContent(htmlContent) {
    if (this.cesiumPopup) {
      this.cesiumPopup.setContent(htmlContent)
    }
  }
  // 静态方法：清除所有弹窗
  static clearAllPopups() {
    CesiumPopupComponent.allPopups.forEach((popupInstance) =>
      popupInstance.removePopup()
    )
    CesiumPopupComponent.allPopups = [] // 清空数组
  }
}

export default CesiumPopupComponent
