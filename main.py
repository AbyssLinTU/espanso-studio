import os
import io
import shutil
import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import messagebox

import customtkinter as ctk
from PIL import Image
try:
    from CTkMessagebox import CTkMessagebox
except ImportError:
    pass  # We will install it shortly, but handle gracefully

from ruamel.yaml import YAML

# ─────────────────────────────────────────────────────────────────────────────
#  ТЕМА И СТИЛИ (FLUENT DESIGN)
# ─────────────────────────────────────────────────────────────────────────────
class Theme:
    BG_ROOT = "#0C0C0F"        # Самый тёмный (для Preview и Sidebar-фона)
    BG_SIDEBAR = "#15151A"     # Чуть светлее для Sidebar
    BG_MAIN = "#1A1A22"        # Основная зона (Dashboard)
    
    BG_CARD = "#21212B"        # Цвет карточки
    BG_CARD_HOVER = "#2A2A35"  # Hover-эффект
    
    ACCENT = "#4F46E5"         # Электрик индиго (кнопки)
    ACCENT_HOVER = "#4338CA"
    
    TEXT_MAIN = "#F3F4F6"
    TEXT_MUTED = "#9CA3AF"
    
    RADIUS_LARGE = 15
    RADIUS_SMALL = 8
    
    FONT_FAMILY = "Segoe UI"   # Нативный Windows-шрифт
    
    @classmethod
    def font(cls, size=13, weight="normal"):
        return ctk.CTkFont(family=cls.FONT_FAMILY, size=size, weight=weight)


# ─────────────────────────────────────────────────────────────────────────────
#  БЛОКИ (КОНСТРУКТОР)
# ─────────────────────────────────────────────────────────────────────────────
BLOCK_TYPES = [
    {
        "id": "text", "icon": "📄", "name": "Simple Text",
        "desc": "Обычная текстовая замена",
        "fields": [{"key": "value", "label": "Текст замены", "default": "Текст", "type": "textbox"}],
    },
    {
        "id": "date", "icon": "📅", "name": "Date",
        "desc": "Вставляет текущую дату",
        "fields": [{"key": "format", "label": "Формат (strftime)", "default": "%Y-%m-%d", "type": "entry"}],
    },
    {
        "id": "shell", "icon": "🖥", "name": "Shell",
        "desc": "Выполняет команду",
        "fields": [
            {"key": "cmd",  "label": "Команда", "default": "echo hello", "type": "entry"},
            {"key": "trim", "label": "Trim whitespace", "default": True, "type": "checkbox"},
        ],
    },
]

# Остальные типы убраны для краткости, можно легко вернуть Script/Form


# ─────────────────────────────────────────────────────────────────────────────
#  ESPANSO MANAGER (ПАРСИНГ И СОХРАНЕНИЕ)
# ─────────────────────────────────────────────────────────────────────────────
class EspansoManager:
    def __init__(self):
        self.appdata = os.getenv("APPDATA")
        if not self.appdata:
            raise EnvironmentError("Переменная окружения APPDATA не найдена.")
        self.espanso_dir = Path(self.appdata) / "espanso" / "match"
        self.base_yml = self.espanso_dir / "base.yml"
        self.backup_yml = self.espanso_dir / "base.yml.bak"
        self.yaml = YAML()
        self.yaml.preserve_quotes = True
        self.yaml.indent(mapping=2, sequence=4, offset=2)
        self._ensure_files()

    def _ensure_files(self):
        self.espanso_dir.mkdir(parents=True, exist_ok=True)
        if not self.base_yml.exists():
            self.base_yml.write_text("matches:\n", encoding="utf-8")

    def get_matches(self):
        try:
            data = self.yaml.load(self.base_yml.read_text(encoding="utf-8"))
            return list(data.get("matches", []) if data else [])
        except Exception as e:
            return []

    def save_matches(self, matches):
        if self.base_yml.exists() and self.base_yml.stat().st_size > 0:
            shutil.copy2(self.base_yml, self.backup_yml) # Бэкап
        try:
            raw = self.base_yml.read_text(encoding="utf-8") if self.base_yml.stat().st_size > 0 else ""
            data = self.yaml.load(raw) or {}
            data["matches"] = matches
            with open(self.base_yml, "w", encoding="utf-8") as f:
                self.yaml.dump(data, f)
        except Exception as e:
            if self.backup_yml.exists():
                shutil.copy2(self.backup_yml, self.base_yml)
            raise RuntimeError(f"Синтаксическая ошибка YAML! Восстановлен бэкап.\n{e}")

    def apply_and_restart(self):
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        subprocess.run("espanso restart", check=True, creationflags=flags, shell=True)


