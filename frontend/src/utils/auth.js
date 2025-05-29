// src/utils/auth.js
import { ref } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Đảm bảo bạn đã cài đặt: npm install jwt-decode

const TOKEN_STORAGE_KEY = 'user_auth_token'; // Key để lưu token trong localStorage

const isLoggedIn = ref(false);
const currentUserRole = ref(null); // Ref để lưu LoaiUser

// Hàm tiện ích để xử lý token (lưu, decode, set state)
function processToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    try {
      const decodedToken = jwtDecode(token);
      // Quan trọng: Thay 'LoaiUser' hoặc 'role' bằng tên trường thực tế trong payload JWT của bạn
      currentUserRole.value = decodedToken.LoaiUser || decodedToken.role || null;
      isLoggedIn.value = true;
    } catch (error) {
      console.error("Lỗi khi decode token:", error);
      clearAuthData(); // Xóa token không hợp lệ
    }
  } else {
    clearAuthData(); // Nếu không có token, đảm bảo trạng thái được dọn dẹp
  }
}

// Hàm dọn dẹp dữ liệu xác thực
function clearAuthData() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  isLoggedIn.value = false;
  currentUserRole.value = null;
}

// Hàm khởi tạo trạng thái xác thực khi ứng dụng tải
// Sẽ được gọi tự động bởi useAuth
function initializeAuth() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      // Kiểm tra xem token có trường 'exp' (expiration time) không và có còn hạn không
      const currentTime = Date.now() / 1000; // Thời gian hiện tại tính bằng giây
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        // Token đã hết hạn
        console.log("Token từ localStorage đã hết hạn.");
        clearAuthData();
      } else {
        // Token còn hạn, khôi phục trạng thái
        processToken(token); // Tái sử dụng processToken để set isLoggedIn và currentUserRole
      }
    } catch (error) {
      console.error("Lỗi khi parse token từ localStorage khi khởi tạo:", error);
      clearAuthData(); // Token không hợp lệ
    }
  }
}

export function useAuth() {
  if (!isLoggedIn.value && localStorage.getItem(TOKEN_STORAGE_KEY)) {
    // Chỉ gọi initializeAuth một lần khi composable được import và chưa đăng nhập
    // nhưng có token trong localStorage (ví dụ khi F5 trang)
    initializeAuth();
  }
  return {
    isLoggedIn,
    currentUserRole, // Export thêm currentUserRole
    login,
    logout,
    checkLogin
  };
}

//Gọi api đăng nhập
async function login(email, password) {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      Email: email,
      MatKhau: password
    }, { withCredentials: true }); // Giữ withCredentials nếu backend của bạn vẫn dùng session cookies bên cạnh việc trả token

    // Giả sử backend trả về token trong response.data.token
    // Thay 'response.data.token' nếu cấu trúc response của bạn khác
    const token = response.data?.token;

    if (token) {
      processToken(token); // Lưu token, decode và set trạng thái
      return { success: true };
    } else {
      // Nếu API login thành công (không lỗi) nhưng không trả về token
      // Điều này có thể xảy ra nếu bạn hoàn toàn dựa vào session cookie (HttpOnly)
      // Trong trường hợp này, client không thể lấy LoaiUser từ token.
      // LoaiUser BẮT BUỘC phải được cung cấp bởi API /api/users/me
      isLoggedIn.value = true; // Dựa vào việc request thành công
      currentUserRole.value = null; // Không có token để decode tại đây
      console.warn("Đăng nhập thành công qua session, nhưng API login không trả về token. Không thể lấy LoaiUser từ token ở client.");
      // Cố gắng gọi checkLogin ngay để xem /api/users/me có cung cấp LoaiUser không
      await checkLogin();
      return { success: true };
    }

  } catch (err) {
    clearAuthData(); // Xóa mọi dữ liệu xác thực nếu login thất bại
    return { success: false, message: err.response?.data?.message || 'Đăng nhập thất bại' };
  }
}

//Gọi api kiểm tra session/cookie và có thể lấy thông tin user
async function checkLogin() {
  try {
    const response = await axios.get('http://localhost:5000/api/users/me', { withCredentials: true });
    // Nếu request này thành công, nghĩa là session/cookie phía server là hợp lệ
    isLoggedIn.value = true;

    // Quan trọng: Kiểm tra xem response của /api/users/me có chứa LoaiUser không
    // Nếu có, ưu tiên dùng nó.
    if (response.data && (response.data.LoaiUser || response.data.role)) {
      currentUserRole.value = response.data.LoaiUser || response.data.role;
    } else {
      // Nếu /api/users/me không trả về LoaiUser, thử lại với token từ localStorage
      // (có thể token được set từ lần login trước hoặc từ initializeAuth)
      const tokenFromStorage = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (tokenFromStorage && !currentUserRole.value) { // Chỉ decode lại nếu role chưa có
        try {
          const decoded = jwtDecode(tokenFromStorage);
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp < currentTime) {
            clearAuthData(); // Token hết hạn
          } else {
            currentUserRole.value = decoded.LoaiUser || decoded.role || null;
          }
        } catch (e) {
          clearAuthData(); // Token không hợp lệ
        }
      } else if (!tokenFromStorage) {
        // Session hợp lệ, nhưng không có token client và /me không trả role
        // currentUserRole.value sẽ là null
        console.warn("/api/users/me thành công nhưng không trả về LoaiUser và không có token ở client.");
      }
    }
  } catch (err) {
    // Nếu /api/users/me thất bại (ví dụ 401), nghĩa là session/cookie không hợp lệ
    clearAuthData();
  }
}

//Gọi api đăng xuất
async function logout() {
  try {
    await axios.post('http://localhost:5000/api/auth/logout',
      {}, // Body rỗng nếu API không yêu cầu
      { withCredentials: true });
    // API logout thành công
  } catch (err) {
    console.error('Lỗi gọi API logout:', err);
    // Dù API logout có lỗi hay không, chúng ta vẫn nên dọn dẹp phía client
  } finally {
    clearAuthData(); // Luôn dọn dẹp trạng thái client sau khi cố gắng logout
  }
  return { success: true }; // Coi như logout ở client luôn thành công
}