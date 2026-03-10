<div align="center">

# ⚡ Espanso Studio Pro `v1.0.0`

> **The Ultimate Visual Environment for Espanso.**  
> Built with **Rust (Tauri)** and **React (Vite 6)** for maximum performance and a premium desktop experience.

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

## 🚀 The 1.0.0 Revolution

We've reached a stable milestone! Espanso Studio has migrated from a legacy Python bridge to a **native Rust engine** using Tauri. This ensures high-speed execution, minimal memory footprint, and native security.

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🎨 Blueprint Mode** | A visual nodes editor to build complex text expansion logic (Variable chaining). |
| **⚡ Quick Mode** | Speed-oriented editor for simple replacements with instant variable injection. |
| **👁️ Live Preview** | Real-time formatted YAML generation as you construct your logic. |
| **🔄 Hybrid Sync** | Seamlessly switch between Blueprint and Quick modes with bi-directional synchronization. |
| **🛡️ Auto-Restart** | Instant propagation of changes to the Espanso engine directly from the UI. |

## 🛠️ Tech Stack

- **Backend:** [Rust](https://www.rust-lang.org/) + [Tauri 2.0](https://tauri.app/)
- **Frontend:** [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **State:** [Zustand](https://github.com/pmndrs/zustand)
- **Visuals:** [React Flow](https://reactflow.dev/) (xyflow) + Framer Motion
- **Styling:** Tailwind CSS (Glassmorphism & Dark Mode)

## 📖 Usage Instructions

### 1. Home Dashboard
When you launch the app, you'll see all your existing matches from your `base.yml`. 
- **Search**: Use the top search bar to find triggers quickly.
- **Edit**: Click the pencil icon to modify a macro.
- **Delete**: Click the trash icon to remove a snippet permanently.

### 2. Creating Macros (Quick Mode)
Click the **"+"** icon in the sidebar.
1. Enter a **Trigger** (e.g., `:id`).
2. Type your **Replacement** text in the main area.
3. Use **Quick Add** buttons to insert dynamic variables (Date, Clipboard, Shell).
4. Configure variable settings in the cards that appear below.
5. Hit **"Save"** in the top bar.

### 3. Blueprint Editor (Visual Mode)
Toggle to **Blueprint** in the header for advanced logic.
- **Nodes**: Drag and drop output types (Text, Shell, Date) from the left palette.
- **Connections**: Connect the "Trigger" node to various output nodes to chain text together.
- **Properties**: Select a node to edit its specific values on the right sidebar.

### 4. Live Preview
The right-hand panel shows the exact YAML code that will be written to your configuration. You can toggle this panel with the expand/collapse handle.

---

## 🛠️ Development & Build

### Prerequisites
1. Installed **[Node.js](https://nodejs.org/)** (LTS)
2. Installed **[Rust Toolchain](https://rustup.rs/)**
3. Installed and running **[Espanso](https://espanso.org/)**

### Steps
1. **Clone & Install:**
   ```bash
   git clone https://github.com/AbyssLinTU/espanso-studio.git
   cd espanso-studio
   npm install
   ```

2. **Run Dev:**
   ```bash
   npm run tauri dev
   ```

3. **Build:**
   ```bash
   npm run tauri build
   ```

---

<p align="center">Made with ❤️ for productivity lovers by AbyssLinTU.</p>
