(function geminiGemsManagerInjected(): void {
  type ParsedGem = {
    id: string;
    name: string;
    description: string;
  };

  type TrackedXMLHttpRequest = XMLHttpRequest & {
    _url?: string;
  };
  type FetchArgs = Parameters<Window['fetch']>;
  type FetchResponse = Awaited<ReturnType<Window['fetch']>>;

  const NOTEBOOK_MARKERS = [
    'notebook/',
    'notebooks/',
    '/notebook/',
    '/notebooks/',
    'notebooklm',
    'notebook_lm',
    'notebook-lm',
  ];
  const GEM_MARKERS = [
    '/gem/',
    '/gems/',
    'custom_gem',
    'custom-gem',
    'gem_config',
    'gemconfig',
  ];

  function collectStrings(value: unknown, strings: string[] = []): string[] {
    if (typeof value === 'string') {
      strings.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) collectStrings(item, strings);
    } else if (value && typeof value === 'object') {
      for (const item of Object.values(value)) collectStrings(item, strings);
    }

    return strings;
  }

  function hasMarker(value: unknown, markers: string[]): boolean {
    const strings = collectStrings(value);
    return strings.some((text) => {
      const lowerText = text.toLowerCase();
      return markers.some((marker) => lowerText.includes(marker));
    });
  }

  function isNotebookData(value: unknown): boolean {
    return hasMarker(value, NOTEBOOK_MARKERS);
  }

  function isGemData(value: unknown): boolean {
    return hasMarker(value, GEM_MARKERS);
  }

  function getCandidateLists(innerData: unknown): unknown[] {
    const candidates: unknown[] = [];

    if (!Array.isArray(innerData)) return candidates;
    if (Array.isArray(innerData[2])) candidates.push(innerData[2]);
    if (Array.isArray(innerData[1]) && Array.isArray(innerData[1][15])) {
      candidates.push(innerData[1][15]);
    }

    return candidates;
  }

  function parseGemItem(item: unknown): ParsedGem | null {
    if (!Array.isArray(item)) return null;
    if (isNotebookData(item) && !isGemData(item)) return null;

    const id = item[0];
    if (typeof id !== 'string' || id.length <= 10 || isNotebookData(id))
      return null;

    const meta = item[1];
    const name =
      Array.isArray(meta) && typeof meta[0] === 'string' ? meta[0] : null;
    if (!name) return null;

    let description = item[2];
    if (typeof description !== 'string') description = '';

    return {id, name, description};
  }

  function parseGemsData(responseText: string): void {
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
          if (Array.isArray(data) && data[0] && data[0][0] === 'wrb.fr') {
            const innerJsonString = data[0][2];
            if (typeof innerJsonString !== 'string') continue;

            const innerData = JSON.parse(innerJsonString);
            const candidateLists = getCandidateLists(innerData);

            for (const candidateList of candidateLists) {
              if (!Array.isArray(candidateList) || candidateList.length === 0)
                continue;
              if (isNotebookData(candidateList) && !isGemData(candidateList))
                continue;

              const parsedGems = candidateList
                .map(parseGemItem)
                .filter((gem): gem is ParsedGem => Boolean(gem));
              if (parsedGems.length > 0) {
                window.postMessage(
                  {type: 'GEMS_INTERCEPTED', gems: parsedGems},
                  '*'
                );
              }
            }
          }
        } catch {}
      }
    } catch {}
  }

  const originalFetch = window.fetch;
  window.fetch = async function gemsManagerFetch(
    ...args: FetchArgs
  ): Promise<FetchResponse> {
    const response = await originalFetch.apply(this, args);
    const requestInput = args[0];
    const url =
      typeof requestInput === 'string'
        ? requestInput
        : requestInput instanceof URL
          ? requestInput.href
          : requestInput && 'url' in requestInput
            ? requestInput.url
            : '';

    // Intercept all batchexecute requests instead of filtering by rpcids
    if (typeof url === 'string' && url.includes('batchexecute')) {
      const cloned = response.clone();
      cloned
        .text()
        .then(parseGemsData)
        .catch(() => {});
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function gemsManagerOpen(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    (this as TrackedXMLHttpRequest)._url =
      typeof url === 'string' ? url : url.toString();

    originalOpen.call(
      this,
      method,
      url,
      async ?? true,
      username ?? null,
      password ?? null
    );
  };
  XMLHttpRequest.prototype.send = function gemsManagerSend(
    body?: Document | XMLHttpRequestBodyInit | null
  ): void {
    const xhr = this as TrackedXMLHttpRequest;
    // Intercept all batchexecute requests
    if (typeof xhr._url === 'string' && xhr._url.includes('batchexecute')) {
      this.addEventListener('load', () => {
        if (this.responseText) parseGemsData(this.responseText);
      });
    }
    originalSend.call(this, body);
  };
})();
