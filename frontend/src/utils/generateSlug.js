export function generateSlug(name, id) {
    return name
        .toLowerCase()
        .normalize('NFD') // Bỏ dấu tiếng Việt
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
        .replace(/[^a-z0-9\s-]/g, '-') // Ký tự không hợp lệ thành -
        .replace(/^-+|-+$/g, '') + '-' + id;
}