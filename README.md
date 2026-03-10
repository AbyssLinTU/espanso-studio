<div align="center">

# ⚡ Espanso Studio Pro

> **The Ultimate Visual Environment for Espanso.**  
> Built with **Rust (Tauri)** and **React (Vite)** for maximum performance and a premium desktop experience.

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2011-0078D4?style=for-the-badge&logo=windows" alt="Platform">
  <img src="https://img.shields.io/badge/Rust-Tauri%202.0-F74C00?style=for-the-badge&logo=rust" alt="Rust">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/github/license/AbyssLinTU/espanso-studio?style=for-the-badge" alt="License">
</p>

<!-- 🎨 Dynamic Hero Banner -->
<div style="background: linear-gradient(135deg, #1e1e2d 0%, #0f0f11 100%); padding: 60px; border-radius: 24px; border: 1px solid #333; margin: 40px 0;">
  <h1 style="color: #6366F1; font-size: 48px; margin-bottom: 10px;">ES</h1>
  <p style="color: #A1A1AA; font-size: 20px;">Premium YAML Visual Orchestrator</p>
</div>

</div>

---

## 🌟 Evolution: From Python to Rust + React

We’ve migrated the core engine to **Rust** to provide a blazing-fast, secure, and native desktop experience. The UI has been completely rebuilt using **React 19** and **Vite**, featuring immersive glassmorphism, fluid animations, and a seamless "Blueprint" visual logic system.

### Why the change?
- **Performance**: Zero-lag interface even with massive YAML files.
- **Safety**: Rust's memory safety and Tauri's hardened sandbox.
- **UX**: Modern web technologies allow for a level of design polish previously impossible.

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🎨 Blueprint Mode** | A visual nodes editor to build complex text expansion logic without writing a single line of YAML. |
| **⚡ Quick Mode** | Speed-oriented editor for simple replacements with instant variable injection. |
| **👁️ Live Preview** | Real-time formatted YAML generation as you construct your logic. |
| **🔄 Hybrid Sync** | Seamlessly switch between Blueprint and Quick modes with bi-directional synchronization. |
| **📦 Dynamic Variables** | Built-in support for Date snippets, Shell commands, Clipboard injection, and more. |
| **🛡️ Auto-Restart** | Instant propagation of changes to the Espanso engine directly from the UI. |

## 🛠️ Tech Stack

- **Core Engine:** [Rust](https://www.rust-lang.org/)
- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Desktop Framework:** [Tauri 2.0](https://tauri.app/)
- **Styling:** Tailwind CSS + Framer Motion
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Node Editor:** [@xyflow/react](https://reactflow.dev/) (React Flow)

## 🚀 Getting Started

### Prerequisites
1. Installed **[Node.js](https://nodejs.org/)** (LTS)
2. Installed **[Rust Toolchain](https://rustup.rs/)**
3. Installed and running **[Espanso](https://espanso.org/)**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AbyssLinTU/espanso-studio.git
   cd espanso-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in Development Mode:**
   ```bash
   npm run tauri dev
   ```

4. **Build Production Application:**
   ```bash
   npm run build
   npm run tauri build
   ```

## 🤝 Community & Contribution
We welcome contributions! Whether it's adding new node types, improving the Tauri integration, or enhancing the design.

Please see our [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon for Rust version) for guidelines.

---

<p align="center">Built with ❤️ for productivity lovers by AbyssLinTU.</p>
