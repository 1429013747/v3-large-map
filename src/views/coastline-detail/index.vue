<template>
  <div class="container">
    <MapLayout :showMap="false" :enableScale="true" title="岸线管控详情">
      <template #default>
        <div class="main-container">
          <div class="left-container">
            <div class="headlines"><em>风险点信息</em></div>
            <div class="info-card">
              <div class="card-title">基本信息</div>
              <div class="card-content">
                <div class="info-item info-item-title">
                  <div>
                    白岩码头
                    <span :class="getRiskStyle(1)">低风险</span>
                  </div>
                </div>
                <div class="info-item">
                  <span> 责任单位: 测试单位</span>
                  <span> 负责人: 测试人员</span>
                </div>
                <div class="info-item">
                  <span> 位置: 测试位置</span>
                </div>
                <div class="info-item">
                  <span> 经纬度: 118°19.968E，38°。24N</span>
                </div>
              </div>
            </div>
            <div class="info-card">
              <div class="card-title">静态指标</div>
              <div class="card-content">
                <div class="info-item">
                  <span> <img :src="arrow" alt="" /> 风险点类型</span>
                </div>
                <div class="info-item">
                  <span> 正常码头 | 废弃码头</span>
                </div>
                <div class="info-item">
                  <span> <img :src="arrow" alt="" /> 周边环境</span>
                </div>
                <div class="info-item">
                  <span>附近有无居民社区或厂房</span>
                  <span>无</span>
                </div>
                <div class="info-item">
                  <span>距离</span>
                  <span>500米以内</span>
                </div>
                <div class="info-item">
                  <span>夜间是否有灯光</span>
                  <span>是</span>
                </div>
                <div class="info-item">
                  <span> <img :src="arrow" alt="" /> 交通条件</span>
                </div>
                <div class="info-item">
                  <span>附近有无居民社区或厂房</span>
                  <span>无</span>
                </div>
              </div>
            </div>
            <div class="info-card">
              <div class="card-title">动态指标</div>
              <div class="card-content">
                <span> <img :src="arrow" alt="" /> 历史走私案件</span>
                <div class="info-item">
                  <span>时间范围</span>
                  <span>1-3年内</span>
                </div>
                <span> <img :src="arrow" alt="" /> 防控措施</span>
                <div class="info-item">
                  <span>挿型感型智能限高杆</span>
                  <span>已配置</span>
                </div>
                <div class="info-item">
                  <span>结构化视频监控设备</span>
                  <span>已配置</span>
                </div>
                <div class="info-item">
                  <span>无人机空中巡航</span>
                  <span>已配置</span>
                </div>
                <div class="info-item">
                  <span>派出所出警时长 </span>
                  <span>5分钟以内</span>
                </div>
                <div class="info-item">
                  <span>日常防控措施落实情况</span>
                  <span>已部分落实</span>
                </div>
              </div>
            </div>
          </div>
          <div class="center-container">
            <div class="swiper">
              <a-carousel autoplay>
                <div>
                  <img
                    src="https://tse2-mm.cn.bing.net/th/id/OIP-C.M_QGxTduyJtEBzOIqJafDgHaE7?w=282&h=187&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3"
                    alt=""
                  />
                </div>
                <div>
                  <img
                    src="https://tse2-mm.cn.bing.net/th/id/OIP-C.M_QGxTduyJtEBzOIqJafDgHaE7?w=282&h=187&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3"
                    alt=""
                  />
                </div>
              </a-carousel>
            </div>
            <div class="chart">
              <div class="left-chart">
                <div class="headlines">
                  <em>风险等级调整</em>
                </div>
                <LevelChart />
              </div>
              <div class="right-chart">
                <div class="headlines"><em>风险点预警趋势</em></div>
                <div class="category-tabs">
                  <a-button
                    :type="activeCategory === '1' ? 'primary' : 'default'"
                    size="small"
                    @click="handleCategoryChange('1')"
                    class="category-tab"
                  >
                    今日
                  </a-button>
                  <a-button
                    :type="activeCategory === '2' ? 'primary' : 'default'"
                    size="small"
                    @click="handleCategoryChange('2')"
                    class="category-tab"
                  >
                    本周
                  </a-button>
                  <a-button
                    :type="activeCategory === '3' ? 'primary' : 'default'"
                    size="small"
                    @click="handleCategoryChange('3')"
                    class="category-tab"
                  >
                    本月
                  </a-button>
                </div>
                <WarningChart :chartData="warningChartData" />
              </div>
            </div>
          </div>
          <div class="right-container">
            <div class="headlines"><em>一点一策</em></div>
            <div class="info-card">
              <div class="card-content">
                <div class="info-item info-item-table-header">
                  <span>信息</span>
                  <span>完成情况</span>
                </div>
                <div class="info-item-table-body">
                  <div
                    class="info-item"
                    v-for="(coastline, index) in tableData"
                    :key="index"
                  >
                    <span>{{ coastline.riskName }}</span>
                    <span
                      :class="getRiskStatus(coastline.riskStatus) + ' status'"
                      >{{ coastline.riskStatusName }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <div class="headlines"><em>物联设备感知</em></div>
            <div class="info-card">
              <div class="card-content">
                <div
                  class="info-item device"
                  v-for="(device, index) in deviceData"
                  :key="index"
                >
                  <div class="info-item-device">
                    <div class="title-btn">
                      <div class="title">
                        <img :src="getNodeIcon(device.type)" alt="" />
                        {{ device.name }}
                      </div>
                      <div class="btn">
                        <a-button
                          type="primary"
                          ghost
                          size="small"
                          class="action-button"
                          @click="handleDeviceAction(device)"
                        >
                          远程控制
                        </a-button>
                      </div>
                    </div>
                    <div class="type-address">
                      <div class="type">{{ getNodeTile(device.type) }}</div>
                      <div class="address">位置：白岩码头</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="headlines"><em>人防制度</em></div>
            <div class="info-card">
              <div class="card-content">
                <div class="info-item">王某某 18888888888</div>
                <div class="info-item">
                  <span>人防制度：码长、段长、网格"三长制"</span>
                  <span class="btn" @click="handlecivilDefense(1)">查询</span>
                </div>
                <div class="info-item">
                  <span>现场巡查：每日</span>
                  <span class="btn" @click="handlecivilDefense(2)"
                    >巡查记录</span
                  >
                </div>
                <div class="info-item">
                  <span>宣传教育：季度</span>
                  <span class="btn" @click="handlecivilDefense(3)"
                    >宣传记录</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </MapLayout>
  </div>
</template>

<script setup>
import online from "~/imgs/online.png";
import offline from "~/imgs/offline.png";
import callThePolice from "~/imgs/call-the-police.png";
import arrow from "~/imgs/detail-arrow.png";
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import LevelChart from "@/components/CoastlinePopup/components/LevelChart.vue";
import WarningChart from "@/components/CoastlinePopup/components/WarningChart.vue";
const coastlineData = ref({ riskName: "示例风险点" });
const deviceData = ref([
  {
    id: "1",
    name: "0838_白岩码头_雷达",
    type: "1",
    status: "online",
    level: "1",
    address: "白岩码头",
  },
  {
    id: "2",
    name: "0838_白岩码头_摄像头",
    type: "2",
    status: "offline",
    level: "1",
    address: "白岩码头",
  },
  {
    id: "3",
    name: "0838_白岩码头_警报器",
    type: "3",
    status: "online",
    level: "1",
    address: "白岩码头",
  },
]);
const tableData = ref([
  {
    id: "1",
    name: "示例",
    type: "1",
    status: "0",
    level: "1",
    riskName: "部署智能限高杆",
    riskLevel: "1",
    riskType: "1",
    riskStatus: "1",
    riskLevelName: "一级",
    riskTypeName: "一级",
    riskStatusName: "已完成",
  },
  {
    id: "2",
    name: "示例",
    type: "1",
    status: "1",
    level: "1",
    riskName: "部署视频感知设备3个",
    riskLevel: "1",
    riskType: "1",
    riskStatus: "2",
    riskLevelName: "一级",
    riskTypeName: "一级",
    riskStatusName: "进行中",
  },
  {
    id: "3",
    name: "示例",
    type: "1",
    status: "3",
    level: "1",
    riskName: "部署视频感知设备10个",
    riskLevel: "1",
    riskType: "1",
    riskStatus: "3",
    riskLevelName: "一级",
    riskTypeName: "一级",
    riskStatusName: "未完成",
  },
  {
    id: "3",
    name: "示例",
    type: "1",
    status: "3",
    level: "1",
    riskName: "部署视频感知设备10个",
    riskLevel: "1",
    riskType: "1",
    riskStatus: "3",
    riskLevelName: "一级",
    riskTypeName: "一级",
    riskStatusName: "未完成",
  },
  {
    id: "3",
    name: "示例",
    type: "1",
    status: "3",
    level: "1",
    riskName: "部署视频感知设备10个",
    riskLevel: "1",
    riskType: "1",
    riskStatus: "3",
    riskLevelName: "一级",
    riskTypeName: "一级",
    riskStatusName: "未完成",
  },
]);
const activeCategory = ref("1");
const warningChartData = ref({
  dates: [
    "1:45:04",
    "2:45:04",
    "3:45:04",
    "4:45:04",
    "5:45:04",
    "6:45:04",
    "7:45:04",
  ],
  levels: [10, 2, 3, 1, 2, 3, 2], // 1:低风险, 2:中风险, 3:高风险
});
const handleCategoryChange = (category) => {
  activeCategory.value = category;
  switch (category) {
    case "1":
      warningChartData.value = {
        dates: [
          "1:45:04",
          "2:45:04",
          "3:45:04",
          "4:45:04",
          "5:45:04",
          "6:45:04",
          "7:45:04",
        ],
        levels: [1, 2, 3, 1, 2, 3, 2],
      };
      break;
    case "2":
      warningChartData.value = {
        dates: [
          "1:45:04",
          "2:45:04",
          "3:45:04",
          "4:45:04",
          "5:45:04",
          "6:45:04",
          "7:45:04",
        ],
        levels: [10, 20, 30, 10, 20, 30, 40],
      };
      break;
    case "3":
      warningChartData.value = {
        dates: [
          "1:45:04",
          "2:45:04",
          "3:45:04",
          "4:45:04",
          "5:45:04",
          "6:45:04",
          "7:45:04",
        ],
        levels: [100, 200, 300, 100, 200, 300, 200],
      };
      break;
    default:
      break;
  }
};
// 人防制度按钮触发
const handlecivilDefense = (device) => {
  switch (device) {
    case 1:
      message.info("查询人防制度");
      break;
    case 2:
      message.info("查看巡查记录");
      break;
    case 3:
      message.info("查看宣传记录");
      break;
    default:
      break;
  }
};
// 设备操作
const getRiskStatus = (status) => {
  switch (status) {
    case "1":
      return "normal";
    case "2":
      return "warning";
    case "3":
      return "danger";
    default:
      return "normal";
  }
};

// 获取设备图标
const getNodeIcon = (type) => {
  switch (type) {
    case "1":
      return online;
    case "2":
      return offline;
    case "3":
      return callThePolice;
    default:
      return online;
  }
};
// 获取设备类型
const getNodeTile = (type) => {
  switch (type) {
    case "1":
      return "雷达";
    case "2":
      return "摄像头";
    case "3":
      return "警报器";
    default:
      return "未知设备";
  }
};
// 设备操作
const handleDeviceAction = (device) => {
  switch (device.type) {
    case "1":
      // 触发雷达
      message.info("触发雷达");
      break;
    case "2":
      // 触发摄像头
      message.info("触发摄像头");
      break;
    case "3":
      // 触发报警器
      message.info("触发报警器");
      break;
    default:
      break;
  }
};

// 风险等级样式
const getRiskStyle = (status) => {
  switch (status) {
    case 1:
      return "key-badge1";
    case 2:
      return "key-badge2";
    case 3:
      return "key-badge3";
    default:
      return "key-badge1";
  }
};
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  .main-container {
    width: 100%;
    height: 100%;
    padding: 20px;
    display: flex;
    > div {
      flex: 1;
      height: 100%;
    }
    .left-container {
      // background: #fff;
      // color: #000;
    }
    .center-container {
      // flex: 2;
      width: 1000px;
      // background: #f5f5f5;
      .swiper {
        width: 100%;
        height: 50%;
        background: url("~/imgs/detail-swiper-bg.png");
        background-size: 100% 100%;
        overflow: hidden;
        // padding: 20px 15px;
      }
      .chart {
        display: flex;
        height: 50%;
        align-items: center;
        > div {
          flex: 1;
          height: 100%;
          padding: 10px;
          // border: 1px solid red;
        }
      }
    }
    .right-container {
      // background: #fff;
    }
  }
}
.headlines {
  background: url("~/imgs/title_bg.png");
  background-size: 100% 100%;
  padding: 10px 0;
  padding-left: 30px;
  font-family: YouSheBiaoTiHei, YouSheBiaoTiHei;
  font-weight: 400;
  color: #e4f2ff;
  line-height: 12px;
  letter-spacing: 1px;
  text-shadow: 0px 2px 2px rgba(0, 0, 0, 0.25);
  text-align: left;
  font-style: normal;
  text-transform: none;
}
.info-card {
  padding: 10px;
  overflow: auto;
  .card-title {
    background: linear-gradient(
      90deg,
      rgba(104, 107, 107, 0) 0%,
      rgb(0, 125, 148, 0.3) 31%,
      rgba(104, 107, 107, 0) 100%
    );
    font-family: PingFang SC, PingFang SC;
    font-weight: 400;
    font-size: 16px;
    color: #ffffff;
    letter-spacing: 2px;
    text-stroke: 0px #ffffff;
    text-align: left;
    font-style: normal;
    text-transform: none;
    -webkit-text-stroke: 0px #ffffff;
    // opacity: 0.16;
    padding: 5px 0;
  }
  .card-content {
    padding: 10px;
    height: 260px;
    // border: 1px solid #eee;
    overflow: auto;
    // border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .info-item {
    padding: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    align-items: center;
    cursor: pointer;
    span {
      font-size: 14px;
    }
    .btn {
      color: #00ffff;
    }
  }
  .device {
    padding: 0;
    font-size: 14px;
    margin-bottom: 8px;
    .info-item-device {
      width: 100%;
      background: rgba(110, 119, 138, 0.1);
      box-shadow: 1px 4px 6px 0px rgba(0, 0, 0, 0.05);
      border-radius: 3px;
      padding: 10px;
      // border: 1px solid;
      &:hover {
        background: rgba(0, 255, 255, 0.1);
        border-color: #00ffff;
        color: #ffffff;
      }

      &:focus {
        background: rgba(0, 255, 255, 0.1);
        border-color: #00ffff;
        color: #ffffff;
      }
      > div {
        padding: 5px 0;
      }
      .title-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .title {
          img {
            margin-right: 10px;
          }
        }
        .action-button {
          background: transparent;
          border: 1px solid rgba(0, 255, 255, 0.5);
          color: #00ffff;
          border-radius: 4px;
          height: 28px;
          padding: 0 16px;
          font-size: 14px;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(0, 255, 255, 0.1);
            border-color: #00ffff;
            color: #ffffff;
          }

          &:focus {
            background: rgba(0, 255, 255, 0.1);
            border-color: #00ffff;
            color: #ffffff;
          }
        }
      }
      .type-address {
        display: flex;
        // justify-content: space-between;
        align-items: center;
        .address {
          margin-left: 50px;
        }
      }
    }
  }
  .info-item-title {
    padding: 20px 0;
    font-size: 18px;
  }
  .info-item-table-header {
    height: 30px;
    color: #888;
  }
  .info-item-table-body {
    height: calc(100% - 30px);
    overflow: auto;
  }
}
:deep(.ant-carousel) {
  width: 100%;
  height: 100%;
  padding: 20px 30px 40px;

  div {
    border-radius: 10px;
    height: 100%;
    overflow: hidden;
    img {
      height: 100%;
      width: 100%;
    }
  }
}

