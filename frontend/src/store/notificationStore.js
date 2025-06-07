// src/store/notificationStore.js
import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    // Chúng ta không lưu message hay type ở đây.
    // Store này chỉ đóng vai trò là một "event bus" để gọi đến component Toast.
    // Thay vào đó, chúng ta sẽ lưu một tham chiếu (ref) đến chính component Toast.
    toastComponentRef: null,
  }),
  actions: {
    /**
     * Được gọi từ component Toast để đăng ký chính nó với store.
     * @param {Object} ref - Tham chiếu đến instance của component Toast.
     */
    registerToastComponent(ref) {
      this.toastComponentRef = ref;
    },

    /**
     * Hiển thị một thông báo. Đây là hàm mà các component/store khác sẽ gọi.
     * @param {string} message - Nội dung thông báo.
     * @param {string} [type='info'] - Loại thông báo ('success', 'error', 'warning', 'info').
     * @param {number} [duration] - Thời gian hiển thị (ms). Nếu không có, sẽ dùng mặc định của Toast.
     */
    show(message, type = 'info', duration) {
      if (this.toastComponentRef) {
        this.toastComponentRef.show(message, type, duration);
      } else {
        console.error('Toast component has not been registered with the notification store.');
        // Fallback về alert nếu Toast chưa sẵn sàng
        alert(`[${type.toUpperCase()}] ${message}`);
      }
    },
  },
});