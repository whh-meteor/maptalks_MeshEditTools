


 

#Demo
def get_data(param):
    # 模拟获取数据的逻辑
    data = {"message": f"Data for {param}"}
    return data

def save_data(data):
    # 模拟保存数据的逻辑
    print(f"Saving data: {data}")
    # 返回操作成功状态
    return True
import json
from collections import defaultdict
# （1）mesh文件转Geojson
def Mesh_nodes_to_Triangle_Json(mesh):

    def parse_mesh_file(mesh_file):
        with open(mesh_file, 'r') as file:
            lines = file.readlines()

        # 跳过头部信息行
        header = lines[0].strip()
        nodes = []
        triangles = []
        
        # 从第二行开始处理
        for line in lines[1:]:
            line = line.strip()

            # 跳过空行
            if not line:
                continue

            # 分割行内容
            parts = line.split()

            # 处理节点数据
            if len(parts) == 5:
                nodes.append({
                    "id": int(parts[0]),
                    "x": float(parts[1]),
                    "y": float(parts[2]),
                    "depth": float(parts[3]),
                    "value": float(parts[4])
                })
            # 处理三角形数据
            elif len(parts) == 4:
                triangles.append({
                    "id": int(parts[0]),
                    "node_ids": list(map(int, parts[1:4]))
                })
            else:
                print(f"Unexpected line format: {line}")

        print(f"Nodes parsed: {len(nodes)}")
        print(f"Triangles parsed: {len(triangles)}")

        return header, nodes, triangles

    # 生成三角网 GeoJSON 文件
    def generate_triangular_geojson(nodes, triangles, output_file):
        # 创建字典以方便通过 id 查找节点
        node_dict = {node["id"]: node for node in nodes}
        
        features = []
        for triangle in triangles:
            # 根据三角形的节点 id 查找对应的坐标
            coords = [
                {
                    "coordinates": [node_dict[triangle["node_ids"][0]]["x"], node_dict[triangle["node_ids"][0]]["y"]],
                    "properties": {
                        "depth": node_dict[triangle["node_ids"][0]]["depth"],
                        "value": node_dict[triangle["node_ids"][0]]["value"],
                        "id": node_dict[triangle["node_ids"][0]]["id"]
                    }
                },
                {
                    "coordinates": [node_dict[triangle["node_ids"][1]]["x"], node_dict[triangle["node_ids"][1]]["y"]],
                    "properties": {
                        "depth": node_dict[triangle["node_ids"][1]]["depth"],
                        "value": node_dict[triangle["node_ids"][1]]["value"],
                        "id": node_dict[triangle["node_ids"][1]]["id"]
                    }
                },
                {
                    "coordinates": [node_dict[triangle["node_ids"][2]]["x"], node_dict[triangle["node_ids"][2]]["y"]],
                    "properties": {
                        "depth": node_dict[triangle["node_ids"][2]]["depth"],
                        "value": node_dict[triangle["node_ids"][2]]["value"],
                        "id": node_dict[triangle["node_ids"][2]]["id"]
                    }
                },
                {
                    "coordinates": [node_dict[triangle["node_ids"][0]]["x"], node_dict[triangle["node_ids"][0]]["y"]],
                    "properties": {
                        "depth": node_dict[triangle["node_ids"][0]]["depth"],
                        "value": node_dict[triangle["node_ids"][0]]["value"],
                        "id": node_dict[triangle["node_ids"][0]]["id"]
                    }
                }  # 闭合三角形
            ]
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[coord["coordinates"] for coord in coords]]
                },
                "properties": {
                    "id": triangle["id"],
                    "points_properties": [coord["properties"] for coord in coords[:3]]  # 存储每个点的属性
                }
            }
            features.append(feature)
        
        # 生成 GeoJSON 格式的数据
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        return geojson

    # 生成节点 GeoJSON 文件
    def generate_node_geojson(nodes, output_file, depth, value):
        features = []
        for node in nodes:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [node["x"], node["y"]]
                },
                "properties": {
                    "id": node["id"],
                    depth: node[depth],
                    value: node[value]
                }
            }
            features.append(feature)
        
        # 生成 GeoJSON 格式的数据
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        return geojson

    # 读取和解析 mesh 文件
    header, nodes, triangles = parse_mesh_file(mesh)

    # 如果 nodes 和 triangles 不为空，生成 GeoJSON
    if nodes and triangles:
        # 生成三角网 GeoJSON 文件
        nets = generate_triangular_geojson(nodes, triangles, './triangular_geojson.geojson')

        # 生成节点 GeoJSON 文件
        nodes = generate_node_geojson(nodes, '../nodes.geojson', 'depth', 'value')
        # return [nodes, nets]
        return nets
    else:
        print("No nodes or triangles found.")

    
