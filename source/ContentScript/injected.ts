(function() {
  const TARGET_RPCID = 'CNgdBe';
  const LOG_PREFIX = '[Gems Manager]';

  function log(...args: any[]) {
    console.warn(LOG_PREFIX, ...args);
  }

  function parseGemsData(responseText: string) {
    try {
      // 1. Remove the magic prefix
      const cleanText = responseText.replace(/^\)\]\}\'\s*/, '');
      
      // 2. Split by Google's envelope format: [number]\n or \n[number]\n
      // We look for sequences of digits that are followed by a newline and a JSON bracket [ or {
      const sections = cleanText.split(/\r?\n\d+\r?\n|^\d+\r?\n/);
      
      log(`Response length: ${responseText.length}, Sections found: ${sections.length}`);

      for (let i = 0; i < sections.length; i++) {
        const rawSection = sections[i];
        if (!rawSection) continue;
        const section = rawSection.trim();
        if (!section || !section.startsWith('[')) continue;

        try {
          const data = JSON.parse(section);
          
          // Check for standard batchexecute wrapper [["wrb.fr", "rpcid", ...]]
          if (Array.isArray(data) && data[0] && data[0][0] === "wrb.fr") {
            const rpcid = data[0][1];
            log(`Section ${i} has RPCID: ${rpcid}`);

            if (rpcid === TARGET_RPCID) {
              log(`Target RPCID ${TARGET_RPCID} matched! Parsing inner data...`);
              const innerJsonString = data[0][2];
              if (typeof innerJsonString !== 'string') {
                log('Inner data at index 2 is not a string:', innerJsonString);
                continue;
              }

              const innerData = JSON.parse(innerJsonString);
              log('Parsed innerData structure:', innerData);

              // Based on user sample, list is at index 2.
              // In other versions, it's at index 1, sub-index 15.
              let gemsList = null;
              if (Array.isArray(innerData[2])) {
                gemsList = innerData[2];
                log('Found gems list at innerData[2]');
              } else if (Array.isArray(innerData[1]) && Array.isArray(innerData[1][15])) {
                gemsList = innerData[1][15];
                log('Found gems list at innerData[1][15]');
              }

              if (Array.isArray(gemsList)) {
                const gems = gemsList.map((item: any) => {
                  if (!Array.isArray(item)) return null;
                  // Structure: [id, [name, ...], description/instruction, ...]
                  const id = item[0];
                  const meta = item[1];
                  const name = Array.isArray(meta) ? meta[0] : 'Unknown Gem';
                  let description = item[2];
                  if (typeof description !== 'string') description = '';
                  return { id, name, description };
                }).filter(Boolean);
                
                log('Final Parsed Gems:', gems);
                window.postMessage({ type: 'GEMS_INTERCEPTED', gems: gems }, '*');
              } else {
                log('Could not find gems list in innerData. Keys available:', Object.keys(innerData));
              }
            }
          }
        } catch (e) {
          // Ignore non-JSON sections
        }
      }
    } catch (err) {
      console.error(LOG_PREFIX, 'Critical parsing error:', err);
    }
  }

  // --- Interceptors ---
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];
    if (typeof url === 'string' && url.includes(`rpcids=${TARGET_RPCID}`)) {
      log('Intercepted via Fetch');
      const cloned = response.clone();
      cloned.text().then(parseGemsData).catch(e => log('Fetch text error:', e));
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(_method: any, url: any) {
    (this as any)._url = typeof url === 'string' ? url : url.toString();
    return originalOpen.apply(this, arguments as any);
  };
  XMLHttpRequest.prototype.send = function() {
    const xhr = this as any;
    if (typeof xhr._url === 'string' && xhr._url.includes(`rpcids=${TARGET_RPCID}`)) {
      log('Intercepted via XHR');
      this.addEventListener('load', () => {
        if (this.responseText) parseGemsData(this.responseText);
      });
    }
    return originalSend.apply(this, arguments as any);
  };

  log('Interceptor active (v4-debug)');
})();
