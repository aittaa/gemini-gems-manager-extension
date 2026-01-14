# Gems Manager for Google Gemini

A browser extension to manage Google Gemini Gems with search, filtering, and customization features.

[**Install from Chrome Web Store**](https://chromewebstore.google.com/detail/gems-manager-for-google-g/pcablbaheiglbmemffjpnpabapkeceig)

## Features

-   **Search:** Real-time search bar for quick Gem access.
-   **Favorites:** Pin frequently used Gems to the top.
-   **Customization:** Assign custom emojis to individual Gems.
-   **Filtering:** Filter Gems by emoji category via the filter bar.
-   **Navigation:**
    -   `Ctrl + .`: Toggle UI
    -   `↑ / ↓`: Select Gem
    -   `← / →`: Switch emoji filters
    -   `Enter`: Open in current tab
    -   `Ctrl + Enter`: Open in background tab
    -   `Esc`: Close UI
-   **Display:** Pinned mode to keep the list visible during chat.
-   **Theming:** Automatic dark mode support matching Gemini's interface.

## Installation

### From Source
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Build for Chrome: `npm run build:chrome`.
4. Load unpacked extension from the `extension/chrome` directory in `chrome://extensions/`.

## Privacy & Security

-   **Data Interception:** Operates by intercepting internal traffic; no official API keys required.
-   **Local Storage:** All data and settings are stored locally within the browser.
-   **Performance:** Lightweight implementation with minimal overhead.

## License

MIT

---
Developed based on the [web-extension-starter](https://github.com/abhijithvijayan/web-extension-starter) template.