#   绘制完成后的网格重新生成mesh文件
def Geojson_to_Mesh(geojson_data):
    nodes_dict = {}  # 用字典保存节点信息，key 为节点 id
    triangles = []
    
    # 解析 GeoJSON 中的每个 feature
    for feature in geojson_data['features']:
        triangle_id = feature['properties']['id']
        coordinates = feature['geometry']['coordinates'][0]  # 获取三角形的外环
        
        # 获取每个点的属性信息
        points_properties = feature['properties']['points_properties']
        
        # 遍历三角形的三个顶点及其属性
        node_ids = []
        for i, coord in enumerate(coordinates[:-1]):  # 跳过最后一个坐标，因为它是第一个坐标的重复
            point = points_properties[i]
            node_id = point['id']
            depth = point.get('depth', 0)
            value = int(point.get('value', 0))
            x, y = coord
            # 将节点保存到字典，key 是节点 id
            nodes_dict[node_id] = f"{node_id} {x:.6f} {y:.6f} {depth:.6f} {value}"
            node_ids.append(str(node_id))
        
        # 确保每个三角形正好有三个节点
        if len(node_ids) == 3:
            triangles.append(f"{triangle_id} {node_ids[0]} {node_ids[1]} {node_ids[2]}")
        else:
            print(f"错误: 三角形 {triangle_id} 不正好有 3 个唯一节点。")

    # 生成 mesh 文件内容
    # 按节点 id 排序
    sorted_nodes = sorted(nodes_dict.values(), key=lambda node: int(node.split()[0]))
    num_nodes = len(sorted_nodes)
    num_triangles = len(triangles)

    mesh_content = f"100079  1000  {num_nodes}  LONG/LAT\n"
    mesh_content += "\n".join(sorted_nodes) + "\n"  # 按顺序写入节点
    mesh_content += f"{num_triangles} 3 21\n"
    mesh_content += "\n".join(triangles) + "\n"
    
    return mesh_content

import os
import matplotlib.pyplot as plt
import gmsh
import meshio
import subprocess

