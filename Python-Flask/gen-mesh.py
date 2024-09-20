import matplotlib.pyplot as plt
import gmsh
import meshio

def GenerateMesh(geojson_file, mesh_size, of_geo,of_msh,of_mesh):
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
            f.write("Spline(1) = {")
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

    def convert_geo_to_msh(geo_file, msh_file):
        # 初始化 gmsh
        gmsh.initialize()
        
        # 读取 .geo 文件
        gmsh.open(geo_file)
        
        # 生成2D网格
        gmsh.model.mesh.generate(2)
        
        # 保存为 .msh 文件
        gmsh.write(msh_file)
        
        # 进行网格的可视化
        # gmsh.fltk.run()
        
        # 关闭 gmsh
        gmsh.finalize()

    def read_msh_file(msh_file):
        """
        读取 Gmsh 生成的 .msh 文件，提取点和单元信息。
        """
        mesh = meshio.read(msh_file)
        points = mesh.points[:, :2]  # 只保留 X, Y 坐标
        cells = mesh.cells_dict.get('triangle', [])  # 获取三角形单元
        return points, cells

    def create_simple_mesh_file(mesh_file, points, cells):

        """
        根据提取的信息创建 .mesh 文件，保留网格属性，其他的写为 0。
        """
        num_points = len(points)
        num_cells = len(cells)

        with open(mesh_file, 'w') as f:
            # 写入文件头信息，格式根据实际需要调整
            f.write(f'100079  1000  {num_points}  PROJCS["UTM-50",GEOGCS["Unused",DATUM["UTM Projections",'
                    'SPHEROID["WGS 1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",'
                    '0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000],'
                    'PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",123],PARAMETER["Scale_Factor",0.9996],'
                    'PARAMETER["Latitude_Of_Origin",0],UNIT["Meter",1]]\n')

            # 写入点的坐标信息，保留X、Y坐标，其他值设置为 0
            for i, point in enumerate(points):
                x, y = point[0], point[1]
                f.write(f"{i + 1} {x:.6f} {y:.6f} 0.000000 0\n")  # 第四列和第五列写为 0

            # 写入单元信息
            f.write(f"{num_cells} 3 21\n")
            for i, cell in enumerate(cells):
                f.write(f"{i + 1} {cell[0] + 1} {cell[1] + 1} {cell[2] + 1}\n")  # MIKE21 的索引从 1 开始


    # 1. 从GeoJSON文件中读取坐标
    points = read_coordinates_from_geojson(geojson_file)
    # 2. 生成Gmsh的.geo文件
    generate_gmsh_geo(points, of_geo, mesh_size)
    print(f"Gmsh .geo 文件 '{of_geo}' 生成，网格大小为 {mesh_size}。")
    # 3. 转.geo为.msh文件
    convert_geo_to_msh(of_geo,of_msh)
    # 4. 输入的 .msh 文件路径
        # 读取 msh 文件提取点和单元信息
    mesh_points, cells = read_msh_file( of_msh)
        # 创建简化的 mesh 文件
    create_simple_mesh_file(of_mesh, mesh_points, cells)
    print(f"简化的 Mesh 文件 '{of_mesh}' 已创建。")
