/*
  Dynamic sitemap generator for Sri Amman Smart Store
  Usage:
    1) Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path
       or set FIREBASE_SERVICE_ACCOUNT to a JSON string/path.
    2) Run: npm run generate:sitemap
    3) Output: public/sitemap.xml
*/

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const BASE_URL = 'https://www.sriammansmartstore.in';
const OUTPUT_PATH = path.resolve(__dirname, '..', 'public', 'sitemap.xml');

function initAdmin() {
  if (admin.apps.length) return;
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const saInline = process.env.FIREBASE_SERVICE_ACCOUNT; // optional JSON string or filepath
  let credential;
  try {
    if (saInline) {
      if (saInline.trim().startsWith('{')) {
        credential = admin.credential.cert(JSON.parse(saInline));
      } else {
        const json = JSON.parse(fs.readFileSync(path.resolve(saInline), 'utf8'));
        credential = admin.credential.cert(json);
      }
    } else if (saPath) {
      credential = admin.credential.cert(require(path.resolve(saPath)));
    } else {
      throw new Error('Service account not provided. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT');
    }
  } catch (e) {
    console.error('[sitemap] Failed to load service account:', e.message);
    process.exit(1);
  }
  admin.initializeApp({ credential });
}

function isoDate(d) {
  try {
    if (!d) return new Date().toISOString();
    if (typeof d.toDate === 'function') return d.toDate().toISOString();
    if (d._seconds) return new Date(d._seconds * 1000).toISOString();
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
  } catch (_) {
    return new Date().toISOString();
  }
}

async function fetchAll() {
  const db = admin.firestore();
  const urls = [];
  const now = new Date().toISOString();

  // Static pages
  urls.push({ loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: now });
  urls.push({ loc: `${BASE_URL}/categories`, changefreq: 'weekly', priority: '0.6', lastmod: now });

  // Categories
  const categoriesSnap = await db.collection('categories').get();
  const categories = [];
  categoriesSnap.forEach(doc => {
    const name = doc.get('name');
    if (name) {
      categories.push(name);
      urls.push({ loc: `${BASE_URL}/category/${encodeURIComponent(name)}`, changefreq: 'weekly', priority: '0.7', lastmod: isoDate(doc.get('updatedAt') || doc.get('createdAt') || now) });
    }
  });

  // Products per category: products/{category}/items
  for (const category of categories) {
    const itemsRef = db.collection('products').doc(category).collection('items');
    const itemsSnap = await itemsRef.get();
    itemsSnap.forEach(doc => {
      const data = doc.data() || {};
      const lastmod = isoDate(data.updatedAt || data.createdAt || now);
      urls.push({ loc: `${BASE_URL}/product/${encodeURIComponent(category)}/${encodeURIComponent(doc.id)}`, changefreq: 'weekly', priority: '0.8', lastmod });
    });
  }

  return urls;
}

function buildXml(urls) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const u of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${u.loc}</loc>`);
    if (u.lastmod) lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    if (u.changefreq) lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority) lines.push(`    <priority>${u.priority}</priority>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n');
}

(async () => {
  try {
    initAdmin();
    const urls = await fetchAll();
    const xml = buildXml(urls);
    fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');
    console.log(`[sitemap] Wrote ${urls.length} urls to ${OUTPUT_PATH}`);
    process.exit(0);
  } catch (e) {
    console.error('[sitemap] Failed to generate sitemap:', e);
    process.exit(1);
  }
})();
