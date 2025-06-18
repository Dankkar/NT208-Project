const { poolPromise, sql } = require('../database/db');

class SitemapService {
  constructor() {
    this.baseUrl = process.env.CLIENT_URL || 'https://chillchill-hotel.com';
  }

  // Tạo sitemap XML
  async generateSitemap() {
    try {
      const staticUrls = this.getStaticUrls();
      const hotelUrls = await this.getHotelUrls();
      
      const allUrls = [...staticUrls, ...hotelUrls];
      
      return this.buildSitemapXML(allUrls);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      throw error;
    }
  }

  // URLs tĩnh của website
  getStaticUrls() {
    const now = new Date().toISOString();
    return [
      {
        url: `${this.baseUrl}/`,
        lastmod: now,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        url: `${this.baseUrl}/search`,
        lastmod: now,
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        url: `${this.baseUrl}/booking`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        url: `${this.baseUrl}/about`,
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.6'
      },
      {
        url: `${this.baseUrl}/contact`,
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.6'
      },
      {
        url: `${this.baseUrl}/terms`,
        lastmod: now,
        changefreq: 'yearly',
        priority: '0.3'
      },
      {
        url: `${this.baseUrl}/privacy`,
        lastmod: now,
        changefreq: 'yearly',
        priority: '0.3'
      }
    ];
  }

  // Lấy URLs của tất cả khách sạn
  async getHotelUrls() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          MaKS, 
          TenKS,
          NgayCapNhat,
          NgayThem
        FROM KhachSan 
        WHERE TrangThai = N'Hoạt động'
        ORDER BY NgayCapNhat DESC
      `);

      return result.recordset.map(hotel => ({
        url: `${this.baseUrl}/hotels/${hotel.MaKS}`,
        lastmod: hotel.NgayCapNhat ? hotel.NgayCapNhat.toISOString() : hotel.NgayThem.toISOString(),
        changefreq: 'weekly',
        priority: '0.8'
      }));
    } catch (error) {
      console.error('Error fetching hotel URLs:', error);
      return [];
    }
  }

  // Build XML sitemap
  buildSitemapXML(urls) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${this.escapeXml(url.url)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  }

  // Escape XML characters
  escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Tạo sitemap cho locations (địa điểm)
  async generateLocationSitemap() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT DISTINCT 
          DiaChi,
          COUNT(*) as HotelCount,
          MAX(NgayCapNhat) as LastUpdate
        FROM KhachSan 
        WHERE TrangThai = N'Hoạt động'
        GROUP BY DiaChi
        HAVING COUNT(*) >= 2
        ORDER BY HotelCount DESC
      `);

      const locationUrls = result.recordset.map(location => ({
        url: `${this.baseUrl}/search?location=${encodeURIComponent(location.DiaChi)}`,
        lastmod: location.LastUpdate ? location.LastUpdate.toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      }));

      return this.buildSitemapXML(locationUrls);
    } catch (error) {
      console.error('Error generating location sitemap:', error);
      return this.buildSitemapXML([]);
    }
  }

  // Tạo sitemap index (nếu có nhiều sitemap)
  async generateSitemapIndex() {
    const now = new Date().toISOString();
    
    const sitemaps = [
      {
        url: `${this.baseUrl}/sitemap-main.xml`,
        lastmod: now
      },
      {
        url: `${this.baseUrl}/sitemap-locations.xml`,
        lastmod: now
      }
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${this.escapeXml(sitemap.url)}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    return xml;
  }
}

module.exports = new SitemapService(); 