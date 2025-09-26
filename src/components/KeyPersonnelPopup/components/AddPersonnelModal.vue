<template>
  <a-modal
    :open="open"
    title="新增重点人员"
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
          <a-form-item label="姓名" name="name" required>
            <a-input v-model:value="formData.name" placeholder="请输入姓名" />
          </a-form-item>
        </Col>
        <Col :span="12">
          <a-form-item label="性别" name="gender" required>
            <a-select v-model:value="formData.gender" placeholder="请选择性别">
              <a-select-option value="男">男</a-select-option>
              <a-select-option value="女">女</a-select-option>
            </a-select>
          </a-form-item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <a-form-item label="证件类型" name="vehicleType" required>
            <a-select
              v-model:value="formData.vehicleType"
              placeholder="请选择证件类型"
            >
              <a-select-option value="身份证">身份证</a-select-option>
              <a-select-option value="护照">护照</a-select-option>
              <a-select-option value="驾驶证">驾驶证</a-select-option>
              <a-select-option value="其他">其他</a-select-option>
            </a-select>
          </a-form-item>
        </Col>
        <Col :span="12">
          <a-form-item label="证件号码" name="idCard">
            <a-input
              v-model:value="formData.idCard"
              placeholder="请输入证件号码"
            />
          </a-form-item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <a-form-item label="联系方式" name="phone">
            <a-input
              v-model:value="formData.phone"
              placeholder="请输入联系方式"
            />
          </a-form-item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="20">
          <a-form-item label="人员标签" name="status" :labelCol="{ span: 4 }">
            <a-checkable-tag
              v-for="(tag, index) in formData.tagsData"
              :key="tag"
              v-model:checked="formData.status[index]"
              @change="(checked) => handleChange(tag, checked)"
            >
              {{ tag }}
            </a-checkable-tag>
          </a-form-item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="20">
          <a-form-item label="人员照片" :labelCol="{ span: 4 }">
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
                <div style="margin-top: 8px">上传人员照片</div>
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
const emit = defineEmits(["update:open", "submit", "cancel"]);

// 表单引用
const formRef = ref(null);

// 表单数据
const formData = reactive({
  name: "",
  gender: null,
  vehicleType: null,
  phone: "",
  idCard: "",
  photos: [],
  status: [false, true, false, false],
  tagsData: ["前科人员", "非本地", "涉案人员", "失业人员"],
});
// const tagsData = reactive(["前科人员", "非本地", "涉案人员", "失业人员"]);
// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
  vehicleType: [
    { required: true, message: "请选择证件类型", trigger: "change" },
  ],
  idCard: [{ required: true, message: "请输入证件号码", trigger: "blur" }],
};

// 监听 visible 变化，重置表单
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
  formData.name = "";
  formData.gender = null;
  formData.vehicleType = null;
  formData.idCard = "";
  formData.phone = "";
  formData.status = [false, true, false, false];
  formRef.value?.resetFields();
};
const handleChange = (tag, checked) => {
  console.log(tag, checked);
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
  .ant-tag {
    color: #ffffff;
  }
}
</style>
