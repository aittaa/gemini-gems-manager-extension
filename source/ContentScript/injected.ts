(function() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = args[0] instanceof Request ? args[0].url : args[0];

    if (typeof url === 'string' && url.includes('rpcids=CNgdBe')) {
      const clonedResponse = response.clone();
      try {
        const text = await clonedResponse.text();
        parseGemsData(text);
      } catch (err) {
        console.error('[Gems Manager] Error reading response:', err);
      }
    }

    return response;
  };

    function parseGemsData(responseText: string) {

      try {

        // batchexecute response format:

        // )]}'

        // [DATA_LENGTH]

        // [[...]]

        const cleanText = responseText.replace(/^\)\]\}\'\s*/, '');

        const sections = cleanText.split(/\n\d+\n/);

        

        for (const section of sections) {

          if (!section.trim()) continue;

          

          try {

            const data = JSON.parse(section);

            // The Gems list is usually in the first element of the response array for this rpcid

            // Expected structure based on PRD: [["wrb.fr", "otAQ7b", "[...]"]]

            if (Array.isArray(data) && data[0][0] === "wrb.fr") {

              const innerJsonString = data[0][2];

              const innerData = JSON.parse(innerJsonString);

              

              // innerData[1][15] seems to contain the Gems list based on the PRD sample

              const gemsList = innerData[1]?.[15];

              

              if (Array.isArray(gemsList)) {

                const gems = gemsList.map((item: any) => ({

                  id: item[0],

                  name: item[1],

                  description: item[2],

                }));

                

                console.log('[Gems Manager] Parsed Gems:', gems);

                

                // Send data back to content script

                window.postMessage({

                  type: 'GEMS_INTERCEPTED',

                  gems: gems

                }, '*');

              }

            }

          } catch (e) {

            // Not the section we're looking for or parse error

          }

        }

      } catch (err) {

        console.error('[Gems Manager] Parsing error:', err);

      }

    }

  console.log('[Gems Manager] Interceptor injected');
})();
