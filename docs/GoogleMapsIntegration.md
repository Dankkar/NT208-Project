# Google Maps Integration Documentation

## Tổng quan
Dự án đã được tích hợp Google Maps API để:
1. **Geocoding**: Tự động lấy tọa độ (latitude, longitude) từ địa chỉ khi thêm/chỉnh sửa khách sạn
2. **Map Display**: Hiển thị bản đồ vị trí khách sạn trong trang chi tiết

## Cấu hình API Key

### 1. Thiết lập Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable các API sau:
   - **Geocoding API**: Để chuyển đổi địa chỉ thành tọa độ
   - **Maps JavaScript API**: Để hiển thị bản đồ trong iframe
   - **Maps Embed API**: Để embedding bản đồ

### 2. Tạo API Key
1. Vào **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Sao chép API key được tạo

### 3. Cấu hình bảo mật API Key
Để bảo mật, nên giới hạn API key:
- **Application restrictions**: HTTP referrers
- **API restrictions**: Chỉ enable các API cần thiết
- Thêm domain của bạn vào danh sách allowed referrers

### 4. Cấu hình trong dự án
Thêm API key vào file `.env` trong thư mục `frontend/`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Các component đã tạo

### 1. `GeocodingAddressInput.vue`
Component để nhập địa chỉ và tự động lấy tọa độ.

**Props:**
- `modelValue`: Địa chỉ hiện tại
- `coordinates`: Object chứa latitude, longitude
- `label`: Nhãn của input
- `required`: Bắt buộc hay không
- `disabled`: Vô hiệu hóa hay không
- `autoGeocode`: Tự động geocode khi gõ

**Events:**
- `update:modelValue`: Khi địa chỉ thay đổi
- `update:coordinates`: Khi tọa độ được cập nhật
- `geocoding-success`: Khi geocoding thành công
- `geocoding-error`: Khi có lỗi geocoding

**Sử dụng:**
```vue
<GeocodingAddressInput
  v-model="hotelData.DiaChi"
  v-model:coordinates="hotelCoordinates"
  label="Địa chỉ khách sạn"
  :required="true"
  @geocoding-success="onGeocodingSuccess"
  @geocoding-error="onGeocodingError"
/>
```

### 2. `GoogleMapDisplay.vue`
Component để hiển thị bản đồ từ tọa độ.

**Props:**
- `latitude`, `longitude`: Tọa độ
- `placeName`: Tên địa điểm
- `address`: Địa chỉ
- `height`: Chiều cao bản đồ
- `zoom`: Mức zoom
- `showCoordinates`: Hiển thị tọa độ
- `showDirectionsButton`: Hiển thị nút chỉ đường
- `showFullscreenButton`: Hiển thị nút toàn màn hình

**Sử dụng:**
```vue
<GoogleMapDisplay
  :latitude="hotel.Latitude"
  :longitude="hotel.Longitude"
  :place-name="hotel.TenKS"
  :address="hotel.DiaChi"
  :height="400"
  :zoom="15"
/>
```

## Cập nhật Database Schema

Database đã được cập nhật để lưu tọa độ:

```sql
ALTER TABLE KhachSan 
ADD Latitude DECIMAL(10, 8) NULL,
    Longitude DECIMAL(11, 8) NULL;
```

## Backend Changes

### Controller Updates
1. **createHotel**: Đã cập nhật để lưu Latitude, Longitude
2. **updateHotel**: Đã cập nhật để cập nhật tọa độ
3. **getHotelById**: Đã trả về Latitude, Longitude trong response

### Map Controller
File `mapController.js` đã có sẵn để:
- Geocoding từ backend (dự phòng)
- Tìm khách sạn gần đây dựa trên tọa độ

## Frontend Updates

### Forms đã cập nhật:
1. **AddHotelPage.vue**: Sử dụng `GeocodingAddressInput`
2. **EditHotelPage.vue**: Sử dụng `GeocodingAddressInput`

### Pages đã cập nhật:
1. **HotelDetails.vue**: Hiển thị bản đồ bằng `GoogleMapDisplay`

## Luồng hoạt động

### Thêm khách sạn mới:
1. Admin nhập địa chỉ trong form
2. Component `GeocodingAddressInput` gọi Geocoding API
3. Tọa độ được hiển thị và lưu vào state
4. Khi submit form, tọa độ được gửi cùng với dữ liệu khách sạn
5. Backend lưu vào database

### Hiển thị chi tiết khách sạn:
1. API `getHotelById` trả về thông tin khách sạn bao gồm tọa độ
2. Component `GoogleMapDisplay` sử dụng tọa độ để tạo embed URL
3. Bản đồ được hiển thị trong iframe
4. User có thể click "Chỉ đường" hoặc "Toàn màn hình"

## Xử lý lỗi

### Khi API Key chưa cấu hình:
- Component hiển thị thông báo warning
- Geocoding không hoạt động
- Bản đồ hiển thị placeholder

### Khi không có tọa độ:
- Hiển thị thông báo "Vị trí chưa được thiết lập"
- Không hiển thị bản đồ

### Khi geocoding thất bại:
- Hiển thị thông báo lỗi
- Cho phép thử lại
- Vẫn có thể submit form mà không có tọa độ

## Testing

### Kiểm tra Geocoding:
1. Nhập địa chỉ hợp lệ → Phải có tọa độ
2. Nhập địa chỉ không tồn tại → Hiển thị lỗi
3. API key sai → Hiển thị lỗi xác thực

### Kiểm tra Map Display:
1. Khách sạn có tọa độ → Hiển thị bản đồ
2. Khách sạn không có tọa độ → Hiển thị placeholder
3. Click "Chỉ đường" → Mở Google Maps directions
4. Click "Toàn màn hình" → Mở Google Maps

## Các tính năng có thể mở rộng

1. **Search by location**: Tìm khách sạn gần vị trí hiện tại
2. **Multiple locations**: Hiển thị nhiều khách sạn trên một bản đồ
3. **Route planning**: Lập kế hoạch di chuyển giữa các địa điểm
4. **Nearby attractions**: Hiển thị điểm tham quan gần khách sạn
5. **Traffic info**: Thông tin giao thông thời gian thực

## Troubleshooting

### Bản đồ không hiển thị:
1. Kiểm tra API key trong .env
2. Kiểm tra APIs đã được enable trong Google Cloud Console
3. Kiểm tra quota và billing
4. Kiểm tra domain restrictions

### Geocoding không hoạt động:
1. Kiểm tra console errors
2. Kiểm tra format địa chỉ
3. Kiểm tra API quotas
4. Thử với địa chỉ khác

### Performance issues:
1. Implement caching cho geocoding results
2. Sử dụng lazy loading cho bản đồ
3. Optimize API calls với debouncing 