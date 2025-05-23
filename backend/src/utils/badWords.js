// Danh sách từ cấm (có thể mở rộng thêm)
const badWords = {
    vi: [
        'đụ', 'đéo', 'đít', 'đcm', 'đkm', 'đm', 'đcm', 'đkm',
        'lồn', 'cặc', 'địt', 'đụ', 'đéo', 'đít', 'đcm', 'đkm',
        'đm', 'đcm', 'đkm', 'lồn', 'cặc', 'địt', 'đụ', 'đéo',
        'đít', 'đcm', 'đkm', 'đm', 'đcm', 'đkm', 'lồn', 'cặc',
        'địt', 'đụ', 'đéo', 'đít', 'đcm', 'đkm', 'đm', 'đcm',
        'đkm', 'lồn', 'cặc', 'địt', 'đụ', 'đéo', 'đít', 'đcm',
        'đkm', 'đm', 'đcm', 'đkm', 'lồn', 'cặc', 'địt', 'vcl'
    ],
    en: [
        'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy', 'cock',
        'cunt', 'whore', 'slut', 'bastard', 'motherfucker', 'fucker',
        'dickhead', 'asshole', 'bullshit', 'fucking', 'shitty',
        'bitchy', 'asshole', 'dickhead', 'pussy', 'cock', 'cunt',
        'whore', 'slut', 'bastard', 'motherfucker', 'fucker'
    ]
};

// Hàm kiểm tra từ cấm
const containsBadWords = (text) => {
    if (!text) return false;
    
    // Chuyển text về chữ thường để so sánh
    const lowerText = text.toLowerCase();
    
    // Kiểm tra từ cấm tiếng Việt
    for (const word of badWords.vi) {
        if (lowerText.includes(word)) {
            return {
                contains: true,
                word: word,
                language: 'vi'
            };
        }
    }
    
    // Kiểm tra từ cấm tiếng Anh
    for (const word of badWords.en) {
        if (lowerText.includes(word)) {
            return {
                contains: true,
                word: word,
                language: 'en'
            };
        }
    }
    
    return {
        contains: false
    };
};

module.exports = {
    containsBadWords
}; 