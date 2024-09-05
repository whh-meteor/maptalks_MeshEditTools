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
        return [nodes, nets]
    else:
        print("No nodes or triangles found.")

def Mesh_nodes_to_Triangle_Json_unse(mesh):

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

            # 打印当前解析的行
            # print(f"Parsing line: {line}")

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
                [node_dict[triangle["node_ids"][0]]["x"], node_dict[triangle["node_ids"][0]]["y"]],
                [node_dict[triangle["node_ids"][1]]["x"], node_dict[triangle["node_ids"][1]]["y"]],
                [node_dict[triangle["node_ids"][2]]["x"], node_dict[triangle["node_ids"][2]]["y"]],
                [node_dict[triangle["node_ids"][0]]["x"], node_dict[triangle["node_ids"][0]]["y"]] # 闭合三角形
            ]
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                },
                "properties": {
                    "id": triangle["id"]
                }
            }
            features.append(feature)
        
        # 生成 GeoJSON 格式的数据
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        return geojson
        # # 将数据保存到文件
        # with open(output_file, 'w') as f:
        #     json.dump(geojson, f, indent=2)

        # print(f"Triangular GeoJSON saved to {output_file}")

    # 生成节点 GeoJSON 文件
    def generate_node_geojson(nodes, output_file, depth,value):
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
        # # 将数据保存到文件
        # with open(output_file, 'w') as f:
        #     json.dump(geojson, f, indent=2)
        
        # print(f" Node GeoJSON saved to {output_file}")
    # 读取和解析 mesh 文件
    header, nodes, triangles = parse_mesh_file(mesh)

    # 检查解析结果
    # print(f"Parsed {len(nodes)} nodes and {len(triangles)} triangles.")

    # 如果 nodes 和 triangles 不为空，生成 GeoJSON
    if nodes and triangles:
        # 生成三角网 GeoJSON 文件
        nets = generate_triangular_geojson(nodes, triangles, './triangular_geojson.geojson')

        # 生成节点 GeoJSON 文件
        nodes =  generate_node_geojson(nodes, '../nodes.geojson', 'depth','value')
        return [nodes,nets]
    else:
        print("No nodes or triangles found.")

#   绘制完成后的网格重新生成mesh文件
def Geojson_to_Mesh(nodes_geojson, triangles_geojson):
    # 提取节点信息
    nodes = []
    for feature in nodes_geojson['features']:
        node_id = feature['properties']['id']
        x, y = feature['geometry']['coordinates']
        depth = feature['properties'].get('depth', 0)  # 如果没有找到，使用默认值0
        value = int(feature['properties'].get('value', 0))  # 如果没有找到，使用默认值0
        nodes.append(f"{node_id} {x:.6f} {y:.6f} {depth:.6f} {value}")

    # 提取三角形信息
    triangles = []
    for feature in triangles_geojson['features']:
        triangle_id = feature['properties']['id']
        coordinates = feature['geometry']['coordinates'][0]  # 获取多边形的外环

        # 通过匹配坐标找到节点 id
        node_ids = []
        for coord in coordinates[:-1]:  # 跳过最后一个坐标，因为它是第一个坐标的重复
            for node in nodes_geojson['features']:
                node_x, node_y = node['geometry']['coordinates']
                if abs(node_x - coord[0]) < 1e-6 and abs(node_y - coord[1]) < 1e-6:
                    node_ids.append(node['properties']['id'])
                    break
        
        # 确保每个三角形正好有三个节点
        if len(node_ids) == 3:
            triangles.append(f"{triangle_id} {node_ids[0]} {node_ids[1]} {node_ids[2]}")
        else:
            print(f"错误: 三角形 {triangle_id} 不正好有 3 个唯一节点。")

    # 生成 mesh 文件内容
    # 计算网格数量和节点数量
    num_nodes = len(nodes)
    num_triangles = len(triangles)


    mesh_content = f"100079  1000  {num_nodes}  LONG/LAT\n"
    mesh_content += "\n".join(nodes) + "\n"
    mesh_content += f"{num_triangles} 3 21\n"
    mesh_content += "\n".join(triangles) + "\n"
    
    return mesh_content

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



