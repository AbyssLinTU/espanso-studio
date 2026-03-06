# -*- coding: utf-8 -*-
import os
import io
import re
import shutil
import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import messagebox

import customtkinter as ctk
from PIL import Image, ImageDraw
try:
    from CTkMessagebox import CTkMessagebox
except ImportError:
    pass

from ruamel.yaml import YAML
from node_editor import NodeCanvas, NODE_REGISTRY
from engine.compiler import NodeGraphCompiler, NodeCompilerError
from engine.file_manager import EspansoManager
from engine.orchestrator import DataOrchestrator
from styles.theme import Theme


# ---------------------------------------------------------------------------
#  QUICK MODE EXTENSIONS - mini-cards for inline variables
#  All icon chars are safe ASCII (no emoji)
# ---------------------------------------------------------------------------
QUICK_EXTENSIONS = {
    "date":      {"icon": "[D]", "label": "Date",      "placeholder": "{{date}}",      "param_label": "Format (strftime)", "default": "%Y-%m-%d"},
    "shell":     {"icon": "[$]", "label": "Shell",     "placeholder": "{{shell}}",     "param_label": "Command",           "default": "echo hello"},
    "clipboard": {"icon": "[C]", "label": "Clipboard", "placeholder": "{{clipboard}}", "param_label": None,                "default": ""},
    "form":      {"icon": "[F]", "label": "Form",      "placeholder": "{{form}}",      "param_label": "Field name",        "default": "name"},
    "random":    {"icon": "[?]", "label": "Random",    "placeholder": "{{random}}",    "param_label": "Choices (;)",       "default": "hi;hello;hey"},
}


