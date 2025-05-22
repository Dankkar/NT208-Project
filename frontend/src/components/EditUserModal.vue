<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <h5 class="mb-3 text-center text-md-start">Chỉnh sửa {{ sectionLabel }}</h5>
      <form @submit.prevent="handleSave">
        <div v-if="section === 'personal'">
          <label class="form-label">Họ tên</label>
          <input v-model="formData.HoTen" class="form-control" />

          <label class="form-label mt-2">Giới tính</label>
          <select v-model="formData.GioiTinh" class="form-control">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          <label class="form-label mt-2">Ngày sinh</label>
          <input type="date" v-model="formData.NgaySinh" class="form-control" />
        </div>

        <div v-else-if="section === 'contact'">
          <label class="form-label">Email</label>
          <input v-model="formData.Email" class="form-control" />

          <label class="form-label mt-2">SĐT</label>
          <input v-model="formData.SDT" class="form-control" />
        </div>

        <div v-else-if="section === 'cccd'">
          <label class="form-label">CCCD</label>
          <input v-model="formData.CCCD" class="form-control" />
        </div>

        <div class="mt-4 d-flex flex-column flex-sm-row justify-content-end gap-2">
          <Button
            content="Hủy"
            :textColor="'#6c757d'"
            :colorHover="'#495057'"
            :fontSize="'14px'"
            :block="true"
            textAlign="center"
            @click="close"
          />
          <Button
            content="Lưu"
            :textColor="'#0d6efd'"
            :colorHover="'#0a58ca'"
            :fontSize="'14px'"
            :block="true"
            textAlign="center"
            @click="handleSave"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  user: Object,
  section: String
})
const emits = defineEmits(['close', 'save'])

const formData = reactive({ ...props.user })

watch(() => props.section, () => {
  Object.assign(formData, props.user)
})

const sectionLabel = {
  personal: 'Thông tin cá nhân',
  contact: 'Liên hệ',
  cccd: 'CCCD'
}[props.section]

function close() {
  emits('close')
}

function handleSave() {
  emits('save', { section: props.section, data: { ...formData } })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-box {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
}

/* Responsive button spacing */
@media (max-width: 576px) {
  .modal-box {
    padding: 16px;
  }

  .modal-box form > .d-flex > * {
    width: 100% !important;
  }
}
</style>