.category-tabs {
  display: flex;
  gap: 0px;
  padding: 10px 0;
  display: flex;
  justify-content: flex-end;

  .category-tab {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.17);
    color: #ffffff;
    padding: 0 14px;
    height: 28px;
    border: none;
    font-size: 14px;
    box-shadow: inset 0 0 2px 1px #0d3e4f;

    &:hover {
      background: #153e4b;
      border-color: rgba(255, 255, 255, 0.17);
    }

    &.ant-btn-primary {
      border: none;
      box-shadow: inset 0 0 5px 5px #104b5f;
      color: #fff;

      &:hover {
        background: #153e4b;
        border-color: none;
        box-shadow: inset 0 0 5px 5px #104b5f;
      }
    }
  }
}
.status {
  border-radius: 3px;
  padding: 5px 15px;
  color: #fff;
}
.normal {
  // color: #4caf50;
  background: linear-gradient(180deg, #4caf50 0%, rgba(62, 41, 0, 0) 100%);
}
.warning {
  background: linear-gradient(180deg, #f9be47 0%, rgba(62, 41, 0, 0) 100%);
}
.danger {
  background: linear-gradient(180deg, #f44336 0%, rgba(62, 41, 0, 0) 100%);
}
.key-badge1 {
  background: #006e69;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}
.key-badge2 {
  background: #ffa502;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}
.key-badge3 {
  background: #b4261e;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