# ---------------------------------------------------------------------------
#  ICON FACTORY - Pillow-rendered Fluent-style action icons (RGBA, no files)
# ---------------------------------------------------------------------------
class IconFactory:
    """Creates and caches CTkImage icons drawn programmatically via Pillow."""

    _cache: dict = {}

    # -- Edit (pencil) icon -------------------------------------------------
    @classmethod
    def edit_icon(cls, size: int = 18) -> ctk.CTkImage:
        key = f"edit_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            pen_color = (79, 70, 229, 255)   # #4F46E5
            d.line([(int(s * 0.25), int(s * 0.75)),
                    (int(s * 0.72), int(s * 0.28))],
                   fill=pen_color, width=max(2, s // 8))
            d.polygon([
                (int(s * 0.15), int(s * 0.85)),
                (int(s * 0.25), int(s * 0.75)),
                (int(s * 0.30), int(s * 0.80)),
            ], fill=pen_color)
            d.line([(int(s * 0.68), int(s * 0.22)),
                    (int(s * 0.82), int(s * 0.36))],
                   fill=pen_color, width=max(2, s // 8))
            d.line([(int(s * 0.72), int(s * 0.18)),
                    (int(s * 0.86), int(s * 0.32))],
                   fill=pen_color, width=max(1, s // 12))
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Delete (trash) icon ------------------------------------------------
    @classmethod
    def delete_icon(cls, size: int = 18) -> ctk.CTkImage:
        key = f"delete_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            trash_color = (239, 68, 68, 255)   # #EF4444
            d.rectangle([int(s * 0.15), int(s * 0.15),
                         int(s * 0.85), int(s * 0.25)], fill=trash_color)
            d.rectangle([int(s * 0.38), int(s * 0.08),
                         int(s * 0.62), int(s * 0.17)], fill=trash_color)
            d.rectangle([int(s * 0.20), int(s * 0.28),
                         int(s * 0.80), int(s * 0.88)], fill=trash_color, outline=trash_color)
            slit_color = (0, 0, 0, 80)
            for xr in [0.37, 0.50, 0.63]:
                x = int(s * xr)
                d.line([(x, int(s * 0.35)), (x, int(s * 0.80))],
                       fill=slit_color, width=max(1, s // 14))
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Home icon ----------------------------------------------------------
    @classmethod
    def home_icon(cls, size: int = 20) -> ctk.CTkImage:
        key = f"home_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (225, 225, 230, 255)   # Theme.TEXT_MAIN
            # Roof (triangle)
            d.polygon([
                (s // 2, int(s * 0.10)),
                (int(s * 0.15), int(s * 0.48)),
                (int(s * 0.85), int(s * 0.48)),
            ], fill=c)
            # Body (rectangle)
            d.rectangle([int(s * 0.22), int(s * 0.48),
                         int(s * 0.78), int(s * 0.88)], fill=c)
            # Door (dark cutout)
            d.rectangle([int(s * 0.40), int(s * 0.58),
                         int(s * 0.60), int(s * 0.88)], fill=(0, 0, 0, 0))
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Add / Plus icon ----------------------------------------------------
    @classmethod
    def add_icon(cls, size: int = 20) -> ctk.CTkImage:
        key = f"add_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (225, 225, 230, 255)
            w = max(2, s // 6)
            d.line([(s // 2, int(s * 0.15)), (s // 2, int(s * 0.85))], fill=c, width=w)
            d.line([(int(s * 0.15), s // 2), (int(s * 0.85), s // 2)], fill=c, width=w)
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Refresh icon -------------------------------------------------------
    @classmethod
    def refresh_icon(cls, size: int = 20) -> ctk.CTkImage:
        key = f"refresh_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (225, 225, 230, 255)
            w = max(2, s // 8)
            pad = int(s * 0.15)
            d.arc([pad, pad, s - pad, s - pad], start=30, end=330, fill=c, width=w)
            # Arrow head
            ax = int(s * 0.72)
            ay = int(s * 0.22)
            d.polygon([
                (ax, ay - 3),
                (ax + 4, ay + 2),
                (ax - 2, ay + 3),
            ], fill=c)
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Save (floppy disk) icon -------------------------------------------
    @classmethod
    def save_icon(cls, size: int = 18) -> ctk.CTkImage:
        key = f"save_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (255, 255, 255, 255)
            # Outer body
            d.rectangle([int(s * 0.12), int(s * 0.12),
                         int(s * 0.88), int(s * 0.88)], fill=c, outline=c)
            # Top slot (label area)
            d.rectangle([int(s * 0.28), int(s * 0.12),
                         int(s * 0.72), int(s * 0.40)], fill=(88, 101, 242, 255))
            # Center disk hole
            d.rectangle([int(s * 0.30), int(s * 0.52),
                         int(s * 0.70), int(s * 0.80)], fill=(88, 101, 242, 255))
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Chevron left (<) icon ---------------------------------------------
    @classmethod
    def chevron_left(cls, size: int = 16) -> ctk.CTkImage:
        key = f"chev_l_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (156, 163, 175, 255)   # muted
            w = max(2, s // 7)
            d.line([(int(s * 0.65), int(s * 0.15)),
                    (int(s * 0.35), int(s * 0.50)),
                    (int(s * 0.65), int(s * 0.85))],
                   fill=c, width=w, joint="curve")
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Chevron right (>) icon --------------------------------------------
    @classmethod
    def chevron_right(cls, size: int = 16) -> ctk.CTkImage:
        key = f"chev_r_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (156, 163, 175, 255)
            w = max(2, s // 7)
            d.line([(int(s * 0.35), int(s * 0.15)),
                    (int(s * 0.65), int(s * 0.50)),
                    (int(s * 0.35), int(s * 0.85))],
                   fill=c, width=w, joint="curve")
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Eye icon (preview) ------------------------------------------------
    @classmethod
    def eye_icon(cls, size: int = 16) -> ctk.CTkImage:
        key = f"eye_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (156, 163, 175, 255)
            # Outer eye shape (ellipse)
            d.ellipse([int(s * 0.08), int(s * 0.28),
                       int(s * 0.92), int(s * 0.72)], outline=c, width=max(1, s // 9))
            # Pupil
            r = int(s * 0.15)
            cx, cy = s // 2, s // 2
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]

    # -- Wrench / Blueprint icon -------------------------------------------
    @classmethod
    def wrench_icon(cls, size: int = 16) -> ctk.CTkImage:
        key = f"wrench_{size}"
        if key not in cls._cache:
            img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            s = size
            c = (88, 101, 242, 255)   # ACCENT
            w = max(2, s // 7)
            # Simple wrench - diagonal handle + circle head
            d.line([(int(s * 0.25), int(s * 0.75)),
                    (int(s * 0.65), int(s * 0.35))], fill=c, width=w)
            r = int(s * 0.14)
            hx, hy = int(s * 0.70), int(s * 0.30)
            d.ellipse([hx - r, hy - r, hx + r, hy + r], outline=c, width=max(1, s // 9))
            cls._cache[key] = ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
        return cls._cache[key]


# ---------------------------------------------------------------------------
#  UI: MATCH CARD
# ---------------------------------------------------------------------------
class MatchCard(ctk.CTkFrame):
    def __init__(self, parent, match_data, index, on_click, on_delete, on_edit):
        super().__init__(parent, fg_color=Theme.BG_CARD, corner_radius=Theme.RADIUS_LARGE)
        self.match_data = match_data
        self.index = index
        self.on_click = on_click

        self.bind("<Enter>", self._on_hover_in)
        self.bind("<Leave>", self._on_hover_out)

        trigger = match_data.get("trigger", "Unknown")
        replace = match_data.get("replace", "")

        self.columnconfigure(0, weight=1)

        lbl_trig = ctk.CTkLabel(self, text=trigger, font=Theme.font(15, "bold"), text_color=Theme.TEXT_MAIN, anchor="w")
        lbl_trig.grid(row=0, column=0, sticky="w", padx=15, pady=(15, 5))
        lbl_trig.bind("<Button-1>", self._trigger_click)
        lbl_trig.bind("<Enter>", self._on_hover_in)
        lbl_trig.bind("<Leave>", self._on_hover_out)

        lbl_rep = ctk.CTkLabel(self, text=replace[:60] + ("..." if len(replace) > 60 else ""), font=Theme.font(12), text_color=Theme.TEXT_MUTED, anchor="w")
        lbl_rep.grid(row=1, column=0, sticky="w", padx=15, pady=(0, 15))
        lbl_rep.bind("<Button-1>", self._trigger_click)
        lbl_rep.bind("<Enter>", self._on_hover_in)
        lbl_rep.bind("<Leave>", self._on_hover_out)

        self.bind("<Button-1>", self._trigger_click)

        action_frame = ctk.CTkFrame(self, fg_color="transparent")
        action_frame.grid(row=0, rowspan=2, column=1, sticky="e", padx=15, pady=15)

        # -- Fluent-style Pillow icon buttons --
        icon_size = 18
        btn_cfg = dict(width=34, height=34, fg_color="transparent", corner_radius=Theme.RADIUS_SMALL, text="")

        btn_edit = ctk.CTkButton(
            action_frame,
            image=IconFactory.edit_icon(icon_size),
            hover_color=Theme.ACCENT,
            command=lambda: on_edit(index),
            **btn_cfg,
        )
        btn_edit.pack(side="left", padx=2)

        # Delete button with custom hover
        self._del_btn = ctk.CTkButton(
            action_frame,
            image=IconFactory.delete_icon(icon_size),
            hover_color="#3D1515",
            command=lambda: on_delete(index),
            **btn_cfg,
        )
        self._del_btn.pack(side="left", padx=2)
        self._del_btn.bind("<Enter>", self._del_hover_in)
        self._del_btn.bind("<Leave>", self._del_hover_out)

    def _on_hover_in(self, event=None):
        self.configure(fg_color=Theme.BG_CARD_HOVER)

    def _on_hover_out(self, event=None):
        self.configure(fg_color=Theme.BG_CARD)

    def _del_hover_in(self, event=None):
        self._del_btn.configure(fg_color="#3D1515")

    def _del_hover_out(self, event=None):
        self._del_btn.configure(fg_color="transparent")

    def _trigger_click(self, event=None):
        self.on_click(self.index)


# ---------------------------------------------------------------------------
#  MAIN APPLICATION
# ---------------------------------------------------------------------------
class FluentStudioApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Espanso Studio Pro")
        self.geometry("1200x750")
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
        self._current_mode = "quick"
        self._quick_extensions = []
        self._preview_collapsed = False

        # -- Shared Macro Model --
        self.orchestrator = DataOrchestrator()

        self._build_layout()
        self.load_dashboard()

    def show_toast(self, title, message, icon="info"):
        if "CTkMessagebox" in globals():
            CTkMessagebox(title=title, message=message, icon=icon, fade_in_duration=2)
        else:
            messagebox.showinfo(title, message)

    # ======================================================================
    #  LAYOUT (grid-based for collapsible preview)
    # ======================================================================
    def _build_layout(self):
        # -- Sidebar (pack - independent) --
        self.sidebar = ctk.CTkFrame(self, width=60, fg_color=Theme.BG_SIDEBAR, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        # Logo - safe ASCII
        ctk.CTkLabel(self.sidebar, text="ES", font=Theme.font(20, "bold"), text_color=Theme.ACCENT).pack(pady=20)

        nav_cfg = dict(width=40, height=40, hover_color=Theme.BG_CARD_HOVER, fg_color="transparent", text="")
        ctk.CTkButton(self.sidebar, image=IconFactory.home_icon(20),    command=self.load_dashboard,  **nav_cfg).pack(pady=10)
        ctk.CTkButton(self.sidebar, image=IconFactory.add_icon(20),     command=self.open_constructor, **nav_cfg).pack(pady=10)
        ctk.CTkButton(self.sidebar, image=IconFactory.refresh_icon(20), command=self.apply_restart,    **nav_cfg).pack(side="bottom", pady=20)

        # -- Grid wrapper (main + preview) --
        self.grid_wrapper = ctk.CTkFrame(self, fg_color="transparent")
        self.grid_wrapper.pack(side="left", fill="both", expand=True, padx=0, pady=0)

        self.grid_wrapper.rowconfigure(0, weight=1)
        self.grid_wrapper.columnconfigure(0, weight=1)
        self.grid_wrapper.columnconfigure(1, weight=0, minsize=320)

        # Main container
        self.main_container = ctk.CTkFrame(self.grid_wrapper, fg_color=Theme.BG_MAIN, corner_radius=Theme.RADIUS_LARGE)
        self.main_container.grid(row=0, column=0, sticky="nsew", padx=(15, 7), pady=15)

        # Preview panel
        self.preview_panel = ctk.CTkFrame(self.grid_wrapper, fg_color=Theme.BG_SIDEBAR, corner_radius=Theme.RADIUS_LARGE)
        self.preview_panel.grid(row=0, column=1, sticky="nsew", padx=(7, 15), pady=15)

        # -- Preview header with toggle chevron --
        preview_header = ctk.CTkFrame(self.preview_panel, fg_color="transparent")
        preview_header.pack(fill="x", padx=15, pady=(15, 0))

        # Eye icon + text label (no emoji)
        ctk.CTkButton(preview_header, image=IconFactory.eye_icon(16), width=20, height=20,
                       fg_color="transparent", hover=False, text="").pack(side="left", padx=(0, 5))
        ctk.CTkLabel(preview_header, text="Live YAML Preview",
                     font=Theme.font(14, "bold"), text_color=Theme.TEXT_MUTED).pack(side="left")

        self._chevron_btn = ctk.CTkButton(
            preview_header, image=IconFactory.chevron_right(16), text="",
            width=24, height=24,
            fg_color="transparent", hover_color=Theme.BG_BORDER,
            corner_radius=6, command=self.toggle_preview,
        )
        self._chevron_btn.pack(side="right")

        # -- Preview textbox --
        self.preview_box = ctk.CTkTextbox(
            self.preview_panel,
            font=ctk.CTkFont(family="Consolas", size=12),
            fg_color="#111113", text_color="#A8B2D1", corner_radius=8,
        )
        self.preview_box.pack(fill="both", expand=True, padx=15, pady=(10, 20))
        self.preview_box.configure(state="disabled")

    # -- Collapsible Preview ------------------------------------------------
    def toggle_preview(self):
        """Toggle the right YAML preview panel.

        Column math:
          Expanded  -> columnconfigure(1, weight=0, minsize=320)
          Collapsed -> columnconfigure(1, weight=0, minsize=0)
        Column 0 always has weight=1, so it absorbs all free space.
        """
        self._preview_collapsed = not self._preview_collapsed

        if self._preview_collapsed:
            self.preview_panel.grid_remove()
            self.grid_wrapper.columnconfigure(1, weight=0, minsize=0)
            self._chevron_btn_ghost_show()
        else:
            self.grid_wrapper.columnconfigure(1, weight=0, minsize=320)
            self.preview_panel.grid()
            self._chevron_btn.configure(image=IconFactory.chevron_right(16))
            self._destroy_ghost_chevron()

    def _chevron_btn_ghost_show(self):
        """Show a small expand-button on the right edge when preview is collapsed."""
        self._ghost_chevron = ctk.CTkButton(
            self.grid_wrapper, image=IconFactory.chevron_left(16), text="",
            width=24, height=50,
            fg_color=Theme.BG_SIDEBAR, hover_color=Theme.BG_CARD_HOVER,
            corner_radius=6, command=self.toggle_preview,
        )
        self._ghost_chevron.place(relx=1.0, rely=0.5, anchor="e", x=-5)

    def _destroy_ghost_chevron(self):
        if hasattr(self, "_ghost_chevron") and self._ghost_chevron.winfo_exists():
            self._ghost_chevron.destroy()

    def _clear_main(self):
        for w in self.main_container.winfo_children():
            w.destroy()

    def update_preview(self, match_obj):
        self.current_preview_match = match_obj
        if not match_obj:
            yaml_text = "# Select a card or\n# create a new macro"
        else:
            yaml_inst = YAML()
            yaml_inst.indent(mapping=2, sequence=4, offset=2)
            buf = io.StringIO()
            yaml_inst.dump({"matches": [match_obj]}, buf)
            yaml_text = buf.getvalue()
        self.preview_box.configure(state="normal")
        self.preview_box.delete("1.0", "end")
        self.preview_box.insert("end", yaml_text)
        self.preview_box.configure(state="disabled")

    def _set_preview_error(self, text):
        self.preview_box.configure(state="normal")
        self.preview_box.delete("1.0", "end")
        self.preview_box.insert("end", text)
        self.preview_box.configure(state="disabled")

    # ======================================================================
    #  DASHBOARD
    # ======================================================================
    def load_dashboard(self):
        self._clear_main()
        self.update_preview(None)

        topbar = ctk.CTkFrame(self.main_container, fg_color="transparent")
        topbar.pack(fill="x", padx=20, pady=20)
        ctk.CTkLabel(topbar, text="My Matches", font=Theme.font(24, "bold")).pack(side="left")

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self._filter_cards)
        ctk.CTkEntry(topbar, textvariable=self.search_var, placeholder_text="Search triggers...", width=200, corner_radius=Theme.RADIUS_SMALL, height=35).pack(side="right")

        self.cards_scroll = ctk.CTkScrollableFrame(self.main_container, fg_color="transparent")
        self.cards_scroll.pack(fill="both", expand=True, padx=15, pady=(0, 15))
        self._render_cards()

    def _render_cards(self, filter_text=""):
        for w in self.cards_scroll.winfo_children():
            w.destroy()
        count = 0
        for i, match in enumerate(self.matches):
            text = match.get("trigger", "").lower() + " " + match.get("replace", "").lower()
            if filter_text.lower() in text:
                MatchCard(self.cards_scroll, match, i, self._on_card_click, self._on_card_delete, self._on_card_edit).pack(fill="x", pady=6)
                count += 1
        if count == 0:
            ctk.CTkLabel(self.cards_scroll, text="No matches found.", text_color=Theme.TEXT_MUTED).pack(pady=40)

    def _filter_cards(self, *_):
        self._render_cards(self.search_var.get())

    def _on_card_click(self, index):
        self.update_preview(self.matches[index])

    def _on_card_delete(self, index):
        del self.matches[index]
        self._save_state()
        self.load_dashboard()
        self.show_toast("Deleted", "Match deleted", icon="info")

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

    # ======================================================================
    #  CONSTRUCTOR - Hybrid Mode (Quick + Blueprint)
    # ======================================================================
    def open_constructor(self, edit_index=None):
        self._clear_main()
        self.update_preview(None)
        self.edit_index = edit_index
        self._quick_extensions = []

        # Reset orchestrator for new macro
        self.orchestrator = DataOrchestrator()

        # If editing, seed the orchestrator
        if edit_index is not None:
            m = self.matches[edit_index]
            trigger = m.get("trigger", ":hw")
            text = m.get("replace", "")
            exts = []
            for v in m.get("vars", []):
                exts.append({"type": v.get("type", "text"), "param": self._extract_param(v)})
            self.orchestrator.update_from_quick(trigger, text, exts)

        # -- Top bar --
        topbar = ctk.CTkFrame(self.main_container, fg_color="transparent")
        topbar.pack(fill="x", padx=20, pady=(10, 5))

        title_text = "Edit Macro" if edit_index is not None else "Create Macro"
        ctk.CTkLabel(topbar, text=title_text, font=Theme.font(22, "bold"), text_color=Theme.TEXT_MAIN).pack(side="left")

        btn_save = ctk.CTkButton(topbar, text="  Save", image=IconFactory.save_icon(16),
                                 height=35, font=Theme.font(13, "bold"),
                                 fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_HOVER,
                                 corner_radius=Theme.RADIUS_SMALL, command=self._save_current)
        btn_save.pack(side="right")

        # -- Segmented Tab Controller (no emoji) --
        tab_bar = ctk.CTkFrame(self.main_container, fg_color="transparent")
        tab_bar.pack(fill="x", padx=20, pady=(0, 10))

        self._current_mode = "quick"
        self.seg_btn = ctk.CTkSegmentedButton(
            tab_bar,
            values=["Quick Mode", "Blueprint Mode"],
            font=Theme.font(13, "bold"),
            fg_color="#151517",
            selected_color=Theme.ACCENT,
            selected_hover_color=Theme.ACCENT_HOVER,
            unselected_color="#212124",
            unselected_hover_color=Theme.BG_CARD_HOVER,
            corner_radius=8,
            command=self._on_mode_switch,
        )
        self.seg_btn.set("Quick Mode")
        self.seg_btn.pack(side="left")

        # Shared trigger input
        trigger_frame = ctk.CTkFrame(tab_bar, fg_color="transparent")
        trigger_frame.pack(side="right")
        ctk.CTkLabel(trigger_frame, text="Trigger:", font=Theme.font(12, "bold"), text_color=Theme.TEXT_MUTED).pack(side="left", padx=(0, 5))
        self.trigger_var = tk.StringVar(value=self.orchestrator.trigger)
        self.trigger_var.trace_add("write", lambda *_: self._on_any_change())
        ctk.CTkEntry(trigger_frame, textvariable=self.trigger_var, width=120, corner_radius=6, height=32).pack(side="left")

        # -- Content area (switched by tabs) --
        self.constructor_body = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.constructor_body.pack(fill="both", expand=True, padx=20, pady=(0, 20))

        # Seed Quick extensions from orchestrator
        qv = self.orchestrator.to_quick_view()
        self._quick_extensions = qv["extensions"]

        # Build Quick Mode by default
        self._build_quick_mode()

    @staticmethod
    def _extract_param(var_dict: dict) -> str:
        """Extract the human-readable param from a match var dict."""
        params = var_dict.get("params", {})
        if "format" in params:
            return params["format"]
        if "cmd" in params:
            return params["cmd"]
        if "layout" in params:
            return params["layout"]
        if "choices" in params:
            return ";".join(params["choices"])
        return ""

    # -- Mode Switch with DataOrchestrator sync ----------------------------
    def _on_mode_switch(self, value):
        trigger = self.trigger_var.get().strip()

        if self._current_mode == "quick":
            text = self.quick_text.get("1.0", "end-1c").strip() if hasattr(self, "quick_text") else ""
            self.orchestrator.update_from_quick(trigger, text, self._quick_extensions)
        elif self._current_mode == "blueprint":
            if hasattr(self, "canvas") and self.canvas:
                graph_data = self.canvas.get_graph_data()
                self.orchestrator.update_from_blueprint(trigger, graph_data)

        if "Quick" in value:
            self._current_mode = "quick"
            qv = self.orchestrator.to_quick_view()
            self._quick_extensions = qv["extensions"]
            self._build_quick_mode()
        else:
            self._current_mode = "blueprint"
            self._build_blueprint_mode()

    # ----------------------------------------------------------------------
    #  QUICK MODE
    # ----------------------------------------------------------------------
    def _build_quick_mode(self):
        for w in self.constructor_body.winfo_children():
            w.destroy()

        main_frame = ctk.CTkFrame(self.constructor_body, fg_color="#151517", corner_radius=Theme.RADIUS_LARGE)
        main_frame.pack(fill="both", expand=True)

        content = ctk.CTkFrame(main_frame, fg_color="transparent")
        content.pack(fill="both", expand=True, padx=25, pady=20)

        # -- Complex graph badge --
        qv = self.orchestrator.to_quick_view()
        if qv.get("has_complex_graph"):
            badge = ctk.CTkFrame(content, fg_color="#2D1B00", corner_radius=8, height=36)
            badge.pack(fill="x", pady=(0, 10))
            badge.pack_propagate(False)
            ctk.CTkLabel(
                badge,
                text="[!] Active Blueprint logic is applied. Switch to Blueprint for full editing.",
                font=Theme.font(11, "bold"), text_color="#F59E0B",
            ).pack(padx=12, pady=8, anchor="w")

        ctk.CTkLabel(content, text="Main Content", font=Theme.font(14, "bold"), text_color=Theme.TEXT_MAIN).pack(anchor="w")
        ctk.CTkLabel(content, text="Type your replacement text below. Use Quick Add to insert variables.", font=Theme.font(11), text_color=Theme.TEXT_MUTED).pack(anchor="w", pady=(0, 8))

        self.quick_text = ctk.CTkTextbox(content, height=160, font=ctk.CTkFont(family="Consolas", size=13),
                                         fg_color="#111113", text_color="#E1E1E6", corner_radius=8,
                                         border_width=1, border_color=Theme.BG_BORDER)
        self.quick_text.pack(fill="x", pady=(0, 10))

        if qv["text"]:
            self.quick_text.insert("1.0", qv["text"])
        self.quick_text.bind("<KeyRelease>", lambda e: self._on_any_change())

        # -- Quick Add bar --
        add_bar = ctk.CTkFrame(content, fg_color="transparent")
        add_bar.pack(fill="x", pady=(0, 15))
        ctk.CTkLabel(add_bar, text="Quick Add:", font=Theme.font(12, "bold"), text_color=Theme.TEXT_MUTED).pack(side="left", padx=(0, 10))

        for ext_type, ext in QUICK_EXTENSIONS.items():
            btn = ctk.CTkButton(
                add_bar, text=f"{ext['icon']} {ext['label']}",
                width=90, height=30, font=Theme.font(11),
                fg_color=Theme.BG_CARD, hover_color=Theme.BG_CARD_HOVER,
                text_color=Theme.TEXT_MAIN, corner_radius=6,
                command=lambda t=ext_type: self._quick_add_extension(t),
            )
            btn.pack(side="left", padx=3)

        # -- Extension cards area --
        ctk.CTkFrame(content, height=1, fg_color=Theme.BG_BORDER).pack(fill="x", pady=(0, 10))

        self.ext_cards_frame = ctk.CTkScrollableFrame(content, fg_color="transparent", height=120)
        self.ext_cards_frame.pack(fill="x")
        self._render_ext_cards()

        # -- Upgrade button --
        upgrade_frame = ctk.CTkFrame(content, fg_color="transparent")
        upgrade_frame.pack(fill="x", pady=(15, 0))
        ctk.CTkButton(
            upgrade_frame, text="  Upgrade to Blueprint ->",
            image=IconFactory.wrench_icon(16),
            height=36, font=Theme.font(12, "bold"),
            fg_color="#2D2D30", hover_color=Theme.BG_CARD_HOVER,
            text_color=Theme.ACCENT, corner_radius=8,
            command=self._upgrade_to_blueprint,
        ).pack(side="right")

        self._on_any_change()

    def _quick_add_extension(self, ext_type):
        ext = QUICK_EXTENSIONS[ext_type]
        try:
            cursor_pos = self.quick_text.index("insert")
        except Exception:
            cursor_pos = "end"
        self.quick_text.insert(cursor_pos, ext["placeholder"])

        if ext_type != "clipboard":
            self._quick_extensions.append({"type": ext_type, "param": ext["default"]})
            self._render_ext_cards()

        self._on_any_change()

    def _render_ext_cards(self):
        for w in self.ext_cards_frame.winfo_children():
            w.destroy()

        if not self._quick_extensions:
            ctk.CTkLabel(self.ext_cards_frame, text="No extensions added yet. Click an icon above to insert a variable.",
                         font=Theme.font(11), text_color="#555").pack(pady=10)
            return

        for idx, ext_data in enumerate(self._quick_extensions):
            ext_def = QUICK_EXTENSIONS.get(ext_data["type"], {})
            accent = NODE_REGISTRY.get(ext_data["type"], {}).get("accent", Theme.ACCENT)

            card = ctk.CTkFrame(self.ext_cards_frame, fg_color=Theme.BG_CARD, corner_radius=8, height=48)
            card.pack(fill="x", pady=3)
            card.pack_propagate(False)

            ctk.CTkLabel(card, text=ext_def.get("icon", "[*]"), font=Theme.font(14)).pack(side="left", padx=(10, 5))
            ctk.CTkLabel(card, text=ext_def.get("label", ext_data["type"]).upper(),
                         font=Theme.font(11, "bold"), text_color=accent, width=60).pack(side="left", padx=(0, 10))

            if ext_def.get("param_label"):
                ctk.CTkLabel(card, text=ext_def["param_label"] + ":", font=Theme.font(10), text_color=Theme.TEXT_MUTED).pack(side="left", padx=(0, 5))
                param_var = tk.StringVar(value=ext_data["param"])

                def on_param_change(idx_=idx):
                    def inner(*_):
                        self._quick_extensions[idx_]["param"] = param_var.get()
                        self._on_any_change()
                    return inner
                param_var.trace_add("write", on_param_change(idx))
                ctk.CTkEntry(card, textvariable=param_var, width=150, height=28, corner_radius=4, fg_color="#111113").pack(side="left", padx=5)

            ctk.CTkButton(card, text="x", width=28, height=28, fg_color="transparent",
                          hover_color="#7F1D1D", text_color=Theme.TEXT_MUTED, corner_radius=4,
                          command=lambda i=idx: self._remove_ext(i)).pack(side="right", padx=8)

    def _remove_ext(self, idx):
        if idx < len(self._quick_extensions):
            del self._quick_extensions[idx]
            self._render_ext_cards()
            self._on_any_change()

    # -- Quick Mode Compiler -----------------------------------------------
    def _compile_quick_mode(self):
        trigger = self.trigger_var.get().strip()
        if not trigger:
            return None

        text = self.quick_text.get("1.0", "end-1c").strip()
        if not text:
            return None

        match_obj = {"trigger": trigger, "replace": text}
        vars_list = []
        type_counts = {}

        for ext in self._quick_extensions:
            etype = ext["type"]
            type_counts[etype] = type_counts.get(etype, 0) + 1
            suffix = f"_{type_counts[etype]}" if type_counts[etype] > 1 else ""
            var_name = f"{etype}{suffix}"

            v = {"name": var_name}

            if etype == "date":
                v["type"] = "date"
                v["params"] = {"format": ext["param"] or "%Y-%m-%d"}
            elif etype == "shell":
                v["type"] = "shell"
                v["params"] = {"cmd": ext["param"] or "echo hello"}
            elif etype == "form":
                v["type"] = "form"
                field = ext["param"] or "field"
                v["params"] = {"layout": f"{field}: [[{field}]]"}
            elif etype == "random":
                v["type"] = "random"
                choices = [c.strip() for c in ext["param"].split(";") if c.strip()]
                if not choices:
                    choices = ["option1", "option2"]
                v["params"] = {"choices": choices}

            vars_list.append(v)

        if vars_list:
            match_obj["vars"] = vars_list

        return match_obj

    # ----------------------------------------------------------------------
    #  BLUEPRINT MODE (Node Editor)
    # ----------------------------------------------------------------------
    def _build_blueprint_mode(self):
        for w in self.constructor_body.winfo_children():
            w.destroy()

        content_frame = ctk.CTkFrame(self.constructor_body, fg_color="transparent")
        content_frame.pack(fill="both", expand=True)

        # -- TOOLS (LEFT) --
        self.tools_width = 170
        tools_frame = ctk.CTkFrame(content_frame, width=self.tools_width, fg_color="#151517", corner_radius=Theme.RADIUS_LARGE)
        tools_frame.pack(side="left", fill="y")
        tools_frame.pack_propagate(False)

        tools_header = ctk.CTkFrame(tools_frame, fg_color="transparent")
        tools_header.pack(fill="x", padx=10, pady=10)
        tools_lbl = ctk.CTkLabel(tools_header, text="Nodes", font=Theme.font(14, "bold"))
        tools_lbl.pack(side="left")

        tools_content = ctk.CTkFrame(tools_frame, fg_color="transparent")
        tools_content.pack(fill="both", expand=True)

        node_scroll = ctk.CTkScrollableFrame(tools_content, fg_color="transparent")
        node_scroll.pack(fill="both", expand=True, padx=5, pady=5)

        def add_node(ntype):
            self.canvas.add_node(ntype, 350, 280)

        for ntype, reg in NODE_REGISTRY.items():
            ctk.CTkButton(
                node_scroll, text=f"[{reg['icon']}] {reg['title']}",
                width=140, height=32, fg_color=Theme.BG_CARD, hover_color=Theme.BG_CARD_HOVER,
                text_color=Theme.TEXT_MAIN, anchor="w", font=Theme.font(11), corner_radius=6,
                command=lambda t=ntype: add_node(t),
            ).pack(pady=3, padx=8, fill="x")

        # Collapse left
        self.left_collapsed = False

        def toggle_left():
            if self.left_collapsed:
                tools_frame.configure(width=self.tools_width)
                tools_content.pack(fill="both", expand=True)
                tools_lbl.pack(side="left")
                btn_col.configure(image=IconFactory.chevron_left(14))
            else:
                tools_content.pack_forget()
                tools_lbl.pack_forget()
                tools_frame.configure(width=36)
                btn_col.configure(image=IconFactory.chevron_right(14))
            self.left_collapsed = not self.left_collapsed

        btn_col = ctk.CTkButton(tools_header, image=IconFactory.chevron_left(14), text="",
                                width=20, height=20, fg_color="transparent",
                                hover_color=Theme.BG_BORDER, command=toggle_left)
        btn_col.pack(side="right")

        # Splitter left
        sp_left = ctk.CTkFrame(content_frame, width=6, fg_color="transparent", cursor="sb_h_double_arrow", corner_radius=0)
        sp_left.pack(side="left", fill="y", padx=2)
        sp_left.bind("<B1-Motion>", lambda e: (
            None if self.left_collapsed else tools_frame.configure(
                width=max(50, min(300, e.x_root - content_frame.winfo_rootx()))
            )
        ))

        # -- PROPERTIES (RIGHT) --
        self.prop_width = 260
        prop_frame = ctk.CTkFrame(content_frame, width=self.prop_width, fg_color="#151517", corner_radius=Theme.RADIUS_LARGE)
        prop_frame.pack(side="right", fill="y")
        prop_frame.pack_propagate(False)

        prop_header = ctk.CTkFrame(prop_frame, fg_color="transparent")
        prop_header.pack(fill="x", padx=10, pady=10)

        btn_col_r = ctk.CTkButton(prop_header, image=IconFactory.chevron_right(14), text="",
                                   width=20, height=20, fg_color="transparent",
                                   hover_color=Theme.BG_BORDER)
        btn_col_r.pack(side="left")
        prop_lbl = ctk.CTkLabel(prop_header, text="Properties", font=Theme.font(14, "bold"))
        prop_lbl.pack(side="right")

        self.prop_container = ctk.CTkScrollableFrame(prop_frame, fg_color="transparent")
        self.prop_container.pack(fill="both", expand=True, padx=10)

        self.right_collapsed = False

        def toggle_right():
            if self.right_collapsed:
                prop_frame.configure(width=self.prop_width)
                self.prop_container.pack(fill="both", expand=True, padx=10)
                prop_lbl.pack(side="right")
                btn_col_r.configure(image=IconFactory.chevron_right(14))
            else:
                self.prop_container.pack_forget()
                prop_lbl.pack_forget()
                prop_frame.configure(width=36)
                btn_col_r.configure(image=IconFactory.chevron_left(14))
            self.right_collapsed = not self.right_collapsed
        btn_col_r.configure(command=toggle_right)

        # Splitter right
        sp_right = ctk.CTkFrame(content_frame, width=6, fg_color="transparent", cursor="sb_h_double_arrow", corner_radius=0)
        sp_right.pack(side="right", fill="y", padx=2)
        sp_right.bind("<B1-Motion>", lambda e: (
            None if self.right_collapsed else prop_frame.configure(
                width=max(100, min(500, content_frame.winfo_rootx() + content_frame.winfo_width() - e.x_root))
            )
        ))

        # -- CANVAS (CENTER) --
        canvas_frame = ctk.CTkFrame(content_frame, fg_color=Theme.BG_ROOT, corner_radius=Theme.RADIUS_LARGE)
        canvas_frame.pack(side="left", fill="both", expand=True)

        self.canvas = NodeCanvas(canvas_frame, self._on_canvas_change,
                                  save_callback=self._save_and_restart)
        self.canvas.pack(fill="both", expand=True)

        # -- Populate from orchestrator --
        bp = self.orchestrator.to_blueprint_data()
        if bp["nodes"]:
            self._restore_canvas_from_data(bp)
        else:
            self.canvas.add_node("text", 450, 280)

        self._on_any_change()

    def _restore_canvas_from_data(self, bp_data: dict):
        """Recreate canvas nodes & edges from orchestrator data."""
        id_remap = {}
        for nd in bp_data["nodes"]:
            node = self.canvas.add_node(
                nd["type"],
                nd.get("x", 350),
                nd.get("y", 280),
            )
            if node:
                node.set_value(nd.get("value", ""))
                id_remap[nd["id"]] = node

        for edge in bp_data["edges"]:
            src_node = id_remap.get(edge["src"])
            tgt_node = id_remap.get(edge["tgt"])
            if src_node and tgt_node:
                self.canvas.edges.append({
                    "src": src_node.id,
                    "tgt": tgt_node.id,
                    "tgt_input": edge["tgt_input"],
                })
        self.canvas.draw_edges()

    # -- Properties update (Blueprint) -------------------------------------
    def _on_canvas_change(self):
        for w in self.prop_container.winfo_children():
            w.destroy()

        selected = self.canvas.get_selected()
        if selected:
            reg = NODE_REGISTRY.get(selected.type, {})

            badge = ctk.CTkFrame(self.prop_container, fg_color=reg.get("accent", Theme.ACCENT), corner_radius=6, height=28)
            badge.pack(fill="x", pady=(5, 10))
            ctk.CTkLabel(badge, text=f"[{reg.get('icon', '')}] {selected.type.upper()}",
                         font=Theme.font(11, "bold"), text_color="#FFF").pack(padx=10, pady=4)

            ctk.CTkLabel(self.prop_container, text=reg.get("description", ""),
                         font=Theme.font(11), text_color=Theme.TEXT_MUTED, wraplength=220).pack(anchor="w", pady=(0, 10))

            if selected.type in ("text", "shell"):
                ctk.CTkLabel(self.prop_container, text="Value:", font=Theme.font(12, "bold")).pack(anchor="w")
                tb = ctk.CTkTextbox(self.prop_container, height=120, font=ctk.CTkFont(family="Consolas", size=11),
                                    fg_color="#111113", corner_radius=6)
                tb.pack(fill="x", pady=5)
                tb.insert("1.0", selected.value)
                tb.bind("<KeyRelease>", lambda e: (
                    self.after(50, lambda: selected.set_value(tb.get("1.0", "end-1c"))),
                    self.after(60, self._on_any_change),
                ))

            elif selected.type == "script":
                ctk.CTkLabel(self.prop_container, text="Python Code:", font=Theme.font(12, "bold")).pack(anchor="w")
                tb = ctk.CTkTextbox(self.prop_container, height=160, font=ctk.CTkFont(family="Consolas", size=11),
                                    fg_color="#111113", corner_radius=6)
                tb.pack(fill="x", pady=5)
                tb.insert("1.0", selected.value)
                tb.bind("<KeyRelease>", lambda e: (
                    self.after(50, lambda: selected.set_value(tb.get("1.0", "end-1c"))),
                    self.after(60, self._on_any_change),
                ))

            elif selected.type == "date":
                ctk.CTkLabel(self.prop_container, text="Format:", font=Theme.font(12, "bold")).pack(anchor="w")
                var = tk.StringVar(value=selected.value)
                var.trace_add("write", lambda *_: (selected.set_value(var.get()), self._on_any_change()))
                ctk.CTkEntry(self.prop_container, textvariable=var, corner_radius=6).pack(fill="x", pady=5)

            elif selected.type == "form":
                ctk.CTkLabel(self.prop_container, text="Field Name:", font=Theme.font(12, "bold")).pack(anchor="w")
                var = tk.StringVar(value=selected.value)
                var.trace_add("write", lambda *_: (selected.set_value(var.get()), self._on_any_change()))
                ctk.CTkEntry(self.prop_container, textvariable=var, corner_radius=6).pack(fill="x", pady=5)

            elif selected.type == "random":
                ctk.CTkLabel(self.prop_container, text="Choices (;):", font=Theme.font(12, "bold")).pack(anchor="w")
                tb = ctk.CTkTextbox(self.prop_container, height=100, font=ctk.CTkFont(family="Consolas", size=11),
                                    fg_color="#111113", corner_radius=6)
                tb.pack(fill="x", pady=5)
                tb.insert("1.0", selected.value)
                tb.bind("<KeyRelease>", lambda e: (
                    self.after(50, lambda: selected.set_value(tb.get("1.0", "end-1c"))),
                    self.after(60, self._on_any_change),
                ))

            elif selected.type == "clipboard":
                ctk.CTkLabel(self.prop_container, text="Inserts clipboard content.",
                             font=Theme.font(11), text_color=Theme.TEXT_MUTED).pack(anchor="w", pady=10)

            elif selected.type == "concat":
                ctk.CTkLabel(self.prop_container, text="Connect nodes to\nin1, in2, in3 inputs.",
                             font=Theme.font(11), text_color=Theme.TEXT_MUTED).pack(anchor="w", pady=10)

            ctk.CTkButton(self.prop_container, text="Delete Node",
                          image=IconFactory.delete_icon(14),
                          fg_color="#7F1D1D", hover_color="#991B1B", corner_radius=6,
                          command=self.canvas.delete_selected).pack(fill="x", pady=(20, 5))
        else:
            ctk.CTkLabel(self.prop_container, text="Select a node\nto edit properties.",
                         text_color=Theme.TEXT_MUTED, font=Theme.font(12)).pack(pady=40)

        self._on_any_change()

    # ======================================================================
    #  UPGRADE TO BLUEPRINT (Mapper via Orchestrator)
    # ======================================================================
    def _upgrade_to_blueprint(self):
        trigger = self.trigger_var.get().strip()
        text = self.quick_text.get("1.0", "end-1c").strip()
        self.orchestrator.update_from_quick(trigger, text, self._quick_extensions)

        self._current_mode = "blueprint"
        self.seg_btn.set("Blueprint Mode")
        self._build_blueprint_mode()

    # ======================================================================
    #  UNIFIED CHANGE HANDLER & SAVE
    # ======================================================================
    def _on_any_change(self, *_):
        trigger = self.trigger_var.get().strip()
        if not trigger:
            self.update_preview(None)
            self._set_preview_error("Enter a trigger keyword")
            return

        if self._current_mode == "quick":
            match_obj = self._compile_quick_mode()
            if match_obj:
                self.update_preview(match_obj)
            else:
                self.update_preview(None)
        else:
            if not hasattr(self, "canvas") or not self.canvas:
                return
            graph_data = self.canvas.get_graph_data()
            if not graph_data["nodes"]:
                self.update_preview(None)
                return
            try:
                compiled = NodeGraphCompiler.compile(graph_data["nodes"], graph_data["edges"], trigger)
                self.update_preview(compiled)
            except NodeCompilerError as e:
                self.update_preview(None)
                self._set_preview_error(f"Compile error:\n{str(e)}")

    def _save_current(self):
        trigger = self.trigger_var.get().strip()

        if self._current_mode == "quick":
            match_obj = self._compile_quick_mode()
            if not match_obj:
                self.show_toast("Error", "Fill in trigger and content", icon="cancel")
                return
        else:
            if not hasattr(self, "canvas") or not self.canvas:
                return
            graph_data = self.canvas.get_graph_data()
            try:
                match_obj = NodeGraphCompiler.compile(graph_data["nodes"], graph_data["edges"], trigger)
            except NodeCompilerError as e:
                self.show_toast("Compilation Error", str(e), icon="cancel")
                return

        if getattr(self, "edit_index", None) is not None:
            self.matches[self.edit_index] = match_obj
        else:
            self.matches.append(match_obj)

        self._save_state()
        self.show_toast("Success", "Macro saved!", icon="check")
        self.load_dashboard()

    def _save_and_restart(self):
        """Ctrl+S callback: save current macro then restart Espanso."""
        self._save_current()
        self.apply_restart()


if __name__ == "__main__":
    app = FluentStudioApp()
    app.mainloop()
