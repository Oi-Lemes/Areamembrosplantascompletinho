const path = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Changes the cache location for Puppeteer.
    // We put it in node_modules so Render/Vercel caches it between builds
    // preventing re-downloading Chrome (170MB+) every time.
    cacheDirectory: path.join(__dirname, 'node_modules', '.puppeteer'),
};
