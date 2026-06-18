import { get } from "node:https";

/** Fields required by the Web App Manifest specification. */
const requiredManifestFields = ["name", "short_name", "start_url", "display"];

/** Valid manifest display modes per the W3C specification. */
const validDisplays = ["fullscreen", "standalone", "minimal-ui", "browser"];

/** Pattern to find a service worker registration call and extract the SW URL. */
const swRegisterRe = /navigator\.serviceWorker\.register\s*\(\s*([`'"])([^`'"]+)\1/;

/** Pattern to find external script src attributes. */
const scriptSrcRe = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;

/** Pattern to find link[rel=manifest] href. */
const manifestLinkRe = /<link[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["']/i;

/**
 * Fetches a URL and parses the response as JSON.
 * @param {string} url - The URL to fetch.
 * @param {AbortSignal} signal - AbortSignal for timeout/cancellation.
 * @returns {Promise<object>} The parsed JSON object.
 */
function fetchJson(url, signal) {
  return new Promise((resolve, reject) => {
    const req = get(url, { signal, rejectUnauthorized: false }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        } else {
          try { resolve(JSON.parse(data)); } catch { reject(new Error(`Invalid JSON from ${url}`)); }
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

/**
 * Fetches a URL and returns the response body as text.
 * @param {string} url - The URL to fetch.
 * @param {AbortSignal} signal - AbortSignal for timeout/cancellation.
 * @returns {Promise<string>} The response body as a string.
 */
function fetchText(url, signal) {
  return new Promise((resolve, reject) => {
    const req = get(url, { signal, rejectUnauthorized: false }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        } else {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

/**
 * Extracts all external script URLs from an HTML page.
 * @param {string} html - The HTML content.
 * @param {string} baseUrl - Base URL for resolving relative paths.
 * @returns {string[]} Resolved script URLs.
 */
function extractScriptUrls(html, baseUrl) {
  const urls = [];
  let match;
  while ((match = scriptSrcRe.exec(html)) !== null) {
    urls.push(new URL(match[1], baseUrl).href);
  }
  return urls;
}

/**
 * Validates that a URL meets baseline PWA requirements:
 * - HTTPS
 * - Web App Manifest with required fields
 * - Service worker with event listeners
 * Exits with code 0 on success, 1 on failure.
 * @returns {Promise<void>}
 */
async function main() {
  const urlArg = process.argv[2];
  if (!urlArg) {
    console.error("Usage: node pwa-check.mjs <url>");
    process.exit(1);
  }

  const url = urlArg.replace(/\/+$/, "");
  if (!url.startsWith("https://")) {
    console.error("FAIL: Site must be served over HTTPS");
    process.exit(1);
  }
  console.log(`PWA check for ${url}`);

  const ac = new AbortController();
  const signal = ac.signal;
  setTimeout(() => ac.abort(), 15000);

  const failures = [];

  try {
    const html = await fetchText(url, signal);

    // --- Service Worker ---
    let swUrl = null;

    const inlineMatch = html.match(swRegisterRe);
    if (inlineMatch) {
      swUrl = new URL(inlineMatch[2], url).href;
    } else {
      const scriptUrls = extractScriptUrls(html, url);
      for (const scriptUrl of scriptUrls) {
        try {
          const scriptContent = await fetchText(scriptUrl, signal);
          const scriptMatch = scriptContent.match(swRegisterRe);
          if (scriptMatch) {
            swUrl = new URL(scriptMatch[2], url).href;
            break;
          }
        } catch {
          // script unreachable, skip
        }
      }
    }

    if (!swUrl) {
      failures.push("No service worker registration found in HTML or loaded scripts");
    } else {
      try {
        const swContent = await fetchText(swUrl, signal);
        if (!swContent.includes("self.addEventListener")) {
          failures.push(`Service worker at ${swUrl} lacks self.addEventListener`);
        }
      } catch {
        failures.push(`Service worker at ${swUrl} unreachable or invalid`);
      }
    }

    // --- Web App Manifest ---
    const manifestMatch = html.match(manifestLinkRe);
    if (!manifestMatch) {
      failures.push("No <link rel=\"manifest\"> found in page");
    } else {
      const manifestUrl = new URL(manifestMatch[1], url).href;
      let manifest;
      try {
        manifest = await fetchJson(manifestUrl, signal);
      } catch (err) {
        failures.push(`Manifest at ${manifestUrl} unreachable or invalid: ${err.message}`);
        manifest = null;
      }

      if (manifest) {
        for (const field of requiredManifestFields) {
          if (!manifest[field]) {
            failures.push(`Manifest missing required field: "${field}"`);
          }
        }

        if (manifest.display && !validDisplays.includes(manifest.display)) {
          failures.push(`Manifest display "${manifest.display}" is not a valid display mode`);
        }

        if (!manifest.icons || !Array.isArray(manifest.icons) || manifest.icons.length === 0) {
          failures.push("Manifest must have at least one icon");
        } else {
          for (const icon of manifest.icons) {
            if (!icon.src) failures.push("Manifest icon missing 'src'");
            if (!icon.sizes) failures.push(`Manifest icon ${icon.src} missing 'sizes'`);
          }
        }
      }
    }
  } catch (err) {
    failures.push(`Failed to fetch ${url}: ${err.message}`);
  }

  if (failures.length > 0) {
    console.error("PWA validation FAILED:");
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log("PWA validation PASSED");
}

main();
