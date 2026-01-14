import { generateRandomCoordinates } from "@/utils/coordinateGenerator.js";
import { getIconPath, getIconPathMarkIcons } from "@/utils/utilstools.js";
import { radarData, riskData } from "./riskData.js";

export function getMarkerData(mapMarkersConfig, useTypeLayer, heatmapConfig, warningDrawerVisible, initShowPanel, radarScanAnimation) {
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
          displacement: [12, -12],
          offset: [36 * (index % 10), 0], // 使用不同的精灵图位置
          borderSize: 25, // 外边框大小
          borderColor: "#ffa502", // 外边框颜色
          borderWidth: 2, // 外边框宽度
          showBorder: false // 初始隐藏边框
        }
      },
      data: {
        popupType: "risk-point",
        distance: coord.distance,
        shipName: `浙J${String(35470 + index).padStart(5, "0")}`,
        dept: "海关",
        principal: "张三",
        riskType: "high",
        lastUpdate: new Date().toLocaleString(),
        markerId: `risk-pointer-${index}`
      }
    }
  }));
  // 批量添加
  mapMarkersConfig.addMarkers(riskList, {
    useBatch: true,
    batchSize: 1000,
    // isEnableCluster: true,
    onProgress: (progress) => {
      console.log("进度:", progress);
    }
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
          showBorder: false // 初始隐藏边框
        },
        text: {
          content: "可疑车辆",
          color: "#000000",
          offsetX: 10,
          offsetY: -17,
          bgImage: new URL("../assets/imgs/qb.png", import.meta.url).href, // 背景图片路径
          bgSize: [100, 50], // 背景图片尺寸
          displacement: [18, 9], // 汽包位置偏移
          bgScale: 0.7, // 缩放比例
          bgOpacity: 0.9, // 透明度
          font: "10px Arial",
          showBackground: false
        }
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
        markerId: `car-${index}`
      }
    }
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
    }
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
          showBorder: false // 初始隐藏边框
        },
        text: {
          content: "华盛167",
          color: "#000000",
          offsetX: 10,
          offsetY: -17,
          bgImage: new URL("../assets/imgs/qb.png", import.meta.url).href, // 背景图片路径
          bgSize: [100, 50], // 背景图片尺寸
          displacement: [18, 9], // 汽包位置偏移
          bgScale: 0.7, // 缩放比例
          bgOpacity: 0.9, // 透明度
          font: "10px Arial",
          showBackground: true
        }
      },
      data: {
        popupType: "ship",
        title: `船舶动态`,
        description: `距离中心 0 公里`,
        distance: 0,
        cardId: `123456789`
      }
    }
  }));
  // 批量添加
  mapMarkersConfig.addMarkers(shipList, {
    useBatch: true,
    batchSize: 1000,
    // isEnableCluster: true,
    onProgress: (progress) => {
      console.log("进度:", progress);
    }
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
  //           bgImage: "../assets/imgs/qb.png", // 背景图片路径
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
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.4033, 29.3658],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.3593, 29.4089],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.2893, 29.4077],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.2138, 29.4208],
        text: "2025.06.15 01:18"
      }
    ],
    [
      {
        latLon: [121.4582, 29.3395],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.3854, 29.3359],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.2879, 29.3526],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.2206, 29.3155],
        text: "2025.06.15 01:18"
      }
    ],
    [
      {
        latLon: [121.4582, 29.3395],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.4239, 29.276],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.336, 29.2988],
        text: "2025.06.15 01:18"
      },
      {
        latLon: [121.2302, 29.2257],
        text: "2025.06.15 01:18"
      }
    ]
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
        lineJoin: "round"
      }
    });
  });
  // 绘制预警牌
  const overlays = mapMarkersConfig.createMultipleMarkers([
    [121.9251, 29.2748],
    [121.7960, 29.0541],
    [122.0364, 29.0205],
    [122.2039, 29.4125]
  ]);

  setTimeout(() => {
    mapMarkersConfig.clearOverlaysByType();
  }, 5000);
  window.closeWarnMarker = function (e) {
    e.stopPropagation();
    e.target.parentElement.parentElement.style.display = "none";
  };
  window.disPlayWarnDetail = function (e) {
    initShowPanel();
    warningDrawerVisible.value = true;
  };

  const radarList = radarData.map(coord => ({
    coordinates: [coord.longitude, coord.latitude],
    options: {
      id: `optical-radar-${coord.id}`,
      type: 'optical-radar',
      useTypeLayer: useTypeLayer.value,
      visible: true, // 初始隐藏
      style: {
        icon: {
          src: getIconPathMarkIcons('radar'),
          size: [48, 68],
          anchor: [0.5, 0.5],
          scale: 0.5,
          displacement: [0, 0],
          borderSize: 25, // 外边框大小
          borderColor: '#ffa502', // 外边框颜色
          borderWidth: 2, // 外边框宽度
          showBorder: false, // 初始隐藏边框
          isRadar: true
        },
        text: {
          popupType: 'optical-radar',
          content: coord.name,
          color: '#000000',
          offsetX: 10,
          offsetY: -17,
          // bgImage: '/src/assets/imgs/qb.png', // 背景图片路径
          bgSize: [100, 50], // 背景图片尺寸
          displacement: [18, 9], // 汽包位置偏移
          bgScale: 0.7, // 缩放比例
          bgOpacity: 0.9, // 透明度
          font: '10px Arial',
          showBackground: false
        }
      },
      data: {
        popupType: 'optical-radar',
        title: '雷达站',
        originData: coord
      }
    }
  }));
  mapMarkersConfig.addMarkers(radarList);

  // 添加雷达扫描动画
  if (radarScanAnimation) {
    const radarAnimationList = radarData.map((coord, index) => ({
      id: `optical-radar-${index}`,
      coordinates: [coord.longitude, coord.latitude],
      options: {
        radius: 2000, // 扫描半径（米），默认 2km
        color: '#00ffcc', // 扫描颜色
        scanSpeed: 2500, // 扫描一圈的时间（毫秒）
        fadeLength: 0.35, // 扫描尾迹长度
        hoverRadiusAdd: 500, // hover 时半径增加（米）
        solidRipple: true, // 实心涟漪
        rippleDuration: 2000, // 涟漪周期（毫秒）
        rippleCount: 3, // 涟漪数量
        visible: false // 初始隐藏，跟随 marker 显示
      }
    }));
    console.log("🚀 ~ getMarkerData ~ radarAnimationList:", radarAnimationList)
    radarScanAnimation.addRadarAnimations(radarAnimationList);
    radarScanAnimation.toggleAllRadarVisibility(true);
  }
  // 创建多边形
  mapMarkersConfig.drawFilledPolygon(
    [
      [122.1558, 29.4244],
      [122.2012, 29.3227],
      [122.2685, 29.3227],
      [122.2863, 29.4244],
      [122.219, 29.4758]
    ],
    { fillColor: "#c18a7e80", strokeColor: "#fe383790", strokeWidth: 1 }
  );

  // 风险热力点
  heatmapConfig.createLayer("risk-hot", {
    title: "风险热力图",
    visible: false,
    zIndex: 1500,
    radius: 10,
    blur: 20,
    gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    data: riskData
  });

  // 综合案件热力点
  heatmapConfig.createLayer("case-hot", {
    title: "综合案件热力图",
    visible: false,
    zIndex: 1502,
    radius: 20,
    blur: 20,
    gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    data: [
      { lon: 121.62, lat: 29.07, weight: 0.1 },
      { lon: 121.65, lat: 29.09, weight: 0.9 },
      { lon: 121.61, lat: 29.07, weight: 0.7 },
      { lon: 121.69, lat: 29.00, weight: 0.9 },
      { lon: 121.6314, lat: 29.1386, weight: 0.8 }
    ]
  });

  // 涉冻品案件热力点
  heatmapConfig.createLayer("ice-hot", {
    title: "涉冻品案件热力图",
    visible: false,
    zIndex: 1503,
    radius: 10,
    blur: 20,
    gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    data: [
      { lon: 121.12, lat: 28.27, weight: 0.1 },
      { lon: 121.15, lat: 28.29, weight: 0.9 },
      { lon: 121.11, lat: 28.27, weight: 0.7 },
      { lon: 121.19, lat: 28.30, weight: 0.9 },
      { lon: 121.3314, lat: 29.1386, weight: 0.8 }
    ]
  });

  // 涉成品油案件热力点
  heatmapConfig.createLayer("oil-hot", {
    title: "涉成品油案件热力图",
    visible: false,
    zIndex: 1504,
    radius: 10,
    blur: 20,
    gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    data: [
      { lon: 121.52, lat: 29.67, weight: 0.1 },
      { lon: 121.55, lat: 29.69, weight: 0.9 },
      { lon: 121.51, lat: 29.67, weight: 0.7 },
      { lon: 121.59, lat: 29.60, weight: 0.9 },
      { lon: 121.5314, lat: 29.1386, weight: 0.8 }
    ]
  });

  // 车辆运行热力图
  heatmapConfig.createLayer("vehicle-heatmap", {
    title: "车辆运行热力图",
    visible: false,
    zIndex: 1505,
    radius: 10,
    blur: 15,
    gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    data: [
      { lon: 121.72, lat: 29.17, weight: 0.3 },
      { lon: 121.75, lat: 29.19, weight: 0.8 },
      { lon: 121.71, lat: 29.17, weight: 0.6 },
      { lon: 121.79, lat: 29.20, weight: 0.9 },
      { lon: 121.7314, lat: 29.1386, weight: 0.7 }
    ]
  });

  // 船舶运行热力图
  heatmapConfig.createLayer("ship-heatmap", {
    title: "船舶运行热力图",
    visible: false,
    zIndex: 1506,
    radius: 10,
    blur: 18,
    gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    data: [
      { lon: 121.82, lat: 29.37, weight: 0.4 },
      { lon: 121.85, lat: 29.39, weight: 0.7 },
      { lon: 121.81, lat: 29.37, weight: 0.5 },
      { lon: 121.89, lat: 29.40, weight: 0.8 },
      { lon: 121.8314, lat: 29.1386, weight: 0.6 }
    ]
  });
}
