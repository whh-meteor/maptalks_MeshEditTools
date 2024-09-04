<template>
  <div class="anxian-drag">
    <VueDragResize :isActive="true" :w="164" :h="500" v-on:resizing="resize" v-on:dragging="resize">
      <!--文件上传表单-->
      <form>
        <h2>FVCome结果</h2>
        <input type="file" @change="getFile($event)" />
        <!-- <input type="file" @change="getFile2($event)" /> -->
        <el-button @click="submit($event)" type="danger">上传NC文件</el-button>

        <el-select v-model="value" placeholder="请选择渲染要素结果">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
          </el-option>
        </el-select>

        <el-button @click="renderItemInFvRes" type="danger">渲染结果</el-button>
      </form>
    </VueDragResize>
  </div>
</template>
<script>
import MapRequest from '@/api/maprequest.js'
import VueDragResize from 'vue-drag-resize'
import FvcResJson from "../../../public/json/PointJson_84.json"
import resconfig from "./resconfig.js"
export default {
  name: 'mesh',
  components: { VueDragResize },
  data() {
    return {
      options: [{
        value: 'u',
        label: 'u'
      }, {
        value: 'v',
        label: 'v'
      }, {
        value: 'DYE',
        label: 'DYE'
      }, {
        value: 'h',
        label: 'h'
      }, {
        value: 'tauc',
        label: 'tauc'
      }],
      value: '',
      file: null,
      file2: null,
      meshNodes: null, //节点
      meshNets: null //网格
    }
  },
  mounted() { },
  methods: {
    resize(newRect) { },
    getFile(event) {
      console.log(event)
      this.file = event.target.files[0]
      console.log(this.file)
    },
    getFile2(event) {
      this.file2 = event.target.files[0]
      console.log(this.file2)
    },
    //提交文件
    submit(event) {
      event.preventDefault() //取消默认行为
      //创建 formData 对象
      let formData = new FormData()
      // 向 formData 对象中添加文件
      formData.append('file', this.file)
      formData.append('file', this.file2)
      var that = this
      MapRequest.http
        .UploadFile('uploadMesh', formData)
        .then(function (response) {
          console.log('res: ', response)
          that.meshNodes = response.data.geojson[0]
          that.meshNets = response.data.geojson[1]
          console.log('1-数据载入：')
          console.log(that.meshNodes)
          console.log(that.meshNets)
        })
    }, renderItemInFvRes() {
      console.log(this.value)
      resconfig.addFvcomePoints(FvcResJson)
      resconfig.MeshIsoLines(FvcResJson, "u")

    }
  }
}
</script>
<style>
.anxian-drag {
  z-index: 999;
}
</style>