def GenerateMesh(geojson_file, mesh_size, of_geo, of_msh, of_mesh):
    # 读取GeoJSON文件并提取坐标
    def read_coordinates_from_geojson(geojson_obj):
        # 提取第一个 Polygon 的坐标
        coordinates = geojson_obj['features'][0]['geometry']['coordinates'][0]
        return coordinates

    # 生成Gmsh的.geo文件
    def generate_gmsh_geo(points, output_file, mesh_size):
        with open(output_file, 'w') as f:
            # 写入点定义
            for i, (lon, lat) in enumerate(points):
                f.write(f"Point({i+1}) = {{{lon}, {lat}, 0, {mesh_size}}};\n")
            
            # 写入样条线（封闭线段）
            f.write("Line(1) = {")
            for i in range(1, len(points) + 1):
                f.write(f"{i}, ")
            f.write(f"{1}}};\n")  # 闭合样条线
            
            # 创建平面
            f.write("Line Loop(1) = {1};\n")
            f.write("Plane Surface(1) = {1};\n")
        
        # 打印生成的.geo文件内容
        with open(output_file, 'r') as f:
            print(f.read())

    # 绘制坐标点的可视化
    def plot_points(points):
        # 解包经度和纬度
        lons, lats = zip(*points)
        
        # 将第一个点添加到末尾，闭合多边形
        lons = list(lons) + [lons[0]]
        lats = list(lats) + [lats[0]]
        
        # 创建绘图
        plt.figure(figsize=(8, 6))
        plt.plot(lons, lats, 'bo-', label='样条线边界')
        plt.xlabel('经度')
        plt.ylabel('纬度')
        plt.title('Gmsh 样条线边界可视化')
        plt.grid(True)
        plt.legend()
        plt.show()

    # 使用Gmsh将.geo转换为.msh文件
    def convert_geo_to_msh(geo_file, msh_file):
        print(geo_file)
        print(msh_file)
        activate_path = 'D:\\anaconda3\\Scripts\\activate.bat oceanmesh2d'
        gmsh_path = 'D:\\anaconda3\\envs\\oceanmesh2d\\Scripts\\gmsh'  # 请根据实际路径调整
        command = f'call {activate_path} && "{gmsh_path}" {geo_file} -2 -o {msh_file}'
        try:
            # 调用 GMSH 命令
            subprocess.run(command, shell=True, check=True)
            print(f"成功将 {geo_file} 转换为 {msh_file}.")
        except subprocess.CalledProcessError as e:
            print(f"发生错误: {e}")

    # 读取 .msh 文件
    def read_msh_file(msh_file):
        mesh = meshio.read(msh_file)
        points = mesh.points[:, :2]  # 只保留 X, Y 坐标
        cells = mesh.cells_dict.get('triangle', [])  # 获取三角形单元
        return points, cells

    # 创建简化的 .mesh 文件
    def create_simple_mesh_file(mesh_file, points, cells):
        num_points = len(points)
        num_cells = len(cells)

        with open(mesh_file, 'w') as f:
            # 写入头信息（根据实际格式调整）
            f.write(f'100079  1000  {num_points}  PROJCS["UTM-50",GEOGCS["Unused",DATUM["UTM Projections",'
                    'SPHEROID["WGS 1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",'
                    '0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000],'
                    'PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",123],PARAMETER["Scale_Factor",0.9996],'
                    'PARAMETER["Latitude_Of_Origin",0],UNIT["Meter",1]]\n')

            # 写入点信息
            for i, point in enumerate(points):
                x, y = point[0], point[1]
                f.write(f"{i + 1} {x:.6f} {y:.6f} 0.000000 0\n")  # 第四列和第五列设为 0

            # 写入单元信息
            f.write(f"{num_cells} 3 21\n")
            for i, cell in enumerate(cells):
                f.write(f"{i + 1} {cell[0] + 1} {cell[1] + 1} {cell[2] + 1}\n")  # 索引从 1 开始

    # 删除文件
    def delete_files(*files):
        for file in files:
            if os.path.exists(file):
                os.remove(file)
                print(f"已删除文件: {file}")

    # 步骤 1: 从GeoJSON文件中读取坐标
    points = read_coordinates_from_geojson(geojson_file)
    
    # 步骤 2: 生成Gmsh的.geo文件
    generate_gmsh_geo(points, of_geo, mesh_size)
    print(f"Gmsh .geo 文件 '{of_geo}' 生成，网格大小为 {mesh_size}。")
    
    # 步骤 3: 转.geo为.msh文件
    convert_geo_to_msh(of_geo, of_msh)
    
    # 步骤 4: 读取 .msh 文件提取点和单元信息
    mesh_points, cells = read_msh_file(of_msh)
    
    # 步骤 5: 创建简化的 .mesh 文件
    create_simple_mesh_file(of_mesh, mesh_points, cells)
    print(f"简化的 Mesh 文件 '{of_mesh}' 已创建。")

    # 步骤 6: 处理完成后删除本地生成的中间文件
    delete_files(of_geo, of_msh)

    return of_mesh

  
# import os
# from osgeo import ogr, gdal

# def erase_geojson_with_shp_gdal(geojson_data, shp_file, output_shp_file):
#     """
#     使用 GDAL 擦除 GeoJSON 中与指定的 shp 文件相交的部分，保留非相交的部分，并保存结果为本地 Shapefile。
    
#     参数:
#     geojson_data: 输入的 GeoJSON 字符串或字典。
#     shp_file: 输入的 shp 文件路径。
#     output_shp_file: 保存结果的输出 Shapefile 文件路径。
    
#     返回:
#     新的 GeoJSON 字符串，保留 shp 区域之外的部分。
#     """
#     # 设置接受非闭合环的几何选项为NO
#     gdal.SetConfigOption("OGR_GEOMETRY_ACCEPT_UNCLOSED_RING", "NO")
    
#     # 检查 geojson_data 是字典还是字符串
#     if isinstance(geojson_data, dict):
#         geojson_str = json.dumps(geojson_data)
#     elif isinstance(geojson_data, str):
#         geojson_str = geojson_data
#     else:
#         raise ValueError("GeoJSON data must be a valid JSON string or dictionary")

