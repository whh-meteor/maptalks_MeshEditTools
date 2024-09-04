<template>
  <div class="m-timeline-wrap">
    <div class="m-time-dot">
      <div
        :class="['m-dot-box', { active: active === item.year }]"
        @click="onClickYear(item)"
        v-for="(item, index) in timelineData"
        :key="index"
      >
        <p class="u-year">{{ item.year }}</p>
        <div class="m-dot">
          <div class="u-dot"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'HorizonTimeLine',
  props: {
    timelineData: {
      // 时间轴数据
      type: Array,
      required: true,
      default: () => {
        return []
      }
    },
    activeYear: {
      // 初始选中年份
      type: Number,
      default: 2020
    }
  },
  data() {
    return {
      active: this.activeYear
    }
  },
  methods: {
    onClickYear(item) {
      if (this.active !== item.year) {
        this.active = item.year
        // console.log('hello', item.year)
        // 使用 $emit 触发事件，并传递数据
        this.$emit('timeline-event', item)
      }
    }
  }
}
</script>
<style lang="less" scoped>
@themeColor: #1890ff;
.m-timeline-wrap {
  margin: 100px auto; // 缩小上下间距
  height: 2px; // 调整时间轴的高度
  background: #8dc6f5;
  position: absolute; // 使其悬浮在地图上
  bottom: 20px; // 调整距离底部的高度
  left: 50%;
  transform: translateX(-50%); // 使组件居中
  z-index: 1000; // 确保时间轴在其他元素之上

  .m-time-dot {
    display: flex;
    justify-content: space-around;

    .m-dot-box {
      cursor: pointer;
      text-align: center;
      transform: translateY(-50% + 7px); // 调整年份文本的位置

      .u-year {
        font-size: 14px; // 调小字体大小
        font-weight: 500;
        color: #333;
        transform: translateY(-4px); // 调整字体的垂直位置
        transition: all 0.3s ease;
      }

      .m-dot {
        margin: 0 auto;
        width: 7px; // 缩小圆点的大小
        height: 7px;
        background: #8dc6f5;
        border-radius: 50%;
        transition: all 0.3s ease;

        .u-dot {
          width: 7px;
          height: 7px;
          background: #8dc6f5;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
      }
    }

    .m-dot-box:hover {
      .u-year {
        color: @themeColor;
      }

      .m-dot {
        .u-dot {
          background: @themeColor;
        }
      }
    }

    .active {
      .u-year {
        transform: scale(1.5) translateY(-9px); // 缩小年份放大的比例
        color: @themeColor;
      }

      .m-dot {
        transform: scale(2); // 缩小圆点放大的比例

        .u-dot {
          transform: scale(0.67);
          background: @themeColor;
        }
      }
    }
  }
}
// @themeColor: #1890ff;
// .m-timeline-wrap {
//   margin: 100px auto;
//   height: 3px;
//   background: #8dc6f5;
//   .m-time-dot {
//     display: flex;
//     justify-content: space-around;
//     .m-dot-box {
//       cursor: pointer;
//       text-align: center;
//       transform: translateY(-100%+14px);
//       .u-year {
//         font-size: 28px;
//         font-weight: 500;
//         color: #333;
//         transform: translateY(-8px);
//         transition: all 0.3s ease;
//       }
//       .m-dot {
//         margin: 0 auto;
//         width: 14px;
//         height: 14px;
//         background: #8dc6f5;
//         border-radius: 50%;
//         transition: all 0.3s ease;
//         .u-dot {
//           width: 14px;
//           height: 14px;
//           background: #8dc6f5;
//           border-radius: 50%;
//           transition: all 0.3s ease;
//         }
//       }
//     }
//     .m-dot-box:hover {
//       .u-year {
//         color: @themeColor;
//       }
//       .m-dot {
//         .u-dot {
//           background: @themeColor;
//         }
//       }
//     }
//     .active {
//       .u-year {
//         transform: scale(2) translateY(-18px); // 同时设置多个transform属性只需用空格间隔，执行时从后往前执行！
//         color: @themeColor;
//       }
//       .m-dot {
//         transform: scale(3);
//         .u-dot {
//           transform: scale(0.67);
//           background: @themeColor;
//         }
//       }
//     }
//   }
// }
</style>
