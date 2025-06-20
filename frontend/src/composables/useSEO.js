import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

export function useSEO() {
  const route = useRoute()
  
  const seoData = ref({
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogUrl: '',
    canonicalUrl: '',
    structuredData: null
  })

  // Cập nhật document title
  const updateTitle = (title) => {
    const fullTitle = title ? `${title} | ChillChill Hotel` : 'ChillChill Hotel - Đặt Phòng Khách Sạn Trực Tuyến'
    document.title = fullTitle
    updateMetaTag('og:title', title || 'ChillChill Hotel - Đặt Phòng Khách Sạn Trực Tuyến')
  }

  // Cập nhật meta description
  const updateDescription = (description) => {
    updateMetaTag('description', description)
    updateMetaTag('og:description', description)
    updateMetaTag('twitter:description', description)
  }

  // Cập nhật meta keywords
  const updateKeywords = (keywords) => {
    updateMetaTag('keywords', keywords)
  }

  // Cập nhật Open Graph image
  const updateOGImage = (imageUrl) => {
    updateMetaTag('og:image', imageUrl)
    updateMetaTag('twitter:image', imageUrl)
  }

  // Cập nhật canonical URL
  const updateCanonicalUrl = (url) => {
    const canonicalLink = document.querySelector('link[rel="canonical"]')
    if (canonicalLink) {
      canonicalLink.href = url
    } else {
      const link = document.createElement('link')
      link.rel = 'canonical'
      link.href = url
      document.head.appendChild(link)
    }
    updateMetaTag('og:url', url)
  }

  // Helper function để cập nhật meta tags
  const updateMetaTag = (name, content) => {
    if (!content) return
    
    // Kiểm tra property hoặc name
    let selector = `meta[name="${name}"]`
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      selector = `meta[property="${name}"]`
    }
    
    let metaTag = document.querySelector(selector)
    
    if (metaTag) {
      metaTag.content = content
    } else {
      metaTag = document.createElement('meta')
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        metaTag.property = name
      } else {
        metaTag.name = name
      }
      metaTag.content = content
      document.head.appendChild(metaTag)
    }
  }

  // Thêm structured data
  const updateStructuredData = (data) => {
    // Xóa structured data cũ
    const existingScript = document.querySelector('script[type="application/ld+json"]#dynamic-seo')
    if (existingScript) {
      existingScript.remove()
    }

    // Thêm structured data mới
    if (data) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'dynamic-seo'
      script.textContent = JSON.stringify(data)
      document.head.appendChild(script)
    }
  }

  // SEO presets cho các trang khác nhau
  const seoPresets = {
    home: {
      title: 'Trang Chủ',
      description: 'ChillChill Hotel - Hệ thống đặt phòng khách sạn trực tuyến hàng đầu Việt Nam. Tìm kiếm và đặt phòng với giá tốt nhất, dịch vụ chuyên nghiệp, thanh toán an toàn.',
      keywords: 'đặt phòng khách sạn, booking hotel, khách sạn giá rẻ, du lịch việt nam, đặt phòng online',
      ogImage: 'https://chillchill-hotel.com/images/homepage-og.jpg'
    },
    search: {
      title: 'Tìm Kiếm Khách Sạn',
      description: 'Tìm kiếm và so sánh giá khách sạn tốt nhất. Hàng nghìn lựa chọn với mức giá cạnh tranh và dịch vụ chất lượng.',
      keywords: 'tìm kiếm khách sạn, so sánh giá khách sạn, booking online vietnam',
      ogImage: 'https://chillchill-hotel.com/images/search-og.jpg'
    },
    booking: {
      title: 'Đặt Phòng',
      description: 'Hoàn tất đặt phòng khách sạn với quy trình đơn giản, thanh toán an toàn và xác nhận ngay lập tức.',
      keywords: 'đặt phòng khách sạn, thanh toán online, booking confirmation',
      ogImage: 'https://chillchill-hotel.com/images/booking-og.jpg'
    },
    hotelDetail: (hotelName, location) => ({
      title: `${hotelName} - ${location}`,
      description: `Đặt phòng tại ${hotelName} ở ${location}. Xem ảnh, tiện nghi, đánh giá và ưu đãi tốt nhất. Đặt ngay để nhận giá tốt nhất.`,
      keywords: `${hotelName}, khách sạn ${location}, đặt phòng ${location}`,
      ogImage: 'https://chillchill-hotel.com/images/hotel-og.jpg'
    })
  }

  // Apply preset SEO
  const applySEOPreset = (presetName, ...args) => {
    let preset
    if (typeof seoPresets[presetName] === 'function') {
      preset = seoPresets[presetName](...args)
    } else {
      preset = seoPresets[presetName]
    }

    if (preset) {
      updateTitle(preset.title)
      updateDescription(preset.description)
      updateKeywords(preset.keywords)
      if (preset.ogImage) updateOGImage(preset.ogImage)
    }
  }

  // Cập nhật SEO cho hotel detail
  const updateHotelSEO = (hotel) => {
    const title = `${hotel.TenKS} - ${hotel.DiaChi}`
    const description = `Đặt phòng tại ${hotel.TenKS} ở ${hotel.DiaChi}. ${hotel.MoTaChung || 'Khách sạn chất lượng với dịch vụ tốt nhất.'}. Đặt ngay để nhận giá tốt nhất.`
    
    updateTitle(title)
    updateDescription(description)
    updateKeywords(`${hotel.TenKS}, khách sạn ${hotel.DiaChi}, đặt phòng ${hotel.DiaChi}`)
    
    // Structured data cho hotel
    const hotelStructuredData = {
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": hotel.TenKS,
      "description": hotel.MoTaChung,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": hotel.DiaChi,
        "addressCountry": "VN"
      },
      "starRating": {
        "@type": "Rating",
        "ratingValue": hotel.HangSao
      },
      "url": `https://chillchill-hotel.com/hotels/${hotel.MaKS}`,
      "image": hotel.MainImagePath || 'https://chillchill-hotel.com/images/default-hotel.jpg'
    }
    
    updateStructuredData(hotelStructuredData)
  }

  // Auto update canonical URL dựa trên route
  watch(() => route.fullPath, (newPath) => {
    const baseUrl = 'https://chillchill-hotel.com'
    updateCanonicalUrl(`${baseUrl}${newPath}`)
  }, { immediate: true })

  return {
    seoData,
    updateTitle,
    updateDescription,
    updateKeywords,
    updateOGImage,
    updateCanonicalUrl,
    updateStructuredData,
    applySEOPreset,
    updateHotelSEO
  }
} 