#     # 将 GeoJSON 数据写入虚拟内存文件系统（vsimem）
#     geojson_mem_path = "/vsimem/input_geojson.geojson"
#     gdal.FileFromMemBuffer(geojson_mem_path, geojson_str)

#     # 使用 GDAL 打开虚拟内存中的 GeoJSON 文件
#     geojson_driver = ogr.GetDriverByName("GeoJSON")
#     geojson_datasource = geojson_driver.Open(geojson_mem_path)

#     if geojson_datasource is None:
#         raise Exception("Failed to open GeoJSON data.")
    
#     # 获取第一个图层
#     geojson_layer = geojson_datasource.GetLayer()

#     # 读取 Shapefile 数据
#     shp_driver = ogr.GetDriverByName("ESRI Shapefile")
#     shp_datasource = shp_driver.Open(shp_file, 0)  # 以只读模式打开

#     if shp_datasource is None:
#         raise Exception(f"Failed to open Shapefile: {shp_file}")
    
#     # 获取 Shapefile 图层
#     shp_layer = shp_datasource.GetLayer()

#     # 将所有 Shapefile 的几何合并为一个多边形
#     shp_union_geom = None
#     for feature in shp_layer:
#         geom = feature.GetGeometryRef()
#         if geom is not None:
#             # 检查是否是闭合环
#             if not geom.IsRing():
#                 geom.CloseRings()  # 自动关闭未闭合的几何环

#             if shp_union_geom is None:
#                 shp_union_geom = geom.Clone()
#             else:
#                 shp_union_geom = shp_union_geom.Union(geom)
    
#     # 确保合并后的几何有效
#     if not shp_union_geom.IsValid():
#         shp_union_geom = shp_union_geom.MakeValid()
    
#     # 创建 Shapefile 数据源以保存结果
#     shp_driver = ogr.GetDriverByName("ESRI Shapefile")
#     if os.path.exists(output_shp_file):
#         shp_driver.DeleteDataSource(output_shp_file)  # 如果已经存在则删除
    
#     out_datasource = shp_driver.CreateDataSource(output_shp_file)
#     if out_datasource is None:
#         raise Exception(f"Failed to create output Shapefile: {output_shp_file}")
    
#     # 创建结果图层
#     srs = geojson_layer.GetSpatialRef()  # 保持与原始 GeoJSON 一致的坐标系
#     out_layer = out_datasource.CreateLayer('result', srs, geom_type=ogr.wkbPolygon)

#     # 创建一个字段（你可以根据需要添加更多字段）
#     field_defn = ogr.FieldDefn("id", ogr.OFTInteger)
#     out_layer.CreateField(field_defn)

#     # 遍历 GeoJSON 图层中的每个要素，并执行擦除操作
#     feature_id = 0
#     for geojson_feature in geojson_layer:
#         geom = geojson_feature.GetGeometryRef()

#         if geom is not None and geom.Intersects(shp_union_geom):
#             # 如果几何与 Shapefile 几何相交，进行擦除
#             erased_geom = geom.Difference(shp_union_geom)
            
#             if erased_geom.IsEmpty():
#                 continue  # 跳过空的几何
            
#             # 创建一个新要素，并将擦除后的几何添加进去
#             new_feature = ogr.Feature(out_layer.GetLayerDefn())
#             new_feature.SetGeometry(erased_geom)
#             new_feature.SetField("id", feature_id)
#             out_layer.CreateFeature(new_feature)
#             new_feature = None
#             feature_id += 1
    
#     # 释放资源并关闭数据源
#     out_datasource = None
#     geojson_datasource = None
#     shp_datasource = None
#     # 添加转换geojson
#     return f"{output_shp_file}"
 
import os
from osgeo import ogr, gdal

