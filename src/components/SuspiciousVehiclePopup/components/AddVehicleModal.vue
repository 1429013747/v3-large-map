<template>
  <a-modal
    :open="open"
    title="新增可疑车辆"
    :width="700"
    :centered="true"
    :mask-closable="false"
    getContainer=".ui-container"
    @ok="handleSubmit"
    @cancel="handleCancel"
    class="modal-container"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :label-col="{ span: 7 }"
      :wrapper-col="{ span: 17 }"
      :rules="formRules"
    >
      <Row :gutter="16">
        <Col :span="12">
          <a-form-item label="车牌号" name="plateNumber" required>
            <a-input
              v-model:value="formData.plateNumber"
              placeholder="请输入车牌号"
            />
          </a-form-item>
        </Col>
        <Col :span="12">
          <a-form-item label="车牌颜色" name="color" required>
            <a-select
              v-model:value="formData.color"
              placeholder="请选择车牌颜色"
            >
              <a-select-option value="blue">蓝色</a-select-option>
              <a-select-option value="yellow">黄色</a-select-option>
              <a-select-option value="green">绿色</a-select-option>
              <a-select-option value="white">白色</a-select-option>
              <a-select-option value="black">黑色</a-select-option>
            </a-select>
          </a-form-item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <a-form-item label="车辆类型" name="vehicleType" required>
            <a-select
              v-model:value="formData.vehicleType"
              placeholder="请选择车辆类型"
            >
              <a-select-option value="truck">货车</a-select-option>
              <a-select-option value="van">面包车</a-select-option>
              <a-select-option value="car">轿车</a-select-option>
              <a-select-option value="bus">客车</a-select-option>
              <a-select-option value="motorcycle">摩托车</a-select-option>
            </a-select>
          </a-form-item>
        </Col>
        <Col :span="12">
          <a-form-item label="车主" name="owner">
            <a-input
              v-model:value="formData.owner"
              placeholder="请输入车主姓名"
            />
          </a-form-item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <a-form-item label="车辆照片">
            <a-upload
              v-model:file-list="formData.photos"
              list-type="picture-card"
              :max-count="3"
              :before-upload="beforeUpload"
              @preview="handlePreview"
            >
              <template #previewIcon> </template>
              <div v-if="formData.photos.length < 3">
                <PlusOutlined />
                <div style="margin-top: 8px">上传照片</div>
              </div>
            </a-upload>
          </a-form-item>
        </Col>
      </Row>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { message, Row, Col } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:open", "submit"]);

// 表单引用
const formRef = ref(null);

// 表单数据
const formData = reactive({
  plateNumber: "",
  color: null,
  vehicleType: null,
  owner: "",
  photos: [],
});

// 表单验证规则
const formRules = {
  plateNumber: [
    { required: true, message: "请输入车牌号", trigger: "blur" },
    {
      // 例子：浙J55566
      pattern:
        /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/,
      message: "请输入正确的车牌号格式",
      trigger: "blur",
    },
  ],
  color: [{ required: true, message: "请选择车牌颜色", trigger: "change" }],
  vehicleType: [
    { required: true, message: "请选择车辆类型", trigger: "change" },
  ],
};

// 监听 open 变化，重置表单
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      resetForm();
    }
  }
);

// 重置表单
const resetForm = () => {
  formData.plateNumber = "";
  formData.color = null;
  formData.vehicleType = null;
  formData.owner = "";
  formData.photos = [];
  formRef.value?.resetFields();
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();

    // 触发提交事件
    emit("submit", { ...formData });

    // 关闭弹窗
    emit("update:open", false);
  } catch (error) {
    console.log("表单验证失败:", error);
  }
};

// 取消表单
const handleCancel = () => {
  emit("update:open", false);
};

// 文件上传前的处理
const beforeUpload = (file) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    message.error("只能上传图片文件!");
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("图片大小不能超过 2MB!");
    return false;
  }
  return false; // 阻止自动上传
};

// 图片预览
const handlePreview = (file) => {
  console.log("预览图片:", file);
  // 这里可以添加图片预览逻辑
};
</script>

<style lang="scss" scoped>
.modal-container {
  .ant-input {
    background-color: rgba(18, 28, 43, 0.8);
    color: #ffffff;
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 4px;
    height: 32px;
    &:focus {
      border-color: none;
    }
    &::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  .ant-upload div {
    color: #ffffff;
  }

  .anticon-plus {
    color: #ffffff;
  }
  .ant-upload-list-item-actions {
    .ant-upload-list-item-actions-delete {
      color: #ffffff;
    }
  }
}
</style>
