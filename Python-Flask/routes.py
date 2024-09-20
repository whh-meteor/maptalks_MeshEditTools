from flask import Flask, request, send_file, jsonify
from services import erase_geojson_with_shp_geopandas,shp_to_geojson_with_geopandas,erase_geojson_with_shp_gdal,GenerateMesh,Geojson_to_Mesh,transPoint2WGS84,dat_to_geojson_with_conversion,get_data, save_data,Mesh_nodes_to_Triangle_Json,bln_to_geojson,LinesJosn2WGS84
from werkzeug.utils import secure_filename
from flask_cors import CORS
from io import BytesIO
from flask import request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
 
def init_routes(app):
    CORS(app)
    # CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}})
    @app.route('/')
    ####=======================测试部分=====================================####
    def index():
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [
                                    121.712506,
                                    36.302243
                                ],
                                [
                                    121.712506,
                                    38.302243
                                ],
                                [
                                    123.712506,
                                    38.302243
                                ],
                                [
                                    123.712506,
                                    36.302243
                                ],
                                [
                                    121.712506,
                                    36.302243
                                ]
                            ]
                        ]
                    },
                    "properties": {}
                }
            ]
        }
        shpPath = erase_geojson_with_shp_geopandas(geojson,"./static/data/GSHHS_DIS.shp","res3_gpd.shp")
        geojson =  shp_to_geojson_with_geopandas(shpPath)
        mesh_file_path= GenerateMesh(geojson, 0.01,"geo.geo","msh.msh","mesh.mesh")
        geojson2 =  Mesh_nodes_to_Triangle_Json(mesh_file_path)
        return geojson2
        # return 'Index Page'
    ####=======================岸线部分=====================================####
    @app.route('/uploadAxBln', methods=['GET', 'POST'])
    def upload_bln():
        if request.method == 'POST':

            # 检查是否有文件上传
            if 'file' not in request.files:
                return jsonify({"message": "请求中没有文件部分"}), 400

            # 获取所有上传的文件列表
            files = request.files.getlist('file')
            print(files)
            # 检查是否选择了文件
            if not files:
                return jsonify({"message": "未选择文件"}), 400

            # 保存所有上传的文件x
            saved_files = []
            for file in files:
                if file.filename == '':
                    return jsonify({"message": "一个或多个文件没有名称"}), 400
                # 保存文件
                filename = secure_filename(file.filename)
                file.save(f"F:/Desktop/【LTGK】海洋一所/【Demo】/Python-Flask/tempfile/{filename}")
                saved_files.append(filename)
                # 逻辑代码
                geojson=dat_to_geojson_with_conversion(f"F:/Desktop/【LTGK】海洋一所/【Demo】/Python-Flask/tempfile/{filename}")
                geojson_84 =  transPoint2WGS84(geojson)
            return jsonify({"message": "文件上传成功", "files": saved_files,"geojson":geojson_84}), 200

        # 如果请求方法不是 POST，则返回一个错误信息
        return jsonify({"message": "无效请求方法"}), 405
            
    ####=======================MESH网格部分=====================================####
    @app.route('/uploadMesh', methods=['GET', 'POST'])
    def upload_mesh():
        if request.method == 'POST':

            # 检查是否有文件上传
            if 'file' not in request.files:
                return jsonify({"message": "No file part in the request"}), 400

            # 获取所有上传的文件列表
            files = request.files.getlist('file')
            print(files)
            # 检查是否选择了文件
            if not files:
                return jsonify({"message": "No file selected"}), 400

            # 保存所有上传的文件x
            saved_files = []
            for file in files:
                if file.filename == '':
                    return jsonify({"message": "One or more files have no name"}), 400

                filename = secure_filename(file.filename)
                file.save(f"F:/Desktop/【LTGK】海洋一所/【Demo】/Python-Flask/tempfile/{filename}")
                saved_files.append(filename)
                geojson=Mesh_nodes_to_Triangle_Json(f"F:/Desktop/【LTGK】海洋一所/【Demo】/Python-Flask/tempfile/{filename}")

            return jsonify({"message": "Files uploaded successfully", "files": saved_files,"geojson":geojson}), 200

        # 如果请求方法不是 POST，则返回一个错误信息
        return jsonify({"message": "Invalid request method"}), 405
    @app.route('/json2mesh', methods=['GET', 'POST'])
    def json2mesh():
        # 检查请求是否为 JSON
        if not request.is_json:
            return jsonify({"error": "Invalid input format. Expected JSON."}), 400

        # 获取 JSON 数据
        data = request.get_json()
        geoJson1 = data.get('geoJson1')
        # geoJson2 = data.get('geoJson2')

        if geoJson1 is None:
            return jsonify({"error": "Missing nets in request data."}), 400

        # 调用处理函数（替换为您的实际逻辑）
        mesh_file_content = Geojson_to_Mesh(geoJson1)

        # 创建一个 in-memory 字节流来保存生成的 mesh 文件
        mesh_io = BytesIO(mesh_file_content.encode('utf-8'))

        return send_file(mesh_io, as_attachment=True, download_name='output.mesh', mimetype='text/plain')
    @app.route('/gen-mesh', methods=['GET', 'POST'])
    def generate2mesh():
      
        # 从请求中解析GeoJSON和步长参数
        data = request.get_json()
        print(data)
        # 从JSON中获取GeoJSON对象
        geojson = data.get('geojson1')
          # 获取步长参数 , 默认0.1
        mesh_size = data.get('mesh_size',0.1)
        print(mesh_size)
        if geojson is None:
            return jsonify({'error': 'GeoJSON is required'}), 400


     
        print(mesh_size)
        # 调用生成 mesh 的函数
        mesh_file_path= GenerateMesh(geojson, mesh_size,"geo.geo","msh.msh","mesh.mesh")
        geojson =  Mesh_nodes_to_Triangle_Json(mesh_file_path)
        # 返回生成的 .mesh 文件内容
        return jsonify({'data': geojson,'success': True}), 200
    @app.route('/clip-mesh', methods=['GET', 'POST'])
    def clip2mesh():
      
        # 从请求中解析GeoJSON和步长参数
        data = request.get_json()
        print(data)
        # 从JSON中获取GeoJSON对象
        geojson = data.get('geojson1')
      
        if geojson is None:
            return jsonify({'error': 'GeoJSON is required'}), 400

 
   
        # 调用生成 mesh 的函数
        shpPath = erase_geojson_with_shp_geopandas(geojson,"./static/data/GSHHS_DIS.shp","res3_gpd.shp")
        geojson =  shp_to_geojson_with_geopandas(shpPath)
        # 返回生成的 .mesh 文件内容
        return jsonify({'data': geojson,'success': True}), 200
    @app.route('/gen-clipmesh', methods=['GET', 'POST'])
    def genclip2mesh():
      
        # 从请求中解析GeoJSON和步长参数
        data = request.get_json()
        print(data)
        # 从JSON中获取GeoJSON对象
        geojson = data.get('geojson1')
          # 获取步长参数 , 默认0.1
        mesh_size = data.get('mesh_size',0.1)
        print(mesh_size)
        if geojson is None:
            return jsonify({'error': 'GeoJSON is required'}), 400
        print("步长：")
        print(mesh_size)
        # 调用生成 mesh 的函数
        mesh_file_path= GenerateMesh(geojson, mesh_size,"geo.geo","msh.msh","mesh.mesh")
        geojson2 =  Mesh_nodes_to_Triangle_Json(mesh_file_path)
        # 返回生成的 .mesh 文件内容
        return jsonify({'data': geojson2,'success': True}), 200
 

    ####=======================DEMO测试=====================================####
    #Demo
    @app.route('/get-data', methods=['GET'])
    def handle_get_data():
        # 从请求中获取参数
        param = request.args.get('param', '')
        # 调用业务逻辑方法
        result = get_data(param)
        # 返回 JSON 响应
        return jsonify(result)
    
    @app.route('/save-data', methods=['POST'])
    def handle_save_data():
        # 从请求中获取数据
        data = request.json
        # 调用业务逻辑方法
        success = save_data(data)
        # 返回操作结果
        return jsonify({"success": success})





