(function() {
  function parseGemsData(responseText: string) {
    try {
      const cleanText = responseText.replace(/^\)\]\}\'\s*/, '');
      const sections = cleanText.split(/\r?\n\d+\r?\n|^\d+\r?\n/);
      
      for (let i = 0; i < sections.length; i++) {
        const rawSection = sections[i];
        if (!rawSection) continue;
        const section = rawSection.trim();
        if (!section || !section.startsWith('[')) continue;

        try {
          const data = JSON.parse(section);
          if (Array.isArray(data) && data[0] && data[0][0] === "wrb.fr") {
            const innerJsonString = data[0][2];
            if (typeof innerJsonString !== 'string') continue;

            const innerData = JSON.parse(innerJsonString);
            let gemsList = null;
            
            // Look for gems list structure regardless of rpcid
            if (Array.isArray(innerData[2])) {
              gemsList = innerData[2];
            } else if (Array.isArray(innerData[1]) && Array.isArray(innerData[1][15])) {
              gemsList = innerData[1][15];
            }

            if (Array.isArray(gemsList) && gemsList.length > 0 && Array.isArray(gemsList[0]) && typeof gemsList[0][0] === 'string' && gemsList[0][0].length > 10) {
              const gems = gemsList.map((item: any) => {
                if (!Array.isArray(item)) return null;
                const id = item[0];
                const meta = item[1];
                const name = Array.isArray(meta) && meta[0] ? meta[0] : null;
                if (!name) return null; // Filter out if name is missing
                
                let description = item[2];
                if (typeof description !== 'string') description = '';
                return { id, name, description };
              }).filter(Boolean);
              
              if (gems.length > 0) {
                window.postMessage({ type: 'GEMS_INTERCEPTED', gems: gems }, '*');
              }
            }
          }
        } catch (e) {}
      }
    } catch (err) {}
  }

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];
    
    // Intercept all batchexecute requests instead of filtering by rpcids
    if (typeof url === 'string' && url.includes('batchexecute')) {
      const cloned = response.clone();
      cloned.text().then(parseGemsData).catch(() => {});
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
    // Intercept all batchexecute requests
    if (typeof xhr._url === 'string' && xhr._url.includes('batchexecute')) {
      this.addEventListener('load', () => {
        if (this.responseText) parseGemsData(this.responseText);
      });
    }
    return originalSend.apply(this, arguments as any);
  };
})();