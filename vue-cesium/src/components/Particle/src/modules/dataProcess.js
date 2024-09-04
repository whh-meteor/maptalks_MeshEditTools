/* eslint-disable */

import netcdfjs from 'netcdfjs'
import * as Cesium from 'cesium'
import { defaultFields } from './options'

export default (function () {
  var data

  var loadColorTable = function (colorTable) {
    let colorNum = colorTable.length
    let arr = []
    colorTable.map((color) => {
      arr = arr.concat(color)
    })
    data.colorTable = {
      colorNum,
      array: new Float32Array(arr.flat())
    }
  }

  // 获取数组最值
  const getMaxMin = (arr) => {
    let min = Infinity
    let max = -Infinity
    let hasNumber = false // 添加变量记录数组是否有数字

    for (let num of arr) {
      if (!isNaN(num)) {
        hasNumber = true // 如果有数字则更新状态

        if (num < min) {
          min = num
        }
        if (num > max) {
          max = num
        }
      }
    }

    if (!hasNumber) {
      // 如果数组没有数字则返回 0
      return { min: 0, max: 0 }
    }

    return { min, max }
  }

  var loadNetCDF = function (file, { fields, valueRange, offset }) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)

      reader.onload = function () {
        var arrayToMap = function (array) {
          return array.reduce(function (map, object) {
            map[object.name] = object
            return map
          }, {})
        }

        var NetCDF = new netcdfjs(reader.result)
        data = {}

        let variables = NetCDF.header.variables.map((item) => item.name)
        for (let key in fields) {
          let arr = []
          if (fields[key] && variables.indexOf(fields[key]) === -1) {
            arr.push(fields[key])
          }
          if (arr.length) {
            reject(
              'NetCDF 文件中没有这个属性: ' +
                arr +
                '\n 所有变量为: ' +
                variables
            )
            return
          }
        }

        var dimensions = arrayToMap(NetCDF.dimensions)
        data.dimensions = {
          lon: 1,
          lat: 1,
          lev: 1
        }
        ;['lon', 'lat', 'lev'].map((key) => {
          try {
            if (fields[key]) {
              data.dimensions[key] = dimensions[fields[key]].size
              let array = NetCDF.getDataVariable(fields[key])
                .flat()
                .map((item) => {
                  if (offset[key]) return item + offset[key]
                  return item
                })
              const minMax = getMaxMin(array)
              data[key] = {}
              data[key].array = new Float32Array(array)
              data[key].min = minMax.min
              data[key].max = minMax.max
            }
          } catch (e) {
            reject(e)
            return
          }
        })
        ;['U', 'V', 'W', 'H', 'tem', 'dem', 'hs', 'dirm'].map((key) => {
          // 包含 "tem"
          try {
            if (fields[key]) {
              let array = NetCDF.getDataVariable(fields[key])
                .flat()
                .map((item) => {
                  if (item < valueRange.min || item > valueRange.max) return 0
                  return item
                })
              const minMax = getMaxMin(array)
              data[key] = {}
              data[key].array = new Float32Array(array)
              data[key].min = minMax.min
              data[key].max = minMax.max
            }
          } catch (e) {
            reject(e)
            return
          }
        })

        if (!data.lev) {
          data.lev = {
            array: [0].flat(),
            min: 0,
            max: 0
          }
        }

        if (!fields['W']) {
          data.W = {
            array: new Float32Array(data.U.array.length),
            min: 0,
            max: 0
          }
        }
        if (!fields['tem']) {
          data.tem = {
            array: new Float32Array(data.U.array.length),
            min: 0,
            max: 0
          }
        }
        //添加上数据
        if (!fields['dirm']) {
          data.dirm = {
            array: new Float32Array(data.U.array.length),
            min: 0,
            max: 0
          }
        }
        if (!fields['hs']) {
          data.hs = {
            array: new Float32Array(data.U.array.length),
            min: 0,
            max: 0
          }
        }
        if (!fields['dem']) {
          data.dem = {
            array: new Float32Array(data.U.array.length),
            min: 0,
            max: 0
          }
        }
        if (!fields['H']) {
          data.H = {
            array: new Float32Array(data.U.array.length),
            min: 0,
            max: 0
          }
          if (fields['lev']) {
            const { lon, lat, lev } = data.dimensions
            let arr = []
            for (let i = 0; i < lev; i++) {
              for (let j = 0; j < lat; j++) {
                for (let k = 0; k < lon; k++) {
                  let index = i * (lon * lat) + j * lon + k
                  data.H.array[index] = data.lev.array[i]
                }
              }
            }
            data.H.min = Math.min(...data.lev.array)
            data.H.max = Math.max(...data.lev.array)
          }
        }
        console.log('HS数据' + data.hs)
        console.log('dirm数据' + data.dirm)
        resolve(data)
      }
    })
  }

  var loadData = async function (
    input,
    type,
    { fields, valueRange, offset, colorTable }
  ) {
    if (type === 'json') {
      data = input
    } else {
      try {
        await loadNetCDF(input, {
          fields,
          valueRange,
          offset
        })
      } catch (e) {
        throw e
      }
    }

    loadColorTable(colorTable)

    return data
  }

  // 先找一个随机的像素点,以此像素点经纬度范围生成随机位置
  var getValidRange = function () {
    const dimensions = [
      data.dimensions.lon,
      data.dimensions.lat,
      data.dimensions.lev
    ]
    const minimum = [data.lon.min, data.lat.min, data.lev.min]
    const maximum = [data.lon.max, data.lat.max, data.lev.max]
    const interval = [
      (maximum[0] - minimum[0]) / (dimensions[0] - 1),
      (maximum[1] - minimum[1]) / (dimensions[1] - 1),
      dimensions[2] > 1 ? (maximum[2] - minimum[2]) / (dimensions[2] - 1) : 1.0
    ]
    let id = Math.floor(Math.random() * data.U.array.length)

    let z = Math.floor(id / (dimensions[0] * dimensions[1]))
    let left = id % (dimensions[0] * dimensions[1])
    let y = Math.floor(left / dimensions[0])
    let x = left % dimensions[0]

    let lon = Cesium.Math.randomBetween(
      minimum[0] + x * interval[0],
      minimum[0] + (x + 1) * interval[0]
    )
    let lat = Cesium.Math.randomBetween(
      minimum[1] + (y - 1) * interval[1],
      minimum[1] + y * interval[1]
    )
    let lev = data.H.array[id] || 0
    let tem = data.tem ? data.tem.array[id] : 0 // 添加 tem 值（如果可用）
    let dem = data.dem ? data.dem.array[id] : 0 // 添加 dem 值（如果可用）
    let dirm = data.dirm ? data.dirm.array[id] : 0 // 添加 dirm 值（如果可用）
    let hs = data.hs ? data.hs.array[id] : 0 // 添加 hs 值（如果可用）

    return [lon, lat, lev, tem, dem, hs, dirm]
  }

  var randomizeParticles = function (maxParticles, viewerParameters) {
    var array = new Float32Array(5 * maxParticles) // 5 个组件: lon, lat, lev, tem, 和一个标志
    for (var i = 0; i < maxParticles; i++) {
      let pos = getValidRange()
      array[5 * i] = pos[0]
      array[5 * i + 1] = pos[1]
      array[5 * i + 2] = pos[2]
      array[5 * i + 3] = pos[3] || 0 // 如果存在 tem 数据，添加 tem 值
      array[5 * i + 4] = 0.0 // 标志或附加信息
    }
    return array
  }

  return {
    loadData: loadData,
    randomizeParticles: randomizeParticles
  }
})()
