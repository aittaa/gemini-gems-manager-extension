# Gemini Gems Manager

Enhance your Google Gemini experience by unlocking powerful Gem management features. This extension adds a searchable, filterable, and customizable Gems list directly into the Gemini interface.

## ✨ Features

-   **🔍 Instant Gem Search:** Find any Gem instantly with a real-time search bar.
-   **⭐ Favorites:** Pin your most-used Gems to the top of the list for quick access.
-   **🎨 Custom Emoji Mapping:** Assign your own emojis to each Gem to make them easily recognizable.
-   **🏷️ Icon Filter Bar:** Quickly filter Gems by their assigned emojis using the horizontal filter bar.
-   **⌨️ Full Keyboard Support:**
    -   `Ctrl + .` (or `Cmd + .`) to toggle the UI.
    -   `↑ / ↓` to select a Gem.
    -   `← / →` to switch emoji filters.
    -   `Enter` to open the selected Gem.
    -   `Esc` to close the UI.
-   **📌 Pin UI:** Keep the Gems list always visible while you chat.
-   **🌗 Dark Mode Support:** Automatically matches Gemini's native theme.

## 🛠 Installation

### For Development
1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run build:chrome` to build the extension.
4. Open Chrome and go to `chrome://extensions/`.
5. Enable "Developer mode" and click "Load unpacked".
6. Select the `extension/chrome` folder.

## 🔒 Privacy & Safety
-   **No Official API needed:** This extension intercepts existing data traffic safely within your browser.
-   **Privacy Focused:** Your Gems data never leaves your browser. All settings are stored locally.
-   **Lightweight:** Minimal impact on browser performance.

## 📝 Note
This project is not affiliated with Google. Since it uses internal traffic interception, Google's UI updates may occasionally affect functionality.

## 📄 License
MIT