<div align="center">

# ⚡ Espanso Studio Pro

> **The Ultimate Visual Environment for Espanso.**  
> Effortlessly construct, manage, and edit your text expansion rules in a stunning Windows 11 Fluent Design interface. Experience zero YAML syntax errors and maximum productivity.

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2011-0078D4?style=for-the-badge&logo=windows" alt="Platform">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/github/license/AbyssLinTU/espanso-studio?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/github/stars/AbyssLinTU/espanso-studio?style=for-the-badge" alt="Stars">
</p>

<!-- 🎨 TODO: Replace with the generated Hero Image (1280x640px) -->
<img src="https://via.placeholder.com/1280x640.png?text=Espanso+Studio+Pro+-+Fluent+Design+UI" alt="Hero Banner" width="100%">

</div>

---

## 🌟 Why Espanso Studio Pro?

Writing and managing YAML configurations manually can be tedious, formatting-sensitive, and error-prone. **Espanso Studio Pro** bridges the gap between Espanso’s powerful text expansion engine and a premium graphical user interface. 

Whether you are a power user managing hundreds of triggers or a beginner wanting to save time, Studio Pro makes rule creation a breeze. It acts as a safety net, automatically maintaining backups while providing deep integration with the core engine.

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🎨 Fluent Design UI** | Native Windows 11 aesthetic featuring immersive glassmorphism, responsive hover cards, and a deep dark mode. |
| **👁️ Live YAML Preview** | See your cleanly-formatted YAML code generate in real-time as you construct triggers. Implicitly learn syntax without breaking anything. |
| **🛡️ Backup Manager** | Safe by design. Automatic `.bak` file creation on every edit prevents accidental data loss. |
| **🔄 Seamless Apply** | One-click Espanso engine restart directly from the sidebar. No more manual terminal commands required. |
| **📦 Dynamic Constructor** | Easily construct complex blocks through the visual wizard: Simple Text, Shell Commands, Date variables, and more! |

## 🚀 Installation & Usage

### Prerequisites
1. Installed **[Python 3.10+](https://www.python.org/downloads/)**
2. Installed and running **[Espanso](https://espanso.org/)**

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AbyssLinTU/espanso-studio.git
   cd espanso-studio
   ```

2. **Install necessary dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the application:**
   ```bash
   python main.py
   ```

## 🛠️ Stack & Technologies
- **Core:** Python
- **GUI Framework:** [CustomTkinter](https://github.com/TomSchimansky/CustomTkinter)
- **Data Serialization:** `ruamel.yaml` (preserves YAML comments and precise structure)
- **Toast Notifications:** `CTkMessagebox`

## 🤝 Community & Contribution
We welcome contributions to make Espanso Studio Pro even better. Whether it's adding new block types (Forms, Scripts), improving UI elements, or writing clearer documentation.

Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. If you plan to open a PR, make sure you've read them first.

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for more details.

---

<p align="center">Built with ❤️ for productivity lovers by AbyssLinTU.</p>
