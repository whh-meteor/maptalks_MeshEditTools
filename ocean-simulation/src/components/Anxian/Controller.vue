<template>
    <div>
        <div class="layer-control">
            <div v-for="(layer, index) in layers" :key="index">
                <input type="checkbox" :checked="layer.visible" @change="toggleLayer(index)" />
                {{ layer.name }}
                <div v-if="layer.visible">

                    <div v-for="(feature, fIndex) in layer.features" :key="fIndex" v-if="feature.type !== 'Marker'">
                        <input type="checkbox" :checked="feature.visible" @change="toggleFeature(index, fIndex)" />
                        特征 {{ fIndex + 1 }} ({{ feature.type }})
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script>
import * as maptalks from 'maptalks';

export default {
    data() {
        return {
            map: null,
            layers: [
                {
                    name: '岸线图层',
                    layer: null,
                    visible: true,
                    features: []  // 存储特征的可见性状态
                }, {
                    name: '岸线图层2',
                    layer: null,
                    visible: true,
                    features: []  // 存储特征的可见性状态
                },

                {
                    name: '打断图层',
                    layer: null,
                    visible: true,
                    features: []  // 存储特征的可见性状态
                },
                {
                    name: '合并图层',
                    layer: null,
                    visible: true,
                    features: []  // 存储特征的可见性状态
                }
                // 根据需要添加更多图层
            ]
        };
    },
    mounted() {
        // console.log(window.map)
        // 初始化图层并将其添加到地图中
        this.layers[0].layer = window.map.getLayer('anxian1');
        this.layers[1].layer = window.map.getLayer('anxian2');
        this.layers[2].layer = window.map.getLayer('breakAnxian');
        this.layers[3].layer = window.map.getLayer('mergeAnxian');

        this.initializeMap();
    },
    methods: {
        initializeMap() {


            // 获取图层中的所有特征
            this.layers.forEach((layerObj, index) => {

                if (layerObj.layer) {
                    // 获取所有特征并初始化其可见性
                    const features = layerObj.layer.getGeometries();
                    // console.log(features)
                    layerObj.features = features.map(feature => ({
                        feature,
                        visible: feature.isVisible(),
                        type: feature.getJSONType()
                    }));
                }
            });
        },

        toggleLayer(index) {
            const layer = this.layers[index].layer;
            if (this.layers[index].visible) {
                layer.hide();
            } else {
                layer.show();
            }
            this.layers[index].visible = !this.layers[index].visible;

            // 根据图层的可见性更新特征的可见性
            this.layers[index].features.forEach(f => {
                if (this.layers[index].visible) {
                    ///  if (f.type == 'LineString') {  
                    f.feature.show();
                } else {
                    f.feature.hide();
                }
            });
        },
        toggleFeature(layerIndex, featureIndex) {
            const feature = this.layers[layerIndex].features[featureIndex].feature;
            if (this.layers[layerIndex].features[featureIndex].visible) {
                feature.hide();
            } else {
                feature.show();
            }
            this.layers[layerIndex].features[featureIndex].visible = !this.layers[layerIndex].features[featureIndex].visible;
        }
    }
};
</script>

<style>
.layer-control {
    margin: 10px;
}
</style>
