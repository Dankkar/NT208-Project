const express = require('express');
const router = express.Router();
const sitemapService = require('../services/sitemapService');

/**
 * @route   GET /sitemap.xml
 * @desc    Generate and serve main sitemap
 * @access  Public
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await sitemapService.generateSitemap();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
    res.send(sitemap);
  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * @route   GET /sitemap-locations.xml
 * @desc    Generate and serve locations sitemap
 * @access  Public
 */
router.get('/sitemap-locations.xml', async (req, res) => {
  try {
    const sitemap = await sitemapService.generateLocationSitemap();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (error) {
    console.error('Error serving location sitemap:', error);
    res.status(500).send('Error generating location sitemap');
  }
});

/**
 * @route   GET /sitemap-index.xml
 * @desc    Generate and serve sitemap index
 * @access  Public
 */
router.get('/sitemap-index.xml', async (req, res) => {
  try {
    const sitemapIndex = await sitemapService.generateSitemapIndex();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(sitemapIndex);
  } catch (error) {
    console.error('Error serving sitemap index:', error);
    res.status(500).send('Error generating sitemap index');
  }
});

/**
 * @route   GET /robots.txt
 * @desc    Serve robots.txt
 * @access  Public
 */
router.get('/robots.txt', (req, res) => {
  const robots = `# robots.txt for ChillChill Hotel
# Hướng dẫn cho các web crawlers

User-agent: *
Allow: /

# Cho phép tất cả các trang chính
Allow: /hotels/
Allow: /search
Allow: /booking
Allow: /about
Allow: /contact

# Không cho phép crawl các trang admin và API
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /signup
Disallow: /user/

# Không cho phép crawl các file tạm thời
Disallow: /tmp/
Disallow: /*.json$
Disallow: /*?*utm_*
Disallow: /*?*sessionid*
Disallow: /*?*sid*

# Tần suất crawl (tùy chọn)
Crawl-delay: 1

# Sitemap location
Sitemap: ${process.env.CLIENT_URL || 'https://chillchill-hotel.com'}/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24 hours
  res.send(robots);
});

module.exports = router; 