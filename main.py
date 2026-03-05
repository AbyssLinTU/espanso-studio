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
    pass

from ruamel.yaml import YAML
from node_editor import NodeCanvas, NODE_REGISTRY
from engine.compiler import NodeGraphCompiler, NodeCompilerError
from engine.file_manager import EspansoManager
from styles.theme import Theme


# ─────────────────────────────────────────────────────────────────────────────
#  UI: MATCH CARD
# ─────────────────────────────────────────────────────────────────────────────
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

        btn_cfg = dict(width=30, height=30, fg_color="transparent", corner_radius=Theme.RADIUS_SMALL)
        edit_btn = ctk.CTkButton(action_frame, text="✏️", hover_color=Theme.ACCENT, **btn_cfg, command=lambda: on_edit(index))
        edit_btn.pack(side="left", padx=2)
        del_btn = ctk.CTkButton(action_frame, text="🗑", hover_color="#8B0000", **btn_cfg, command=lambda: on_delete(index))
        del_btn.pack(side="left", padx=2)

    def _on_hover_in(self, event=None):
        self.configure(fg_color=Theme.BG_CARD_HOVER)

    def _on_hover_out(self, event=None):
        self.configure(fg_color=Theme.BG_CARD)

    def _trigger_click(self, event=None):
        self.on_click(self.index)


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN APPLICATION
# ─────────────────────────────────────────────────────────────────────────────
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
        self._build_layout()
        self.load_dashboard()

    def show_toast(self, title, message, icon="info"):
        if "CTkMessagebox" in globals():
            CTkMessagebox(title=title, message=message, icon=icon, fade_in_duration=2)
        else:
            messagebox.showinfo(title, message)

    def _build_layout(self):
        # Sidebar
        self.sidebar = ctk.CTkFrame(self, width=60, fg_color=Theme.BG_SIDEBAR, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        ctk.CTkLabel(self.sidebar, text="E⚡", font=Theme.font(20, "bold"), text_color=Theme.ACCENT).pack(pady=20)

        nav_cfg = dict(width=40, height=40, hover_color=Theme.BG_CARD_HOVER, fg_color="transparent", font=Theme.font(18))
        ctk.CTkButton(self.sidebar, text="🏠", command=self.load_dashboard, **nav_cfg).pack(pady=10)
        ctk.CTkButton(self.sidebar, text="➕", command=self.open_constructor, **nav_cfg).pack(pady=10)
        ctk.CTkButton(self.sidebar, text="🔄", command=self.apply_restart, **nav_cfg).pack(side="bottom", pady=20)

        # Main Content
        self.main_container = ctk.CTkFrame(self, fg_color=Theme.BG_MAIN, corner_radius=Theme.RADIUS_LARGE)
        self.main_container.pack(side="left", fill="both", expand=True, padx=15, pady=15)

        # Live Preview
        self.preview_panel = ctk.CTkFrame(self, width=320, fg_color=Theme.BG_SIDEBAR, corner_radius=Theme.RADIUS_LARGE)
        self.preview_panel.pack(side="right", fill="y", padx=(0, 15), pady=15)
        self.preview_panel.pack_propagate(False)

        ctk.CTkLabel(self.preview_panel, text="👁 Live YAML Preview", font=Theme.font(14, "bold"), text_color=Theme.TEXT_MUTED).pack(pady=(20, 10))

        self.preview_box = ctk.CTkTextbox(self.preview_panel, font=ctk.CTkFont(family="Consolas", size=12), fg_color="#111113", text_color="#A8B2D1", corner_radius=8)
        self.preview_box.pack(fill="both", expand=True, padx=15, pady=(0, 20))
        self.preview_box.configure(state="disabled")

    def _clear_main(self):
        for widget in self.main_container.winfo_children():
            widget.destroy()

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

    # ── DASHBOARD ─────────────────────────────────────────────────────────
    def load_dashboard(self):
        self._clear_main()
        self.update_preview(None)

        topbar = ctk.CTkFrame(self.main_container, fg_color="transparent")
        topbar.pack(fill="x", padx=20, pady=20)

        ctk.CTkLabel(topbar, text="My Matches", font=Theme.font(24, "bold")).pack(side="left")

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self._filter_cards)
        search_entry = ctk.CTkEntry(topbar, textvariable=self.search_var, placeholder_text="🔍 Search triggers...", width=200, corner_radius=Theme.RADIUS_SMALL, height=35)
        search_entry.pack(side="right")

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
                MatchCard(self.cards_scroll, match, index=i, on_click=self._on_card_click, on_delete=self._on_card_delete, on_edit=self._on_card_edit).pack(fill="x", pady=6)
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

    # ── CONSTRUCTOR (NODE EDITOR) ─────────────────────────────────────────
    def open_constructor(self, edit_index=None):
        self._clear_main()
        self.update_preview(None)
        self.edit_index = edit_index

        # Top bar
        topbar = ctk.CTkFrame(self.main_container, fg_color="transparent")
        topbar.pack(fill="x", padx=20, pady=10)

        title_text = "Edit Blueprint" if edit_index is not None else "Create Macro Blueprint"
        ctk.CTkLabel(topbar, text=title_text, font=Theme.font(22, "bold"), text_color=Theme.TEXT_MAIN).pack(side="left")

        btn_save = ctk.CTkButton(topbar, text="💾 Save Blueprint", height=35, font=Theme.font(13, "bold"), fg_color=Theme.ACCENT, hover_color=Theme.ACCENT_HOVER, corner_radius=Theme.RADIUS_SMALL, command=self._save_new_match)
        btn_save.pack(side="right")

        # Content: Tools | Canvas | Properties
        content_frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        content_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))

        # ── TOOLS (LEFT) ──────────────────────────────────────────────────
        self.tools_width = 170
        tools_frame = ctk.CTkFrame(content_frame, width=self.tools_width, fg_color="#151517", corner_radius=Theme.RADIUS_LARGE)
        tools_frame.pack(side="left", fill="y", padx=0)
        tools_frame.pack_propagate(False)

        tools_header = ctk.CTkFrame(tools_frame, fg_color="transparent")
        tools_header.pack(fill="x", padx=10, pady=10)
        tools_lbl = ctk.CTkLabel(tools_header, text="Nodes", font=Theme.font(14, "bold"))
        tools_lbl.pack(side="left")

        tools_content = ctk.CTkFrame(tools_frame, fg_color="transparent")
        tools_content.pack(fill="both", expand=True)

        # Scrollable node list — generated from NODE_REGISTRY
        node_scroll = ctk.CTkScrollableFrame(tools_content, fg_color="transparent")
        node_scroll.pack(fill="both", expand=True, padx=5, pady=5)

        def add_node(ntype):
            self.canvas.add_node(ntype, 350, 280)

        for ntype, reg in NODE_REGISTRY.items():
            btn = ctk.CTkButton(
                node_scroll,
                text=f"{reg['icon']} {reg['title']}",
                width=140, height=32,
                fg_color=Theme.BG_CARD, hover_color=Theme.BG_CARD_HOVER,
                text_color=Theme.TEXT_MAIN, anchor="w",
                font=Theme.font(11),
                corner_radius=6,
                command=lambda t=ntype: add_node(t),
            )
            btn.pack(pady=3, padx=8, fill="x")

        # Separator
        ctk.CTkFrame(tools_content, height=1, fg_color=Theme.BG_BORDER).pack(fill="x", padx=15, pady=10)

        ctk.CTkLabel(tools_content, text="Trigger Keyword", font=Theme.font(12, "bold"), text_color=Theme.TEXT_MUTED).pack(padx=15, anchor="w")
        self.trigger_var = tk.StringVar(value=":hw")
        self.trigger_var.trace_add("write", lambda *_: self._live_preview_update())
        ctk.CTkEntry(tools_content, textvariable=self.trigger_var, width=130, corner_radius=6).pack(padx=15, pady=(5, 15))

        # Collapse toggle
        self.left_collapsed = False

        def toggle_left():
            if self.left_collapsed:
                tools_frame.configure(width=self.tools_width)
                tools_content.pack(fill="both", expand=True)
                tools_lbl.pack(side="left")
                btn_col_left.configure(text="‹")
            else:
                tools_content.pack_forget()
                tools_lbl.pack_forget()
                tools_frame.configure(width=36)
                btn_col_left.configure(text="›")
            self.left_collapsed = not self.left_collapsed

        btn_col_left = ctk.CTkButton(tools_header, text="‹", width=20, height=20, fg_color="transparent", hover_color=Theme.BG_BORDER, command=toggle_left, font=Theme.font(14))
        btn_col_left.pack(side="right")

        # Splitter left
        splitter_left = ctk.CTkFrame(content_frame, width=6, fg_color="transparent", cursor="sb_h_double_arrow", corner_radius=0)
        splitter_left.pack(side="left", fill="y", padx=2)

        def drag_left(e):
            if self.left_collapsed:
                return
            new_w = max(50, min(300, e.x_root - content_frame.winfo_rootx()))
            self.tools_width = new_w
            tools_frame.configure(width=new_w)
        splitter_left.bind("<B1-Motion>", drag_left)

        # ── PROPERTIES (RIGHT) ───────────────────────────────────────────
        self.prop_width = 260
        prop_frame = ctk.CTkFrame(content_frame, width=self.prop_width, fg_color="#151517", corner_radius=Theme.RADIUS_LARGE)
        prop_frame.pack(side="right", fill="y", padx=0)
        prop_frame.pack_propagate(False)

        prop_header = ctk.CTkFrame(prop_frame, fg_color="transparent")
        prop_header.pack(fill="x", padx=10, pady=10)
        btn_col_right = ctk.CTkButton(prop_header, text="›", width=20, height=20, fg_color="transparent", hover_color=Theme.BG_BORDER, font=Theme.font(14))
        btn_col_right.pack(side="left")
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
                btn_col_right.configure(text="›")
            else:
                self.prop_container.pack_forget()
                prop_lbl.pack_forget()
                prop_frame.configure(width=36)
                btn_col_right.configure(text="‹")
            self.right_collapsed = not self.right_collapsed
        btn_col_right.configure(command=toggle_right)

        # Splitter right
        splitter_right = ctk.CTkFrame(content_frame, width=6, fg_color="transparent", cursor="sb_h_double_arrow", corner_radius=0)
        splitter_right.pack(side="right", fill="y", padx=2)

        def drag_right(e):
            if self.right_collapsed:
                return
            max_x = content_frame.winfo_rootx() + content_frame.winfo_width()
            new_w = max(100, min(500, max_x - e.x_root))
            self.prop_width = new_w
            prop_frame.configure(width=new_w)
        splitter_right.bind("<B1-Motion>", drag_right)

        # ── CANVAS (CENTER) ──────────────────────────────────────────────
        canvas_frame = ctk.CTkFrame(content_frame, fg_color=Theme.BG_ROOT, corner_radius=Theme.RADIUS_LARGE)
        canvas_frame.pack(side="left", fill="both", expand=True)

        self.canvas = NodeCanvas(canvas_frame, self._on_canvas_change)
        self.canvas.pack(fill="both", expand=True)

        if edit_index is None:
            self.canvas.add_node("text", 450, 280)

    # ── Properties update ─────────────────────────────────────────────────
    def _on_canvas_change(self):
        for widget in self.prop_container.winfo_children():
            widget.destroy()

        selected = self.canvas.get_selected()
        if selected:
            reg = NODE_REGISTRY.get(selected.type, {})

            # Type badge
            type_frame = ctk.CTkFrame(self.prop_container, fg_color=reg.get("accent", Theme.ACCENT), corner_radius=6, height=28)
            type_frame.pack(fill="x", pady=(5, 10))
            ctk.CTkLabel(type_frame, text=f"{reg.get('icon', '')} {selected.type.upper()}", font=Theme.font(11, "bold"), text_color="#FFFFFF").pack(padx=10, pady=4)

            # Description
            ctk.CTkLabel(self.prop_container, text=reg.get("description", ""), font=Theme.font(11), text_color=Theme.TEXT_MUTED, wraplength=220).pack(anchor="w", pady=(0, 10))

            # Value editor — varies by type
            if selected.type in ("text", "shell"):
                ctk.CTkLabel(self.prop_container, text="Value:", font=Theme.font(12, "bold")).pack(anchor="w")
                tb = ctk.CTkTextbox(self.prop_container, height=120, font=ctk.CTkFont(family="Consolas", size=11), fg_color="#111113", corner_radius=6)
                tb.pack(fill="x", pady=5)
                tb.insert("1.0", selected.value)

                def on_text_change(event):
                    self.after(50, lambda: selected.set_value(tb.get("1.0", "end-1c")))
                    self.after(60, self._live_preview_update)
                tb.bind("<KeyRelease>", on_text_change)

            elif selected.type == "script":
                ctk.CTkLabel(self.prop_container, text="Python Code:", font=Theme.font(12, "bold")).pack(anchor="w")
                tb = ctk.CTkTextbox(self.prop_container, height=160, font=ctk.CTkFont(family="Consolas", size=11), fg_color="#111113", corner_radius=6)
                tb.pack(fill="x", pady=5)
                tb.insert("1.0", selected.value)

                def on_script_change(event):
                    self.after(50, lambda: selected.set_value(tb.get("1.0", "end-1c")))
                    self.after(60, self._live_preview_update)
                tb.bind("<KeyRelease>", on_script_change)

            elif selected.type == "date":
                ctk.CTkLabel(self.prop_container, text="Format (strftime):", font=Theme.font(12, "bold")).pack(anchor="w")
                var = tk.StringVar(value=selected.value)

                def on_date_change(*_):
                    selected.set_value(var.get())
                    self._live_preview_update()
                var.trace_add("write", on_date_change)
                ctk.CTkEntry(self.prop_container, textvariable=var, corner_radius=6).pack(fill="x", pady=5)

            elif selected.type == "form":
                ctk.CTkLabel(self.prop_container, text="Field Name:", font=Theme.font(12, "bold")).pack(anchor="w")
                var = tk.StringVar(value=selected.value)

                def on_form_change(*_):
                    selected.set_value(var.get())
                    self._live_preview_update()
                var.trace_add("write", on_form_change)
                ctk.CTkEntry(self.prop_container, textvariable=var, corner_radius=6).pack(fill="x", pady=5)

            elif selected.type == "random":
                ctk.CTkLabel(self.prop_container, text="Choices (semicolon-separated):", font=Theme.font(12, "bold"), wraplength=200).pack(anchor="w")
                tb = ctk.CTkTextbox(self.prop_container, height=100, font=ctk.CTkFont(family="Consolas", size=11), fg_color="#111113", corner_radius=6)
                tb.pack(fill="x", pady=5)
                tb.insert("1.0", selected.value)

                def on_random_change(event):
                    self.after(50, lambda: selected.set_value(tb.get("1.0", "end-1c")))
                    self.after(60, self._live_preview_update)
                tb.bind("<KeyRelease>", on_random_change)

            elif selected.type == "clipboard":
                ctk.CTkLabel(self.prop_container, text="Inserts current clipboard\ncontent into the macro.", font=Theme.font(11), text_color=Theme.TEXT_MUTED, wraplength=200).pack(anchor="w", pady=10)

            elif selected.type == "concat":
                ctk.CTkLabel(self.prop_container, text="Connect multiple nodes\nto inputs in1, in2, in3.\nOutputs are merged in order.", font=Theme.font(11), text_color=Theme.TEXT_MUTED, wraplength=200).pack(anchor="w", pady=10)

            # Delete button
            del_btn = ctk.CTkButton(self.prop_container, text="🗑 Delete Node", fg_color="#7F1D1D", hover_color="#991B1B", corner_radius=6, command=self.canvas.delete_selected)
            del_btn.pack(fill="x", pady=(20, 5))
        else:
            ctk.CTkLabel(self.prop_container, text="Select a node\nto edit properties.", text_color=Theme.TEXT_MUTED, font=Theme.font(12)).pack(pady=40)

        self._live_preview_update()

    def _live_preview_update(self, *_):
        if not hasattr(self, "canvas") or not self.canvas:
            return

        graph_data = self.canvas.get_graph_data()
        trigger_cmd = self.trigger_var.get().strip()

        if not trigger_cmd:
            self.update_preview(None)
            self._set_preview_error("🔴 Enter a trigger keyword")
            return

        if not graph_data["nodes"]:
            self.update_preview(None)
            return

        try:
            compiled_match = NodeGraphCompiler.compile(graph_data["nodes"], graph_data["edges"], trigger_cmd)
            self.update_preview(compiled_match)
        except NodeCompilerError as e:
            self.update_preview(None)
            self._set_preview_error(f"🔴 Compile error:\n{str(e)}")

    def _set_preview_error(self, text):
        self.preview_box.configure(state="normal")
        self.preview_box.delete("1.0", "end")
        self.preview_box.insert("end", text)
        self.preview_box.configure(state="disabled")

    def _save_new_match(self):
        graph_data = self.canvas.get_graph_data()
        trigger_cmd = self.trigger_var.get().strip()

        try:
            match_obj = NodeGraphCompiler.compile(graph_data["nodes"], graph_data["edges"], trigger_cmd)

            if getattr(self, "edit_index", None) is not None:
                self.matches[self.edit_index] = match_obj
            else:
                self.matches.append(match_obj)

            self._save_state()
            self.show_toast("Success", "Blueprint compiled & saved!", icon="check")
            self.load_dashboard()
        except NodeCompilerError as e:
            self.show_toast("Compilation Error", str(e), icon="cancel")


if __name__ == "__main__":
    app = FluentStudioApp()
    app.mainloop()
