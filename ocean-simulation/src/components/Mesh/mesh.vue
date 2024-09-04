<template>
  <div class="mesh-drag">
    <VueDragResize :isActive="true" :w="164" :h="500" v-on:resizing="resize" v-on:dragging="resize">
      <!--文件上传表单-->
      <form>
        <h2>网格</h2>
        <input type="file" @change="getFile($event)" />
        <!-- <input type="file" @change="getFile2($event)" /> -->
        <el-button @click="submit($event)" type="danger">上传mesh文件</el-button>
        <el-button @click="loadMeshNets()" type="primary">加载mesh网格</el-button>
        <el-button @click="MeshOffset()">网格偏移</el-button>
        <!-- <el-button @click="backToLastStep()">撤销</el-button>
        <el-button @click="backToNextStep()">重做</el-button> -->
        <el-button @click="loadMeshNodes()" type="primary">加载mesh节点</el-button>
        <el-button @click="loadMeshDepth()" type="primary">加载水深插值</el-button>
        <el-button @click="removeMeshNets()">移除mesh网格</el-button>
        <el-button @click="removeMeshNodes()">移除mesh节点</el-button>
        <el-button @click="removeMeshDepth()">移除水深插值</el-button>

        <el-button @click="exportMeshNets()" type="info">导出网格</el-button>


      </form>
    </VueDragResize>
  </div>
</template>
<script>
import MapRequest from '@/api/maprequest.js'
import VueDragResize from 'vue-drag-resize'
import meshconfig from './meshconfig'

export default {
  name: 'mesh',
  components: { VueDragResize },
  data() {
    return {
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
    },
    // 加载Mesh网格
    loadMeshNodes() {
      meshconfig.addMeshNode(this.meshNodes)
    },
    loadMeshNets() {
      meshconfig.addMeshNets(this.meshNets)
    },
    loadMeshDepth() {
      meshconfig.MeshIsoLines(this.meshNodes, this.meshNets)
    },
    removeMeshNets() {
      meshconfig.removeMeshNets()
    },
    removeMeshNodes() {
      meshconfig.removeMeshNode()
    },
    removeMeshDepth() {
      meshconfig.removeMeshIsoLines()
    },
    exportMeshNets() {
      var nets = meshconfig.exportToGeoJSON()
      console.log("图层中的GeoJson")
      console.log(nets)
      meshconfig.exportToMesh(this.meshNodes, nets)  // 原始json
    },
    backToLastStep() {
      meshconfig.undoeditMesh()
    },
    backToNextStep() {
      meshconfig.redoeditMesh()
    },
    MeshOffset() {
      this.meshNets = meshconfig.offsetMeshNets("vector2mesh")
      this.meshNodes = meshconfig.offsetMeshPoints("meshPoints")
    }
  }
}
</script>
<style>
.mesh-drag {
  z-index: 999;
}
</style>
