import axios from 'axios'

let http = {}

let _baseURL = 'http://127.0.0.1:5000'
let ContentType = 'application/json'

let uploadFileType = 'multipart/form-data'
http.baseURL = _baseURL

/**
 * 上传mesh文件的请求 .mesh
 * @param url
 * @returns {AxiosPromise}
 */
http.UploadFile = function (url, data) {
  let config = {
    //请求的接口，在请求的时候，如axios.get(url,config);这里的url会覆盖掉config中的url
    url: url,
    //基础url前缀
    baseURL: _baseURL,
    transformResponse: [
      function (data1) {
        var data = data1
        if (typeof data1 == 'string') {
          data = JSON.parse(data1)
        }
        //这里提前处理返回的数据;
        if (data.message && data.data === 'login.invalid.token') {
          window.localStorage.removeItem('access-user')
          alert('超时请重新登陆')
          window.location.href = '/'
        }
        return data
      }
    ],
    //请求头信息
    headers: {
      'access-user': window.localStorage.getItem('access-user'),
      'Content-Type': uploadFileType
    },

    //跨域请求时是否需要使用凭证
    withCredentials: false,
    // 返回数据类型
    responseType: 'json' //default
  }
  return axios.post(url, data, config)
}

/**
 * 发送两个GeoJSON对象到后端
 * @param url
 * @param geoJson1 第一个GeoJSON对象
 * @param geoJson2 第二个GeoJSON对象
 * @returns {AxiosPromise}
 */
http.UploadGeoJson = function (url, geoJson1, geoJson2) {
  let config = {
    url: url,
    baseURL: _baseURL,
    headers: {
      'access-user': window.localStorage.getItem('access-user'),
      'Content-Type': ContentType
    },
    withCredentials: false,
    responseType: 'blob' // 为了处理文件下载，使用 blob 类型
  }

  // 发送两个 GeoJSON 对象作为请求的 body
  const data = {
    geoJson1: geoJson1,
    geoJson2: geoJson2
  }

  return axios
    .post(url, data, config)
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'output.mesh')
      document.body.appendChild(link)
      link.click()
    })
    .catch((error) => {
      console.error('Error downloading mesh file: ', error)
    })
}
export default { http }