def erase_geojson_with_shp_gdal(geojson_data, shp_file, output_shp_file):
    """
    使用 GDAL 擦除 GeoJSON 中与指定的 shp 文件相交的部分，保留非相交的部分，并保存结果为本地 Shapefile。
    
    参数:
    geojson_data: 输入的 GeoJSON 字符串或字典。
    shp_file: 输入的 shp 文件路径。
    output_shp_file: 保存结果的输出 Shapefile 文件路径。
    
    返回:
    新的 GeoJSON 字符串，保留 shp 区域之外的部分。
    """
    # 设置接受非闭合环的几何选项为NO
    gdal.SetConfigOption("OGR_GEOMETRY_ACCEPT_UNCLOSED_RING", "NO")
    
    # 将 GeoJSON 数据转换为字符串
    if isinstance(geojson_data, dict):
        geojson_str = json.dumps(geojson_data)
    elif isinstance(geojson_data, str):
        geojson_str = geojson_data
    else:
        raise ValueError("GeoJSON data must be a valid JSON string or dictionary")

    # 将 GeoJSON 数据写入虚拟内存文件系统（vsimem）
    geojson_mem_path = "/vsimem/input_geojson.geojson"
    gdal.FileFromMemBuffer(geojson_mem_path, geojson_str)

    # 使用 GDAL 打开虚拟内存中的 GeoJSON 文件
    geojson_datasource = ogr.Open(geojson_mem_path)
    geojson_layer = geojson_datasource.GetLayer()

    # 打开 Shapefile
    shp_datasource = ogr.Open(shp_file)
    shp_layer = shp_datasource.GetLayer()

    # 合并所有 Shapefile 的几何为一个多边形
    shp_union_geom = None
    for feature in shp_layer:
        geom = feature.GetGeometryRef()
        if geom:
            if shp_union_geom is None:
                shp_union_geom = geom.Clone()
            else:
                shp_union_geom = shp_union_geom.Union(geom)
    
    # 确保合并后的几何有效
    if not shp_union_geom.IsValid():
        shp_union_geom = shp_union_geom.MakeValid()
    
    # 创建 Shapefile 数据源以保存结果
    shp_driver = ogr.GetDriverByName("ESRI Shapefile")
    if os.path.exists(output_shp_file):
        shp_driver.DeleteDataSource(output_shp_file)
    
    out_datasource = shp_driver.CreateDataSource(output_shp_file)
    srs = geojson_layer.GetSpatialRef()
    out_layer = out_datasource.CreateLayer('result', srs, geom_type=ogr.wkbPolygon)

    # 创建字段
    field_defn = ogr.FieldDefn("id", ogr.OFTInteger)
    out_layer.CreateField(field_defn)

    # 遍历 GeoJSON 图层中的每个要素，执行擦除操作
    feature_id = 0
    for geojson_feature in geojson_layer:
        geom = geojson_feature.GetGeometryRef()

        # 如果与 Shapefile 几何相交，执行擦除
        if geom and geom.Intersects(shp_union_geom):
            erased_geom = geom.Difference(shp_union_geom)
            
            if not erased_geom.IsEmpty():
                new_feature = ogr.Feature(out_layer.GetLayerDefn())
                new_feature.SetGeometry(erased_geom)
                new_feature.SetField("id", feature_id)
                out_layer.CreateFeature(new_feature)
                feature_id += 1
    
    # 释放资源并关闭数据源
    out_datasource = None
    geojson_datasource = None
    shp_datasource = None

    return output_shp_file

import geopandas as gpd



def erase_geojson_with_shp_geopandas(geojson_data, shp_file, output_shp_file):
    """
    使用 GeoPandas 擦除 GeoJSON 中与指定的 shp 文件相交的部分，保留非相交的部分，并保存结果为本地 Shapefile。
    
    参数:
    geojson_data: 输入的 GeoJSON 字符串或字典，或 GeoJSON 文件路径。
    shp_file: 输入的 shp 文件路径。
    output_shp_file: 保存结果的输出 Shapefile 文件路径。
    
    返回:
    新的 GeoDataFrame，保留 shp 区域之外的部分。
    """
    # 如果 geojson_data 是文件路径，读取 GeoJSON 数据
    if isinstance(geojson_data, str):
        gdf_geojson = gpd.read_file(geojson_data)
    elif isinstance(geojson_data, dict):
        gdf_geojson = gpd.GeoDataFrame.from_features(geojson_data['features'])
    else:
        raise ValueError("GeoJSON data must be a valid file path or dictionary.")
    
    # 检查 GeoJSON 的坐标系是否存在
    if gdf_geojson.crs is None:
        # 如果没有指定坐标系，假设为 WGS84 (EPSG:4326)
        gdf_geojson.set_crs(epsg=4326, inplace=True)
    
    # 读取 Shapefile 数据
    gdf_shp = gpd.read_file(shp_file)

    # 确保两者使用相同的坐标系
    if gdf_geojson.crs != gdf_shp.crs:
        gdf_shp = gdf_shp.to_crs(gdf_geojson.crs)
    
    # 使用 GeoPandas 的 overlay 进行擦除操作
    gdf_erased = gpd.overlay(gdf_geojson, gdf_shp, how='difference')

    # 将结果保存为 Shapefile
    gdf_erased.to_file(output_shp_file, driver='ESRI Shapefile')

    return output_shp_file

