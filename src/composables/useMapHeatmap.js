import { ref, computed } from "vue";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Heatmap from "ol/layer/Heatmap";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";

/**
 * 热力图 Hook（OpenLayers）
 * 依赖：传入现有的 map 实例（来自 useMap.getMap() 或 MapViewer 暴露的 map）
 *
 * 基本约定：
 * - 数据输入格式：[{ lon: number, lat: number, weight?: number }, ...]
 * - 或 GeoJSON FeatureCollection（Point）
 */
export function useMapHeatmap(mapInstance) {
    const mapRef = ref(mapInstance || null);
    const sourceRef = ref(null);
    const heatmapLayerRef = ref(null);
    const layerTitleRef = ref("热力图");

    const isReady = computed(() => !!mapRef.value && !!heatmapLayerRef.value);

    const ensureLayer = (options = {}) => {
        if (!mapRef.value) return;
        if (heatmapLayerRef.value) return;

        const {
            title = "热力图",
            type = "heatmap",
            visible = false,
            zIndex = 1000,
            blur = 15,
            radius = 8,
            gradient = undefined,
        } = options;

        layerTitleRef.value = title;
        sourceRef.value = new VectorSource();
        heatmapLayerRef.value = new Heatmap({
            source: sourceRef.value,
            visible,
            blur,
            radius,
            gradient,
        });
        heatmapLayerRef.value.set("title", title);
        heatmapLayerRef.value.set("type", type);
        heatmapLayerRef.value.setZIndex(zIndex);
        mapRef.value.addLayer(heatmapLayerRef.value);
    };

    const removeLayer = () => {
        if (!mapRef.value || !heatmapLayerRef.value) return;
        mapRef.value.removeLayer(heatmapLayerRef.value);
        heatmapLayerRef.value = null;
        sourceRef.value = null;
    };
    /**
     * 热力图显示/隐藏
     * @param {Boolean} visible 
     * @returns 
     */
    const setVisible = (visible) => {
        if (!heatmapLayerRef.value) return;
        heatmapLayerRef.value.setVisible(visible);
    };

    /**
     * 设置范围半径
     * @param {Number} radius 
     * @returns 
     */
    const setRadius = (radius) => {
        if (!heatmapLayerRef.value) return;
        heatmapLayerRef.value.setRadius(radius);
    };
    /**
     * 设置范围模糊程度
     * @param {Number} radius 
     * @returns 
     */
    const setBlur = (blur) => {
        if (!heatmapLayerRef.value) return;
        heatmapLayerRef.value.setBlur(blur);
    };
    /**
     * 设置范围径向渐变
     * @param {Number} radius 
     * @returns 
     */
    const setGradient = (gradient) => {
        if (!heatmapLayerRef.value) return;
        // gradient: string[] 颜色数组，如 ["#00f", "#0ff", "#0f0", "#ff0", "#f00"]
        heatmapLayerRef.value.setGradient(gradient);
    };
    /**
     * 清除所有热力图
     */
    const clear = () => {
        if (!sourceRef.value) return;
        sourceRef.value.clear();
    };

    /**
     * 设置数据（数组点集）
     * @param {Array<{lon:number, lat:number, weight?:number}>} points
     */
    const setData = (points = []) => {
        if (!sourceRef.value) return;
        const features = points.map((p) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([p.lon, p.lat])),
                weight: typeof p.weight === "number" ? p.weight : 1,
            });
            // OpenLayers Heatmap 默认读取 feature.get('weight')
            return feature;
        });
        sourceRef.value.clear();
        sourceRef.value.addFeatures(features);
    };

    /**
     * 设置 GeoJSON 数据（Point FeatureCollection）
     * @param {Object} geojson FeatureCollection
     * @param {Object} options { dataProjection?: string, featureProjection?: string, weightAttr?: string }
     */
    const setGeoJSON = (geojson, options = {}) => {
        if (!sourceRef.value || !geojson) return;
        const {
            dataProjection = "EPSG:4326",
            featureProjection = "EPSG:3857",
            weightAttr = "weight",
        } = options;
        const format = new GeoJSON();
        const features = format.readFeatures(geojson, {
            dataProjection,
            featureProjection,
        });
        // 归一化权重字段为 weight
        features.forEach((f) => {
            if (weightAttr !== "weight") {
                const w = f.get(weightAttr);
                if (typeof w === "number") f.set("weight", w);
            }
            if (typeof f.get("weight") !== "number") f.set("weight", 1);
        });
        sourceRef.value.clear();
        sourceRef.value.addFeatures(features);
    };

    /**
     * 初始化或获取图层
     */
    const init = (options = {}) => {
        ensureLayer(options);
        return heatmapLayerRef.value;
    };

    /**
     * 更新图层层级
     * @param {Number} zIndex
     */
    const setZIndex = (zIndex) => {
        if (!heatmapLayerRef.value) return;
        heatmapLayerRef.value.setZIndex(zIndex);
    };

    /**
     * 替换地图实例（例如地图重建时）
     */
    const setMap = (map) => {
        if (mapRef.value === map) return;
        // 移除旧图层
        if (mapRef.value && heatmapLayerRef.value) {
            mapRef.value.removeLayer(heatmapLayerRef.value);
        }
        mapRef.value = map;
        // 重新挂载
        if (mapRef.value && heatmapLayerRef.value) {
            mapRef.value.addLayer(heatmapLayerRef.value);
        }
    };

    /**
     * 销毁
     */
    const destroy = () => {
        removeLayer();
        mapRef.value = null;
    };

    return {
        // 状态
        isReady,
        layer: heatmapLayerRef,
        source: sourceRef,
        title: layerTitleRef,

        // 生命周期/挂载
        init,
        destroy,
        setMap,

        // 数据
        setData,
        setGeoJSON,
        clear,

        // 外观
        setVisible,
        setRadius,
        setBlur,
        setGradient,
        setZIndex,
    };
}