# ─────────────────────────────────────────────────────────────────────────────
#  UI: КАРТОЧКА МАТЧА (MATCH CARD)
# ─────────────────────────────────────────────────────────────────────────────
class MatchCard(ctk.CTkFrame):
    """Класс карточки для отображения в Dashboard с эффектом Hover."""
    def __init__(self, parent, match_data, index, on_click, on_delete, on_edit):
        super().__init__(parent, fg_color=Theme.BG_CARD, corner_radius=Theme.RADIUS_LARGE)
        self.match_data = match_data
        self.index = index
        self.on_click = on_click

        # Hover эффекты (пробрасываем на детей через биндинг)
        self.bind("<Enter>", self._on_hover_in)
        self.bind("<Leave>", self._on_hover_out)
        
        trigger = match_data.get("trigger", "Unknown")
        replace = match_data.get("replace", "")

        # Layout карточки
        self.columnconfigure(0, weight=1)
        
        # Заголовок
        lbl_trig = ctk.CTkLabel(self, text=trigger, font=Theme.font(15, "bold"), text_color=Theme.TEXT_MAIN, anchor="w")
        lbl_trig.grid(row=0, column=0, sticky="w", padx=15, pady=(15, 5))
        lbl_trig.bind("<Button-1>", self._trigger_click)
        lbl_trig.bind("<Enter>", self._on_hover_in)
        lbl_trig.bind("<Leave>", self._on_hover_out)

        # Описание короткое
        lbl_rep = ctk.CTkLabel(self, text=replace[:60] + ("..." if len(replace)>60 else ""), font=Theme.font(12), text_color=Theme.TEXT_MUTED, anchor="w")
        lbl_rep.grid(row=1, column=0, sticky="w", padx=15, pady=(0, 15))
        lbl_rep.bind("<Button-1>", self._trigger_click)
        lbl_rep.bind("<Enter>", self._on_hover_in)
        lbl_rep.bind("<Leave>", self._on_hover_out)

        # Биндинг самого фрейма
        self.bind("<Button-1>", self._trigger_click)

        # Кнопки действий (Edit / Delete)
        action_frame = ctk.CTkFrame(self, fg_color="transparent")
        action_frame.grid(row=0, rowspan=2, column=1, sticky="e", padx=15, pady=15)
        
        btn_cfg = dict(width=30, height=30, fg_color="transparent", corner_radius=Theme.RADIUS_SMALL)
        # Edit
        edit_btn = ctk.CTkButton(action_frame, text="✏️", hover_color=Theme.ACCENT, **btn_cfg, command=lambda: on_edit(index))
        edit_btn.pack(side="left", padx=2)
        # Delete
        del_btn = ctk.CTkButton(action_frame, text="🗑", hover_color="#8B0000", **btn_cfg, command=lambda: on_delete(index))
        del_btn.pack(side="left", padx=2)

    def _on_hover_in(self, event=None):
        self.configure(fg_color=Theme.BG_CARD_HOVER)

    def _on_hover_out(self, event=None):
        self.configure(fg_color=Theme.BG_CARD)
        
    def _trigger_click(self, event=None):
        self.on_click(self.index)