import geopandas as gpd
def shp_to_geojson_with_geopandas(shp_file):
    # 读取 Shapefile
    gdf = gpd.read_file(shp_file)
    
    # 将 GeoDataFrame 转换为 GeoJSON 字符串
    geojson_str = gdf.to_json()  # 转换为 GeoJSON 字符串
    
    # 将字符串转换为 Python 字典对象
    geojson_obj = json.loads(geojson_str)
    
    return geojson_obj




import geojson
# （2） 岸线点转Geojson
def dat_to_geojson_with_conversion(input_file):
    # 初始化一个空列表来存储坐标
    coordinates = []

    # 读取文件中的坐标，跳过第一行
    with open(input_file, 'r') as file:
        lines = file.readlines()[1:]  # 跳过第一行

        for line in lines:
            parts = line.strip().split()  # 按空格分割
            if len(parts) >= 2:  # 确保有至少两个部分
                try:
                    lon = float(parts[0])  # 经度
                    lat = float(parts[1])  # 纬度
                    coordinates.append((lon, lat))
                except ValueError:
                    print(f"无法转换行: {line}，跳过该行。")
            else:
                print(f"数据格式不正确的行: {line}，跳过该行。")

    # 创建 GeoJSON FeatureCollection
    features = []
    for idx, coord in enumerate(coordinates):
        point = geojson.Point(coord)
        # 添加 id 到 properties
        feature = geojson.Feature(geometry=point, properties={"id": idx + 1})  # id 从 1 开始
        features.append(feature)

    feature_collection = geojson.FeatureCollection(features)
    return feature_collection
# Geojson点要素转84
def transPoint2WGS84(geojson):
    # Define Gauss-Kruger projection (assuming zone number 41)
    zone_number = 40
    central_meridian = zone_number * 3  # For 3-degree zones, central meridian is zone number times 3

    gauss_kruger = Proj(proj='tmerc', lat_0=0, lon_0=central_meridian, k=1, x_0=500000, y_0=0, ellps='WGS84', datum='WGS84')
    wgs84 = Proj(proj='latlong', datum='WGS84')

    for feature in geojson["features"]:
        if feature["geometry"]["type"] == "Point":
            coordinates = feature["geometry"]["coordinates"]

            # Check if coordinates is a list or tuple with at least two elements
            if isinstance(coordinates, (list, tuple)) and len(coordinates) >= 2:
                x, y = coordinates[:2]  # Take only the first two elements
                lon, lat = transform(gauss_kruger, wgs84, x, y)
                feature["geometry"]["coordinates"] = [lon, lat]
            else:
                print(f"Invalid coordinates format: {coordinates}")  # Debugging statement
 
    return geojson

 


# （X）bln 岸线转Json
def bln_to_geojson(bln_file):
    coordinates = []
    with open(bln_file, 'r') as file:
        lines = file.readlines()
        for line in lines:
            parts = line.strip().split()
            if len(parts) == 2:
                x, y = map(float, parts)
                coordinates.append([x, y])
    
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                },
                "properties": {}
            }
        ]
    }
    return geojson
    
 
# （X）线JSON平面坐标转84坐标
from pyproj import Proj, transform
def LinesJosn2WGS84(geojson):
    zone_number = 41
    central_meridian = zone_number * 3 # 对于3度带，每个带的中央经线是带号乘以3

    gauss_kruger = Proj(proj='tmerc', lat_0=0, lon_0=central_meridian, k=1, x_0=500000, y_0=0, ellps='WGS84', datum='WGS84')
    wgs84 = Proj(proj='latlong', datum='WGS84')

    # 转换GeoJSON中的坐标
    for feature in geojson["features"]:
        for i in range(len(feature["geometry"]["coordinates"])):
            x, y = feature["geometry"]["coordinates"][i]
            lon, lat = transform(gauss_kruger, wgs84, x, y)
            feature["geometry"]["coordinates"][i] = [lon, lat]

    return geojson



