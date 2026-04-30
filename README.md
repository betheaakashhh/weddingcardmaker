# 💍 Wedding Card Studio

**Wedding Card Studio** is a desktop application for designing elegant Hindu wedding cards. Built with Electron, it provides a simple and powerful interface to create customized card layouts without needing a browser.

---

## ✨ Features

- 🎨 Design custom wedding cards visually  
- 🖼️ Add text, images, and decorative elements  
- 📐 Large design workspace (1600×1000)  
- 💻 Works as a desktop app (offline support)  
- ⚡ Fast and lightweight  
- 📦 Easy Windows installer generation  

---

## 🛠️ Tech Stack

- **Electron**
- **HTML, CSS, JavaScript**

---

## 📁 Project Structure
wedding-card-studio/
│
├── main.js
├── package.json
├── card-layout-studio-v3.html
├── icon.ico
├── dist/ # Build output (ignored)
└── node_modules/ # Dependencies (ignored)


---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/wedding-card-studio.git
cd wedding-card-studio

npm install
npm run build

dist/Wedding Card Studio Setup.exe
```

## 🖥️ Usage
Open the application
Start designing your wedding card
Customize layout, text, and visuals
Save or export your design
🔧 Configuration

The app uses electron-builder for packaging.
All build settings are defined inside package.json.

## 🚧 Future Plans
Export as PDF/Image
Pre-built templates
Save & load designs
Multi-language support
Auto-update system
## 🤝 Contributing

Contributions are welcome!

Fork the repository
Create a feature branch
Commit your changes
Submit a pull request
📄 License

MIT License

## 👤 Author

### Aakash

## ⭐ Support

If you found this useful, consider giving it a ⭐ on GitHub!


---
---
If you want to make it look even more **professional (like top GitHub projects)**, I can next:
- Add badges (version, downloads, license)
- Add screenshots section with layout
- Create a logo/banner for your repo

Just say 👍
---

## issue of 7zip unpacking windowSignUp
step 1: GOTO > Win + R 
      - search && enter : %LOCALAPPDATA% 
      -%LOCALAPPDATA%/electron-build/cache | delete the folder inside of cache

step 2: window setting > privacy & security or search developer 
       - turn on developer mode.

step 3: build again: 
```bash
npm run build
```