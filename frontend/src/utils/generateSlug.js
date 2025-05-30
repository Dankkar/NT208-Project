export function generateSlug(name, id) {
    if (!name || typeof name !== 'string') {
        return String(id); // Trả về ID nếu không có tên hoặc tên không phải chuỗi
    }

    const slug = name
        .toLowerCase() // 1. Chuyển thành chữ thường
        .normalize('NFD') // 2. Chuẩn hóa Unicode, tách dấu
        .replace(/[\u0300-\u036f]/g, '') // 3. Loại bỏ dấu thanh
        .replace(/[đĐ]/g, 'd') // 4. Thay thế chữ đ/Đ
        .replace(/[^a-z0-9\s-]/g, '') // 5. Loại bỏ ký tự đặc biệt (giữ lại chữ, số, khoảng trắng, gạch ngang)
        .trim() // 6. Xóa khoảng trắng đầu cuối (quan trọng)
        .replace(/\s+/g, '-') // 7. Thay thế một hoặc nhiều khoảng trắng bằng một dấu gạch ngang (QUAN TRỌNG)
        .replace(/-+/g, '-'); // 8. Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu

    // Nếu slug rỗng sau khi xử lý (ví dụ tên toàn ký tự đặc biệt), chỉ dùng ID
    if (!slug) {
        return String(id);
    }

    return slug + '-' + id; // 9. Thêm ID vào cuối
}