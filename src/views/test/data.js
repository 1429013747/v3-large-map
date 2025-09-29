const getMarkerData = () => {
    // 生成随机坐标点（50公里内）
    const randomCoords = generateRandomCoordinates(
        29.330254208488313,
        121.69077697750392,
        50,
        10
    );
    const riskList = randomCoords.map((coord, index) => ({
        coordinates: [coord.lng, coord.lat],
        options: {
            id: `random-marker-${index}`,
            type: "icon",
            useTypeLayer: useTypeLayer.value,
            style: {
                icon: {
                    src: getIconPath("allIcon"),
                    size: [18, 18],
                    anchor: [0, 0],
                    scale: 1,
                    displacement: [9, -9],
                    offset: [18 * (index % 10), 0], // 使用不同的精灵图位置
                    borderSize: 25, // 外边框大小
                    borderColor: "#ffa502", // 外边框颜色
                    borderWidth: 2, // 外边框宽度
                    showBorder: false, // 初始隐藏边框
                },
            },
            data: {
                popupType: "icon",
                title: `可疑车辆 ${index + 1}`,
                description: `距离中心 ${coord.distance.toFixed(1)} 公里`,
                distance: coord.distance,
                cardId: `123456789${index}`,
                type: "高栏货车",
                状态: "行驶中",
                shipName: `浙J${String(35470 + index).padStart(5, "0")}`,
                vehicleType: "高栏货车",
                status: "driving",
                tag: "涉私车辆",
                riskLevel: "high",
                lastUpdate: new Date().toLocaleString(),
            },
        },
    }));
    // 批量添加
    mapMarkersConfig.addMarkers(riskList, {
        useBatch: true,
        batchSize: 1000,
        // isEnableCluster: false,
        onProgress: (progress) => {
            console.log("进度:", progress);
        },
    });
    // 虚拟化添加
    // mapMarkersConfig.addMarkersVirtualized(riskList, {
    //   onViewportChange: (progress) => {
    //     console.log("进度:", progress);
    //   },
    // });
    // 单个添加
    // 添加随机分布的标记点 风险点
    // randomCoords.forEach((coord, index) => {
    //   mapMarkersConfig.addMarker([coord.lng, coord.lat], {
    //     id: `random-marker-${index}`,
    //     type: "icon",
    //     useTypeLayer: useTypeLayer.value,
    //     style: {
    //       icon: {
    //         src: getIconPath("allIcon"),
    //         size: [18, 18],
    //         anchor: [0, 0],
    //         scale: 1,
    //         displacement: [9, -9],
    //         offset: [18 * (index % 10), 0], // 使用不同的精灵图位置
    //         borderSize: 25, // 外边框大小
    //         borderColor: "#ffa502", // 外边框颜色
    //         borderWidth: 2, // 外边框宽度
    //         showBorder: false, // 初始隐藏边框
    //       },
    //     },
    //     data: {
    //       popupType: "icon",
    //       title: `可疑车辆 ${index + 1}`,
    //       description: `距离中心 ${coord.distance.toFixed(1)} 公里`,
    //       distance: coord.distance,
    //       cardId: `123456789${index}`,
    //       type: "高栏货车",
    //       状态: "行驶中",
    //       shipName: `浙J${String(35470 + index).padStart(5, "0")}`,
    //       vehicleType: "高栏货车",
    //       status: "driving",
    //       tag: "涉私车辆",
    //       riskLevel: "high",
    //       lastUpdate: new Date().toLocaleString(),
    //     },
    //   });
    // });
    // 生成随机坐标点（50公里内） 可疑车辆
    const carCoords = generateRandomCoordinates(
        29.330254208488313,
        121.69077697750392,
        50,
        10
    );
    const carList = carCoords.map((coord, index) => ({
        coordinates: [coord.lng, coord.lat],
        options: {
            id: `random-car-${index}`,
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
                状态: "行驶中",
                shipName: `浙J35470`,
                vehicleType: "高栏货车",
                status: "driving",
                tag: "涉私车辆",
                riskLevel: "high",
                lastUpdate: new Date().toLocaleString(),
            },
        },
    }));
    // 批量添加
    mapMarkersConfig.addMarkers(carList, {
        useBatch: true,
        // isEnableCluster: false,
        batchSize: 1000,
        onProgress: (progress) => {
            console.log("进度:", progress);
        },
        onComplete: () => {
            // 启用指定类型的聚合
            mapMarkersConfig.enableClustering("car", {
                distance: 40, // 聚合距离
                minDistance: 20, // 最小聚合距离
            });
            mapMarkersConfig.toggleClustering("car", true);
        },
    });
    // 虚拟化添加
    // mapMarkersConfig.addMarkersVirtualized(carList, {
    //   onViewportChange: (progress) => {
    //     console.log("进度:", progress);
    //   },
    // });

    // 单个添加
    // carCoords.forEach((coord, index) => {
    //   mapMarkersConfig.addMarker([coord.lng, coord.lat], {
    //     id: `random-car-${index}`,
    //     type: "car",
    //     useTypeLayer: useTypeLayer.value,
    //     style: {
    //       icon: {
    //         src: getIconPathMarkIcons("icon10"),
    //         size: [53, 53],
    //         anchor: [0, 0],
    //         scale: 0.7,
    //         displacement: [14, -14], // 偏移量
    //         borderSize: 30, // 外边框大小
    //         borderColor: "#ffa502", // 外边框颜色
    //         borderWidth: 2, // 外边框宽度
    //         showBorder: false, // 初始隐藏边框
    //       },
    //       text: {
    //         content: "可疑车辆",
    //         color: "#000000",
    //         offsetX: 10,
    //         offsetY: -17,
    //         bgImage: "/src/assets/imgs/qb.png", // 背景图片路径
    //         bgSize: [100, 50], // 背景图片尺寸
    //         displacement: [18, 9], // 汽包位置偏移
    //         bgScale: 0.7, // 缩放比例
    //         bgOpacity: 0.9, // 透明度
    //         font: "10px Arial",
    //         showBackground: false,
    //       },
    //     },
    //     data: {
    //       popupType: "car",
    //       title: `可疑车辆`,
    //       description: `距离中心 0 公里`,
    //       distance: 0,
    //       cardId: `123456789`,
    //       type: "高栏货车",
    //       状态: "行驶中",
    //       shipName: `浙J35470`,
    //       vehicleType: "高栏货车",
    //       status: "driving",
    //       tag: "涉私车辆",
    //       riskLevel: "high",
    //       lastUpdate: new Date().toLocaleString(),
    //     },
    //   });
    // });

    // 生成随机坐标点（50公里内） 船舶动态
    const shipDynamicCoords = generateRandomCoordinates(
        29.22087519433525,
        122.23688904613172,
        30,
        6
    );
    const shipList = shipDynamicCoords.map((coord, index) => ({
        coordinates: [coord.lng, coord.lat],
        options: {
            id: `random-ship-dynamic-${index}`,
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
                    showBackground: false,
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
        onProgress: (progress) => {
            console.log("进度:", progress);
        },
    });
    // 虚拟化添加
    // mapMarkersConfig.addMarkersVirtualized(shipList, {
    //   onViewportChange: (progress) => {
    //     console.log("进度:", progress);
    //   },
    // });
    // 单个添加
    // shipDynamicCoords.forEach((coord, index) => {
    //   mapMarkersConfig.addMarker(
    //     [coord.lng, coord.lat],
    //     {
    //       id: `random-ship-dynamic-${index}`,
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
            [121.4582, 29.3395],
            [121.4033, 29.3658],
            [121.3593, 29.4089],
            [121.2893, 29.4077],
            [121.2138, 29.4208],
        ],
        [
            [121.4582, 29.3395],
            [121.3854, 29.3359],
            [121.2879, 29.3526],
            [121.2206, 29.3155],
        ],
        [
            [121.4582, 29.3395],
            [121.4239, 29.276],
            [121.336, 29.2988],
            [121.2302, 29.2257],
        ],
    ];

    trackLines.forEach((line) => {
        // 生成轨迹路线
        mapMarkersConfig.generateTrackRoute(line, {
            showStartEnd: false,
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

    const overlays = mapMarkersConfig.createMultipleMarkers([
        [121.9251, 29.2748],
    ]);

    setTimeout(() => {
        mapMarkersConfig.clearOverlaysByType();
    }, 5000);
    window.closeWarnMarker = function (e) {
        e.stopPropagation();
        e.target.parentElement.parentElement.style.display = "none";
    };
    window.disPlayWarnDetail = function (e) {
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

    // 添加带文本的标记点
    // const locationMarker = addMarker([120.31783498535157, 30.37189672436138], {
    //   id: "location-marker",
    //   type: "location",
    //   style: {
    //     color: "#00ffff",
    //     radius: 6,
    //     text: {
    //       content: "白岩码头",
    //       color: "#ffffff",
    //       offsetY: -20,
    //     },
    //   },
    //   });
};