# ─────────────────────────────────────────────────────────────────────────────
#  UI: ГЛАВНОЕ ПРИЛОЖЕНИЕ (Fluent Design Layout)
# ─────────────────────────────────────────────────────────────────────────────
class FluentStudioApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Espanso Studio")
        self.geometry("1100x700")
        self.minsize(900, 600)
        self.configure(fg_color=Theme.BG_ROOT)

        ctk.set_appearance_mode("dark")

        try:
            self.manager = EspansoManager()
        except EnvironmentError as e:
            self.show_toast("Error", str(e), icon="cancel")
            self.destroy()
            return

        self.matches = self.manager.get_matches()
        self.current_preview_match = None
        self._build_layout()
        self.load_dashboard()

    def show_toast(self, title, message, icon="info"):
        """Красивое Toast-уведомление через CTkMessagebox"""
        if "CTkMessagebox" in globals():
            CTkMessagebox(title=title, message=message, icon=icon, fade_in_duration=2)
        else:
            messagebox.showinfo(title, message)

    def _build_layout(self):
        # 1. Sidebar (слева)
        self.sidebar = ctk.CTkFrame(self, width=60, fg_color=Theme.BG_SIDEBAR, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        # Логотип / Иконка
        ctk.CTkLabel(self.sidebar, text="E⚡", font=Theme.font(20, "bold"), text_color=Theme.ACCENT).pack(pady=20)
        
        # Навигация
        nav_cfg = dict(width=40, height=40, hover_color=Theme.BG_CARD_HOVER, fg_color="transparent", font=Theme.font(18))
        ctk.CTkButton(self.sidebar, text="🏠", command=self.load_dashboard, **nav_cfg).pack(pady=10)
        ctk.CTkButton(self.sidebar, text="➕", command=self.open_constructor, **nav_cfg).pack(pady=10)

        # Снизу Sidebar - рестарт
        ctk.CTkButton(self.sidebar, text="🔄", command=self.apply_restart, **nav_cfg).pack(side="bottom", pady=20)

        # 2. Main Content (по центру - Dashboard или Constructor)
        self.main_container = ctk.CTkFrame(self, fg_color=Theme.BG_MAIN, corner_radius=Theme.RADIUS_LARGE)
        self.main_container.pack(side="left", fill="both", expand=True, padx=15, pady=15)

        # 3. Live Preview (справа)
        self.preview_panel = ctk.CTkFrame(self, width=320, fg_color=Theme.BG_SIDEBAR, corner_radius=Theme.RADIUS_LARGE)
        self.preview_panel.pack(side="right", fill="y", padx=(0, 15), pady=15)
        self.preview_panel.pack_propagate(False)

        ctk.CTkLabel(self.preview_panel, text="👁 Live YAML Preview", font=Theme.font(14, "bold"), text_color=Theme.TEXT_MUTED).pack(pady=(20, 10))
        
        self.preview_box = ctk.CTkTextbox(self.preview_panel, font=ctk.CTkFont(family="Consolas", size=12), fg_color="#18181A", text_color="#A8B2D1", corner_radius=8)
        self.preview_box.pack(fill="both", expand=True, padx=15, pady=(0, 20))
        self.preview_box.configure(state="disabled")

    def _clear_main(self):
        for widget in self.main_container.winfo_children():
            widget.destroy()

    def update_preview(self, match_obj):
        """Обновляет YAML предпросмотр"""
        self.current_preview_match = match_obj
        if not match_obj:
            yaml_text = "# Выберите карточку или \n# начните создавать новую"
        else:
            yaml_inst = YAML()
            yaml_inst.indent(mapping=2, sequence=4, offset=2)
            buf = io.StringIO()
            # Обернем в dummy matches, чтобы формат был правильным
            yaml_inst.dump({"matches": [match_obj]}, buf)
            yaml_text = buf.getvalue()

        self.preview_box.configure(state="normal")
        self.preview_box.delete("1.0", "end")
        self.preview_box.insert("end", yaml_text)
        self.preview_box.configure(state="disabled")

    # ── РЕЖИМ: DASHBOARD ───────────────────────────────────────────────────────
    def load_dashboard(self):
        self._clear_main()
        self.update_preview(None)

        # Top Bar
        topbar = ctk.CTkFrame(self.main_container, fg_color="transparent")
        topbar.pack(fill="x", padx=20, pady=20)
        
        ctk.CTkLabel(topbar, text="My Matches", font=Theme.font(24, "bold")).pack(side="left")
        
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self._filter_cards)
        search_entry = ctk.CTkEntry(topbar, textvariable=self.search_var, placeholder_text="🔍 Search triggers...", width=200, corner_radius=Theme.RADIUS_SMALL, height=35)
        search_entry.pack(side="right")

        # Cards Scroll View
        self.cards_scroll = ctk.CTkScrollableFrame(self.main_container, fg_color="transparent")
        self.cards_scroll.pack(fill="both", expand=True, padx=15, pady=(0, 15))
        
        self._render_cards()

    def _render_cards(self, filter_text=""):
        for widget in self.cards_scroll.winfo_children():
            widget.destroy()
            
        count = 0
        for i, match in enumerate(self.matches):
            text = match.get("trigger", "").lower() + " " + match.get("replace", "").lower()
            if filter_text.lower() in text:
                MatchCard(
                    self.cards_scroll, match, index=i,
                    on_click=self._on_card_click,
                    on_delete=self._on_card_delete,
                    on_edit=self._on_card_edit
                ).pack(fill="x", pady=6)
                count += 1
                
        if count == 0:
            ctk.CTkLabel(self.cards_scroll, text="No matches found.", text_color=Theme.TEXT_MUTED).pack(pady=40)

    def _filter_cards(self, *_):
        self._render_cards(self.search_var.get())

    def _on_card_click(self, index):
        match = self.matches[index]
        self.update_preview(match)

    def _on_card_delete(self, index):
        # Удаление без confirmation для MVP, либо с ним
        del self.matches[index]
        self._save_state()
        self.load_dashboard()
        self.show_toast("Deleted", "Match deleted successfully", icon="info")

    def _on_card_edit(self, index):
        self.open_constructor(edit_index=index)

    def _save_state(self):
        try:
            self.manager.save_matches(self.matches)
        except Exception as e:
            self.show_toast("Error", str(e), icon="cancel")

    def apply_restart(self):
        try:
            self.manager.apply_and_restart()
            self.show_toast("Success", "Espanso Restarted!", icon="check")
        except Exception as e:
            self.show_toast("Error", str(e), icon="cancel")

    # ── РЕЖИМ: CONSTRUCTOR (ADD NEW) ───────────────────────────────────────────
    def open_constructor(self, edit_index=None):
        self._clear_main()
        self.update_preview(None)
        
        self.edit_index = edit_index
        
        topbar = ctk.CTkFrame(self.main_container, fg_color="transparent")
        topbar.pack(fill="x", padx=20, pady=20)
        title_text = "Edit Trigger" if edit_index is not None else "Create Trigger"
        ctk.CTkLabel(topbar, text=title_text, font=Theme.font(24, "bold")).pack(side="left")

        builder = ctk.CTkFrame(self.main_container, fg_color="transparent")
        builder.pack(fill="both", expand=True, padx=20)
        
        form_frame = ctk.CTkFrame(builder, fg_color=Theme.BG_SIDEBAR, corner_radius=Theme.RADIUS_LARGE)
        form_frame.pack(fill="x", pady=10)

        ctk.CTkLabel(form_frame, text="Trigger Keyword:", anchor="w").pack(fill="x", padx=15, pady=(15, 5))
        
        self.new_trigger_var = tk.StringVar(value=":example")
        self.type_var = tk.StringVar(value="text")
        self.new_val_var = tk.StringVar(value="Hello")
        
        if edit_index is not None:
            match = self.matches[edit_index]
            self.new_trigger_var.set(match.get("trigger", ""))
            if "vars" in match and match["vars"]:
                v = match["vars"][0]
                if v.get("type") == "date":
                    self.type_var.set("date")
                    self.new_val_var.set(v.get("params", {}).get("format", "%Y-%m-%d"))
                elif v.get("type") == "shell":
                    self.type_var.set("shell")
                    self.new_val_var.set(v.get("params", {}).get("cmd", ""))
            else:
                self.type_var.set("text")
                self.new_val_var.set(match.get("replace", ""))
                
        self.new_trigger_var.trace_add("write", self._live_preview_update)
        trig_entry = ctk.CTkEntry(form_frame, textvariable=self.new_trigger_var, height=35)
        trig_entry.pack(fill="x", padx=15, pady=(0, 15))

        ctk.CTkLabel(form_frame, text="Replacement Type:", anchor="w").pack(fill="x", padx=15, pady=(5, 5))
        
        radio_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        radio_frame.pack(fill="x", padx=15, pady=(0, 15))
        
        for bt in BLOCK_TYPES:
            ctk.CTkRadioButton(
                radio_frame, text=f"{bt['icon']} {bt['name']}", 
                variable=self.type_var, value=bt["id"],
                command=self._live_preview_update
            ).pack(side="left", padx=10)

        ctk.CTkLabel(form_frame, text="Value / Content:", anchor="w").pack(fill="x", padx=15, pady=(5, 5))
        self.new_val_var.trace_add("write", self._live_preview_update)
        val_entry = ctk.CTkEntry(form_frame, textvariable=self.new_val_var, height=35)
        val_entry.pack(fill="x", padx=15, pady=(0, 20))

        btn = ctk.CTkButton(builder, text="Save Match", height=40, font=Theme.font(14, "bold"), fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_HOVER, corner_radius=Theme.RADIUS_SMALL, command=self._save_new_match)
        btn.pack(anchor="e", pady=20)

        self._live_preview_update() # первый рендер

    def _live_preview_update(self, *_):
        trigger = self.new_trigger_var.get().strip()
        btype = self.type_var.get()
        val = self.new_val_var.get().strip()
        
        if not trigger:
            self.update_preview(None)
            return

        match_obj = {"trigger": trigger}
        
        if btype == "text":
            match_obj["replace"] = val
        elif btype == "date":
            match_obj["replace"] = "{{mydate}}"
            match_obj["vars"] = [{"name": "mydate", "type": "date", "params": {"format": val or "%Y-%m-%d"}}]
        elif btype == "shell":
            match_obj["replace"] = "{{output}}"
            match_obj["vars"] = [{"name": "output", "type": "shell", "params": {"cmd": val or "echo"}}]
            
        self.update_preview(match_obj)

    def _save_new_match(self):
        match_obj = {"trigger": self.new_trigger_var.get().strip()}
        btype = self.type_var.get()
        val = self.new_val_var.get().strip()

        if not match_obj["trigger"]:
            self.show_toast("Error", "Trigger cannot be empty", icon="cancel")
            return

        if btype == "text":
            match_obj["replace"] = val
        elif btype == "date":
            match_obj["replace"] = "{{mydate}}"
            match_obj["vars"] = [{"name": "mydate", "type": "date", "params": {"format": val or "%Y-%m-%d"}}]
        elif btype == "shell":
            match_obj["replace"] = "{{output}}"
            match_obj["vars"] = [{"name": "output", "type": "shell", "params": {"cmd": val or "echo"}}]

        if getattr(self, "edit_index", None) is not None:
            self.matches[self.edit_index] = match_obj
        else:
            self.matches.append(match_obj)
            
        self._save_state()
        self.show_toast("Success", "Match saved successfully!", icon="check")
        self.load_dashboard()


if __name__ == "__main__":
    app = FluentStudioApp()
    app.mainloop()
