
import { generateRandomCoordinates } from "@/utils/coordinateGenerator.js";
import { getIconPath, getIconPathMarkIcons } from "@/utils/utilstools.js";
export const getMarkerData = (mapMarkersConfig, useTypeLayer, heatmapConfig, warningDrawerVisible,
    initShowPanel) => {
    // 生成随机坐标点（50公里内）
    const randomCoords = generateRandomCoordinates(
        29.330254208488313,
        121.69077697750392,
        50,
        12
    );
    const riskList = randomCoords.map((coord, index) => ({
        coordinates: [coord.lng, coord.lat],
        options: {
            id: `risk-pointer-${index}`,
            type: "risk-point",
            useTypeLayer: useTypeLayer.value,
            style: {
                icon: {
                    src: getIconPath("allIcon2"),
                    size: [36, 36],
                    anchor: [0, 0],
                    scale: 0.7,
                    displacement: [13, -13],
                    offset: [36 * (index % 10), 0], // 使用不同的精灵图位置
                    borderSize: 25, // 外边框大小
                    borderColor: "#ffa502", // 外边框颜色
                    borderWidth: 2, // 外边框宽度
                    showBorder: false, // 初始隐藏边框
                },
            },
            data: {
                popupType: "risk-point",
                distance: coord.distance,
                shipName: `浙J${String(35470 + index).padStart(5, "0")}`,
                dept: "海关",
                principal: "张三",
                riskType: "high",
                lastUpdate: new Date().toLocaleString(),
                markerId: `risk-pointer-${index}`,
            },
        },
    }));
    // 批量添加
    mapMarkersConfig.addMarkers(riskList, {
        useBatch: true,
        batchSize: 1000,
        // isEnableCluster: true,
        onProgress: (progress) => {
            console.log("进度:", progress);
        },
    });
    // 生成随机坐标点（50公里内） 可疑车辆
    const carCoords = generateRandomCoordinates(
        29.330254208488313,
        121.69077697750392,
        50,
        12
    );
    const carList = carCoords.map((coord, index) => ({
        coordinates: [coord.lng, coord.lat],
        options: {
            id: `car-${index}`,
            type: "car",
            useTypeLayer: useTypeLayer.value,
            style: {
                icon: {
                    src: getIconPathMarkIcons("icon10"),
                    size: [53, 53],
                    anchor: [0, 0],
                    scale: 0.7,
                    displacement: [18, -18], // 偏移量
                    borderSize: 30, // 外边框大小
                    borderColor: "#ffa502", // 外边框颜色
                    borderWidth: 2, // 外边框宽度
                    showBorder: false, // 初始隐藏边框
                },
                text: {
                    content: "可疑车辆",
                    color: "#000000",
                    offsetX: 10,
                    offsetY: -17,
                    bgImage: "/src/assets/imgs/qb.png", // 背景图片路径
                    bgSize: [100, 50], // 背景图片尺寸
                    displacement: [18, 9], // 汽包位置偏移
                    bgScale: 0.7, // 缩放比例
                    bgOpacity: 0.9, // 透明度
                    font: "10px Arial",
                    showBackground: false,
                },
            },
            data: {
                popupType: "car",
                title: `可疑车辆`,
                description: `距离中心 0 公里`,
                distance: 0,
                cardId: `123456789`,
                type: "高栏货车",
                status: "行驶中",
                shipName: `浙J35470`,
                vehicleType: "高栏货车",
                tag: "涉私车辆",
                riskLevel: "高风险",
                lastUpdate: new Date().toLocaleString(),
                markerId: `car-${index}`,
            },
        },
    }));
    // 批量添加
    mapMarkersConfig.addMarkers(carList, {
        useBatch: true,
        // isEnableCluster: true,
        batchSize: 1000,
        onProgress: (progress) => {
            console.log("进度:", progress);
        },
        onComplete: () => {
            // 启用指定类型的聚合
            // mapMarkersConfig.enableClustering("car", {
            //   distance: 40, // 聚合距离
            //   minDistance: 20, // 最小聚合距离
            // });
            // mapMarkersConfig.toggleClustering("car", true);
        },
    });

    // 生成随机坐标点（50公里内） 船舶动态
    const shipDynamicCoords = generateRandomCoordinates(
        29.22087519433525,
        122.49099904613172,
        30,
        20
    );
    const shipList = shipDynamicCoords.map((coord, index) => ({
        coordinates: [coord.lng, coord.lat],
        options: {
            id: `ship-dynamic-${index}`,
            type: "ship",
            useTypeLayer: useTypeLayer.value,
            style: {
                icon: {
                    src: getIconPathMarkIcons("icon16"),
                    size: [30, 30],
                    anchor: [0, 0],
                    scale: 1,
                    displacement: [14, -14], // 偏移量
                    borderSize: 30, // 外边框大小
                    borderColor: "#ffa502", // 外边框颜色
                    // 360
                    rotation: Math.PI - (index % 360),
                    borderWidth: 2, // 外边框宽度
                    showBorder: false, // 初始隐藏边框
                },
                text: {
                    content: "华盛167",
                    color: "#000000",
                    offsetX: 10,
                    offsetY: -17,
                    bgImage: "/src/assets/imgs/qb.png", // 背景图片路径
                    bgSize: [100, 50], // 背景图片尺寸
                    displacement: [18, 9], // 汽包位置偏移
                    bgScale: 0.7, // 缩放比例
                    bgOpacity: 0.9, // 透明度
                    font: "10px Arial",
                    showBackground: true,
                },
            },
            data: {
                popupType: "ship",
                title: `船舶动态`,
                description: `距离中心 0 公里`,
                distance: 0,
                cardId: `123456789`,
            },
        },
    }));
    // 批量添加
    mapMarkersConfig.addMarkers(shipList, {
        useBatch: true,
        batchSize: 1000,
        // isEnableCluster: true,
        onProgress: (progress) => {
            console.log("进度:", progress);
        },
    });
    // 单个添加
    // shipDynamicCoords.forEach((coord, index) => {
    //   mapMarkersConfig.addMarker(
    //     [coord.lng, coord.lat],
    //     {
    //       id: `ship-dynamic-${index}`,
    //       type: "ship",
    //       useTypeLayer: useTypeLayer.value,
    //       style: {
    //         icon: {
    //           src: getIconPathMarkIcons("icon16"),
    //           size: [30, 30],
    //           anchor: [0, 0],
    //           scale: 1,
    //           displacement: [14, -14], // 偏移量
    //           borderSize: 30, // 外边框大小
    //           borderColor: "#ffa502", // 外边框颜色
    //           borderWidth: 2, // 外边框宽度
    //           showBorder: false, // 初始隐藏边框
    //         },
    //         text: {
    //           content: "华盛167",
    //           color: "#000000",
    //           offsetX: 10,
    //           offsetY: -17,
    //           bgImage: "/src/assets/imgs/qb.png", // 背景图片路径
    //           bgSize: [100, 50], // 背景图片尺寸
    //           displacement: [18, 9], // 汽包位置偏移
    //           bgScale: 0.7, // 缩放比例
    //           bgOpacity: 0.9, // 透明度
    //           font: "10px Arial",
    //           showBackground: false,
    //         },
    //       },
    //       data: {
    //         popupType: "ship",
    //         title: `船舶动态`,
    //         description: `距离中心 0 公里`,
    //         distance: 0,
    //         cardId: `123456789`,
    //       },
    //     }
    //   );
    // });

    const trackLines = [
        [
            {
                latLon: [121.4582, 29.3395],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.4033, 29.3658],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.3593, 29.4089],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.2893, 29.4077],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.2138, 29.4208],
                text: "2025.06.15 01:18",
            },
        ],
        [
            {
                latLon: [121.4582, 29.3395],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.3854, 29.3359],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.2879, 29.3526],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.2206, 29.3155],
                text: "2025.06.15 01:18",
            },
        ],
        [
            {
                latLon: [121.4582, 29.3395],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.4239, 29.276],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.336, 29.2988],
                text: "2025.06.15 01:18",
            },
            {
                latLon: [121.2302, 29.2257],
                text: "2025.06.15 01:18",
            },
        ],
    ];
    // 生成轨迹路线
    trackLines.forEach((line) => {
        mapMarkersConfig.generateTrackRoute(line, {
            showStart: false,
            showEnd: false,
            showMidpoint: false,
            showTips: true,
            animation: false,
            // animationDuration: 5000,
            // midpointText: "中间点",
            style: {
                stroke: "#d65e37",
                strokeWidth: 3,
                lineDash: [],
                lineCap: "round",
                lineJoin: "round",
            },
        });
    });
    //绘制预警牌
    const overlays = mapMarkersConfig.createMultipleMarkers([
        [121.9251, 29.2748],
        [121.7960, 29.0541],
        [122.0364, 29.0205],
        [122.2039, 29.4125],
    ]);

    // setTimeout(() => {
    //     mapMarkersConfig.clearOverlaysByType();
    // }, 5000);
    window.closeWarnMarker = function (e) {
        e.stopPropagation();
        e.target.parentElement.parentElement.style.display = "none";
    };
    window.disPlayWarnDetail = function (e) {
        initShowPanel();
        console.log("🚀 ~ disPlayWarnDetail ~ e:", e)
        warningDrawerVisible.value = true;
    };
    // 创建多边形
    mapMarkersConfig.drawFilledPolygon(
        [
            [122.1558, 29.4244],
            [122.2012, 29.3227],
            [122.2685, 29.3227],
            [122.2863, 29.4244],
            [122.219, 29.4758],
        ],
        { fillColor: "#c18a7e80", strokeColor: "#fe383790", strokeWidth: 1 }
    );

    // 热力图
    heatmapConfig.init({
        title: "风险热力点",
        type: "heatmap",
        visible: true,
        zIndex: 1500,
        radius: 10,
        blur: 20,
        gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    });
    heatmapConfig.setData([
        { lon: 121.92, lat: 29.27, weight: 0.5 },
        { lon: 121.95, lat: 29.29, weight: 0.9 },
        { lon: 121.3314, lat: 29.1386, weight: 0.8 },
    ]);
};