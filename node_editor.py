# -*- coding: utf-8 -*-
import uuid
import copy
import tkinter as tk

# ---------------------------------------------------------------------------
#  NODE TYPE REGISTRY - Plugin Architecture
#  All icon chars are safe ASCII / basic Latin that render in Segoe UI
# ---------------------------------------------------------------------------
NODE_REGISTRY = {
    "text": {
        "title": "Text Output",
        "icon": "T",
        "accent": "#5865F2",
        "inputs": ["in1"],
        "has_output": False,
        "default_value": "Hello World",
        "description": "Final text output node",
        "dynamic_inputs": True,          # allows unlimited connections
    },
    "date": {
        "title": "Date Gen",
        "icon": "D",
        "accent": "#10B981",
        "inputs": [],
        "has_output": True,
        "default_value": "%Y-%m-%d",
        "description": "Insert current date/time",
    },
    "shell": {
        "title": "Shell Cmd",
        "icon": "$",
        "accent": "#F59E0B",
        "inputs": ["in1"],
        "has_output": True,
        "default_value": "echo hello",
        "description": "Execute a shell command",
    },
    "form": {
        "title": "Form Input",
        "icon": "F",
        "accent": "#8B5CF6",
        "inputs": [],
        "has_output": True,
        "default_value": "field_name",
        "description": "User input field (form)",
    },
    "clipboard": {
        "title": "Clipboard",
        "icon": "C",
        "accent": "#06B6D4",
        "inputs": [],
        "has_output": True,
        "default_value": "",
        "description": "Paste from clipboard",
    },
    "random": {
        "title": "Random Pick",
        "icon": "?",
        "accent": "#EC4899",
        "inputs": [],
        "has_output": True,
        "default_value": "option1;option2;option3",
        "description": "Pick random from list",
    },
    "script": {
        "title": "Python Script",
        "icon": "#",
        "accent": "#F97316",
        "inputs": ["in1"],
        "has_output": True,
        "default_value": "print('hello')",
        "description": "Run Python code",
    },
    "concat": {
        "title": "Concat",
        "icon": "&",
        "accent": "#A855F7",
        "inputs": ["in1", "in2", "in3"],
        "has_output": True,
        "default_value": "",
        "description": "Merge multiple inputs",
        "dynamic_inputs": True,
    },
}


# ---------------------------------------------------------------------------
#  DRAGGABLE NODE - Visual representation on Canvas
# ---------------------------------------------------------------------------
class DraggableNode:
    HOVER_BORDER = "#4F46E5"        # accent highlight on hover
    NORMAL_BORDER = "#333338"
    BODY_COLOR = "#212124"

    def __init__(self, canvas, center_x, center_y, node_type, value=None, width=170, height=85):
        reg = NODE_REGISTRY[node_type]
        self.canvas = canvas
        self.id = str(uuid.uuid4())
        self.type = node_type
        self.title = reg["title"]
        self.icon_char = reg["icon"]
        self.accent = reg["accent"]
        self.width = width
        self.height = height
        self.dynamic_inputs = reg.get("dynamic_inputs", False)

        self.x = center_x - width // 2
        self.y = center_y - height // 2

        self.value = value if value is not None else reg["default_value"]

        # Build inputs from registry (mutable copy)
        self.inputs = [{"name": name, "y_rel": 0}
                       for name in reg["inputs"]]
        self._recalc_input_positions()
        self.output_y_rel = height // 2 if reg["has_output"] else None

        self._hovered = False
        self.ui_elements = []
        self.draw()

    # -- Dynamic multi-input management ------------------------------------
    def ensure_input(self, name):
        """Guarantee that input port *name* exists. Returns the input dict."""
        for inp in self.inputs:
            if inp["name"] == name:
                return inp
        new_inp = {"name": name, "y_rel": 0}
        self.inputs.append(new_inp)
        self._recalc_input_positions()
        self.draw()
        return new_inp

    def add_dynamic_input(self):
        """Append the next available 'inN' input port and redraw."""
        idx = len(self.inputs) + 1
        name = f"in{idx}"
        return self.ensure_input(name)

    def _recalc_input_positions(self):
        """Recompute y_rel for all inputs with even spacing."""
        n = len(self.inputs)
        for i, inp in enumerate(self.inputs):
            inp["y_rel"] = int(self.height * (i + 1) / (n + 1))

    # -- Hover state --------------------------------------------------------
    def set_hover(self, state: bool):
        if state != self._hovered:
            self._hovered = state
            self.draw()

    # -- Round-rect helper --------------------------------------------------
    def _create_round_poly(self, x1, y1, x2, y2, r, **kwargs):
        points = [
            x1 + r, y1, x1 + r, y1,
            x2 - r, y1, x2 - r, y1,
            x2, y1,
            x2, y1 + r, x2, y1 + r,
            x2, y2 - r, x2, y2 - r,
            x2, y2,
            x2 - r, y2, x2 - r, y2,
            x1 + r, y2, x1 + r, y2,
            x1, y2,
            x1, y2 - r, x1, y2 - r,
            x1, y1 + r, x1, y1 + r,
            x1, y1,
        ]
        return self.canvas.create_polygon(points, smooth=True, **kwargs)

    # -- Drawing ------------------------------------------------------------
    def draw(self):
        self.clear()

        border_color = self.HOVER_BORDER if self._hovered else self.NORMAL_BORDER
        border_w = 2 if self._hovered else 1

        # Shadow
        shadow = self._create_round_poly(
            self.x + 3, self.y + 5,
            self.x + self.width + 3, self.y + self.height + 5,
            r=14, fill="#040405", outline="", tags=(self.id, "node", "shadow"),
        )
        self.ui_elements.append(shadow)

        # Body
        body = self._create_round_poly(
            self.x, self.y,
            self.x + self.width, self.y + self.height,
            r=14, fill=self.BODY_COLOR, outline=border_color, width=border_w,
            tags=(self.id, "node", "bg"),
        )
        self.ui_elements.append(body)

        # Accent stripe
        stripe = self.canvas.create_line(
            self.x + 14, self.y + 3,
            self.x + self.width - 14, self.y + 3,
            fill=self.accent, width=3, capstyle="round",
            tags=(self.id, "node", "stripe"),
        )
        self.ui_elements.append(stripe)

        # Separator
        sep = self.canvas.create_line(
            self.x + 8, self.y + 32,
            self.x + self.width - 8, self.y + 32,
            fill="#333338", width=1,
            tags=(self.id, "node", "sep"),
        )
        self.ui_elements.append(sep)

        # Title
        title = self.canvas.create_text(
            self.x + 12, self.y + 17,
            text=f"[{self.icon_char}] {self.title}", anchor="w",
            fill="#E1E1E6", font=("Segoe UI", 10, "bold"),
            tags=(self.id, "node", "title"),
        )
        self.ui_elements.append(title)

        # Value preview
        val_txt = self.value if len(self.value) < 18 else self.value[:15] + "..."
        if self.type == "clipboard":
            val_txt = "{{clipboard}}"
        elif self.type == "concat":
            val_txt = "merge inputs ->"
        val = self.canvas.create_text(
            self.x + 12, self.y + 52,
            text=f'"{val_txt}"' if val_txt else '""', anchor="w",
            fill="#9CA3AF", font=("Segoe UI", 9),
            tags=(self.id, "node", "val"),
        )
        self.ui_elements.append(val)

        # Output socket
        if self.output_y_rel is not None:
            r = 6
            ox, oy = self.x + self.width, self.y + self.output_y_rel
            out_s = self.canvas.create_oval(
                ox - r, oy - r, ox + r, oy + r,
                fill=self.accent, outline="#E1E1E6", width=1,
                tags=(self.id, "socket", "out"),
            )
            self.ui_elements.append(out_s)

        # Input sockets (with label for multi-input)
        for inp in self.inputs:
            r = 6
            ix, iy = self.x, self.y + inp["y_rel"]
            in_s = self.canvas.create_oval(
                ix - r, iy - r, ix + r, iy + r,
                fill="#9CA3AF", outline="#E1E1E6", width=1,
                tags=(self.id, "socket", "in", inp["name"]),
            )
            self.ui_elements.append(in_s)

    def set_value(self, val):
        self.value = val
        self.draw()

    def clear(self):
        for item in self.ui_elements:
            self.canvas.delete(item)
        self.ui_elements = []

    def move(self, dx, dy):
        self.x += dx
        self.y += dy
        for item in self.ui_elements:
            self.canvas.move(item, dx, dy)

    def get_output_coords(self):
        if self.output_y_rel is None:
            return None
        return (self.x + self.width, self.y + self.output_y_rel)

    def get_input_coords(self, name):
        for inp in self.inputs:
            if inp["name"] == name:
                return (self.x, self.y + inp["y_rel"])
        return None

    def hit_test(self, cx, cy):
        """Return True if (cx, cy) is inside this node body."""
        return (self.x <= cx <= self.x + self.width and
                self.y <= cy <= self.y + self.height)

    def snapshot(self):
        """Lightweight dict for Undo/Redo state."""
        return {
            "id": self.id, "type": self.type, "value": self.value,
            "x": self.x, "y": self.y,
            "inputs": [dict(i) for i in self.inputs],
        }


# ---------------------------------------------------------------------------
#  UNDO / REDO MANAGER
# ---------------------------------------------------------------------------
class UndoManager:
    """Simple snapshot-based undo/redo for canvas state."""
    MAX = 50

    def __init__(self):
        self._undo_stack: list = []
        self._redo_stack: list = []

    def push(self, state: dict):
        self._undo_stack.append(copy.deepcopy(state))
        if len(self._undo_stack) > self.MAX:
            self._undo_stack.pop(0)
        self._redo_stack.clear()

    def undo(self):
        if not self._undo_stack:
            return None
        state = self._undo_stack.pop()
        return state

    def redo(self):
        if not self._redo_stack:
            return None
        state = self._redo_stack.pop()
        return state

    def mark_redo(self, state: dict):
        self._redo_stack.append(copy.deepcopy(state))

    @property
    def can_undo(self):
        return len(self._undo_stack) > 0

    @property
    def can_redo(self):
        return len(self._redo_stack) > 0


# ---------------------------------------------------------------------------
#  INTERACTION MANAGER - centralized keyboard & mouse input handler
# ---------------------------------------------------------------------------
class InteractionManager:
    """Handles all keyboard shortcuts and mouse interactions for NodeCanvas.

    Structure:
      - on_key_press()   : routes Delete/Backspace, Ctrl+S, Ctrl+D, Ctrl+Z/Y
      - on_motion()      : hover tracking for nodes
      - on_space_press/release() : Space+Drag panning toggle
    """

    def __init__(self, canvas: "NodeCanvas"):
        self.canvas = canvas
        self._space_held = False
        self._pan_mark = None

    def bind_all(self):
        """Set up all event bindings on the canvas."""
        c = self.canvas
        c.bind("<Motion>", self.on_motion)
        c.bind("<KeyPress>", self.on_key_press)
        c.bind("<KeyRelease>", self.on_key_release)
        # Make canvas focusable for keyboard events
        c.bind("<ButtonPress-1>", self._focus_and_press, add="+")
        c.configure(takefocus=True)

    def _focus_and_press(self, event):
        self.canvas.focus_set()

    # -- Hover tracking -----------------------------------------------------
    def on_motion(self, event):
        cx = self.canvas.canvasx(event.x)
        cy = self.canvas.canvasy(event.y)

        hovered_node = None
        for node in self.canvas.nodes:
            if node.hit_test(cx, cy):
                hovered_node = node
                break

        for node in self.canvas.nodes:
            node.set_hover(node is hovered_node)

        self.canvas._hovered_node = hovered_node

    # -- Keyboard dispatch --------------------------------------------------
    def on_key_press(self, event):
        ctrl = event.state & 0x4
        sym = event.keysym

        # Space+Drag panning
        if sym == "space" and not self._space_held:
            self._space_held = True
            self.canvas.configure(cursor="fleur")
            return

        # Delete / Backspace -> delete hovered or selected node
        if sym in ("Delete", "BackSpace"):
            target = getattr(self.canvas, "_hovered_node", None)
            if target:
                self.canvas._push_undo()
                self.canvas.delete_node_by_id(target.id)
            elif self.canvas.selected_node:
                self.canvas._push_undo()
                self.canvas.delete_selected()
            return

        if ctrl:
            key = sym.lower()
            # Ctrl+S -> save callback
            if key == "s":
                if self.canvas._save_callback:
                    self.canvas._save_callback()
                return "break"

            # Ctrl+D -> duplicate selected
            if key == "d":
                self.canvas.duplicate_selected()
                return "break"

            # Ctrl+Z -> undo
            if key == "z":
                self.canvas.perform_undo()
                return "break"

            # Ctrl+Y -> redo
            if key == "y":
                self.canvas.perform_redo()
                return "break"

    def on_key_release(self, event):
        if event.keysym == "space":
            self._space_held = False
            self.canvas.configure(cursor="")

    @property
    def panning(self):
        return self._space_held


# ---------------------------------------------------------------------------
#  NODE CANVAS - Infinite canvas with zoom, pan, context menu
# ---------------------------------------------------------------------------
class NodeCanvas(tk.Canvas):
    def __init__(self, master, on_change_callback, save_callback=None, **kwargs):
        super().__init__(master, bg="#0B0B0D", highlightthickness=0, **kwargs)
        self.on_change = on_change_callback
        self._save_callback = save_callback
        self.nodes: list[DraggableNode] = []
        self.edges: list[dict] = []

        self.drag_data = {"x": 0, "y": 0, "item": None, "type": None}
        self.connecting = {"src": None, "line": None}
        self.selected_node = None
        self._hovered_node = None

        self._zoom_level = 1.0
        self._undo_mgr = UndoManager()

        self._draw_grid()

        # Core mouse bindings
        self.bind("<ButtonPress-1>", self.on_press)
        self.bind("<B1-Motion>", self.on_drag)
        self.bind("<ButtonRelease-1>", self.on_release)
        self.bind("<ButtonPress-2>", self.on_pan_press)
        self.bind("<B2-Motion>", self.on_pan_drag)
        self.bind("<ButtonPress-3>", self.on_right_click)
        self.bind("<MouseWheel>", self.on_scroll)

        # Interaction Manager (hover, hotkeys)
        self._interaction = InteractionManager(self)
        self._interaction.bind_all()

    # -- Grid ---------------------------------------------------------------
    def _draw_grid(self, size=20):
        self.delete("grid")
        w, h = 2000, 2000
        for i in range(0, w, size):
            for j in range(0, h, size):
                self.create_rectangle(i, j, i + 1, j + 1, fill="#1A1A1E", outline="", tags="grid")
        self.tag_lower("grid")

    # -- Undo / Redo --------------------------------------------------------
    def _get_state(self):
        return {
            "nodes": [n.snapshot() for n in self.nodes],
            "edges": copy.deepcopy(self.edges),
            "selected": self.selected_node,
        }

    def _push_undo(self):
        self._undo_mgr.push(self._get_state())

    def _restore_state(self, state):
        """Rebuild entire canvas from a snapshot."""
        for n in self.nodes:
            n.clear()
        self.nodes.clear()
        self.edges = copy.deepcopy(state["edges"])
        self.selected_node = state.get("selected")

        for ns in state["nodes"]:
            n = DraggableNode(self, ns["x"] + 85, ns["y"] + 42, ns["type"],
                              value=ns["value"])
            n.id = ns["id"]
            n.inputs = [dict(i) for i in ns.get("inputs", [])]
            n._recalc_input_positions()
            n.draw()
            self.nodes.append(n)

        self.draw_edges()
        self.request_update()

    def perform_undo(self):
        current = self._get_state()
        prev = self._undo_mgr.undo()
        if prev is not None:
            self._undo_mgr.mark_redo(current)
            self._restore_state(prev)

    def perform_redo(self):
        current = self._get_state()
        next_s = self._undo_mgr.redo()
        if next_s is not None:
            self._undo_mgr.push(current)
            self._restore_state(next_s)

    # -- Node management ----------------------------------------------------
    def add_node(self, node_type, px=200, py=200):
        if node_type not in NODE_REGISTRY:
            return None
        self._push_undo()
        n = DraggableNode(self, px, py, node_type)
        self.nodes.append(n)
        self.request_update()
        return n

    def delete_node_by_id(self, node_id):
        """Delete a node and all connected edges by its id."""
        node = next((n for n in self.nodes if n.id == node_id), None)
        if node:
            node.clear()
        self.nodes = [n for n in self.nodes if n.id != node_id]
        self.edges = [e for e in self.edges
                      if e["src"] != node_id and e["tgt"] != node_id]
        if self.selected_node == node_id:
            self.selected_node = None
        if self._hovered_node and self._hovered_node.id == node_id:
            self._hovered_node = None
        self.draw_edges()
        self.request_update()

    def duplicate_selected(self):
        """Duplicate the selected node with a small offset."""
        sel = self.get_selected()
        if not sel:
            return
        self._push_undo()
        dup = DraggableNode(self, sel.x + sel.width + 30 + sel.width // 2,
                            sel.y + 20 + sel.height // 2,
                            sel.type, value=sel.value)
        self.nodes.append(dup)
        self.selected_node = dup.id
        self.request_update()

    # -- Context menu (right-click) -----------------------------------------
    def on_right_click(self, event):
        menu = tk.Menu(self, tearoff=0, bg="#212124", fg="#E1E1E6",
                       activebackground="#333338", activeforeground="#E1E1E6",
                       font=("Segoe UI", 10), relief="flat", bd=1)

        cx = self.canvasx(event.x)
        cy = self.canvasy(event.y)

        for ntype, reg in NODE_REGISTRY.items():
            menu.add_command(
                label=f"[{reg['icon']}] {reg['title']}",
                command=lambda t=ntype, x=cx, y=cy: self.add_node(t, x, y),
            )

        menu.tk_popup(event.x_root, event.y_root)

    # -- Zoom (Ctrl + Scroll) ----------------------------------------------
    def on_scroll(self, event):
        ctrl = event.state & 0x4
        if not ctrl:
            return

        cx = self.canvasx(event.x)
        cy = self.canvasy(event.y)

        factor = 1.1 if event.delta > 0 else 0.9
        new_zoom = self._zoom_level * factor
        if new_zoom < 0.3 or new_zoom > 3.0:
            return

        self._zoom_level = new_zoom
        self.scale("all", cx, cy, factor, factor)

    # -- Edge drawing (multi-input aware) -----------------------------------
    def draw_edges(self):
        self.delete("edge")
        for e in self.edges:
            src_node = next((n for n in self.nodes if n.id == e["src"]), None)
            tgt_node = next((n for n in self.nodes if n.id == e["tgt"]), None)
            if src_node and tgt_node:
                p1 = src_node.get_output_coords()
                p2 = tgt_node.get_input_coords(e["tgt_input"])
                if p1 and p2:
                    color = src_node.accent
                    self._draw_bezier(p1[0], p1[1], p2[0], p2[1], color, "edge")
        self.tag_lower("edge")
        self.tag_lower("grid")

    def _draw_bezier(self, x1, y1, x2, y2, color, tag):
        cx1 = x1 + abs(x2 - x1) * 0.5
        cy1 = y1
        cx2 = x2 - abs(x2 - x1) * 0.5
        cy2 = y2
        self.create_line(
            x1, y1, cx1, cy1, cx2, cy2, x2, y2,
            smooth=True, fill=color, width=2, tags=(tag,),
        )

    # -- Multi-input: find or create the target input port -------------------
    def _resolve_target_input(self, tgt_node, tgt_id, src_id):
        """For dynamic-input nodes, auto-create a new port if all existing
        ports are already occupied. Returns input name to use."""
        if not tgt_node.dynamic_inputs:
            # Fixed inputs: use first available
            occupied = {e["tgt_input"] for e in self.edges
                        if e["tgt"] == tgt_id and e["src"] != src_id}
            for inp in tgt_node.inputs:
                if inp["name"] not in occupied:
                    return inp["name"]
            return tgt_node.inputs[0]["name"] if tgt_node.inputs else "in1"

        # Dynamic inputs: check if we need a new port
        occupied = {e["tgt_input"] for e in self.edges
                    if e["tgt"] == tgt_id and e["src"] != src_id}
        for inp in tgt_node.inputs:
            if inp["name"] not in occupied:
                return inp["name"]
        # All occupied -> create new
        new_inp = tgt_node.add_dynamic_input()
        return new_inp["name"]

    # -- Mouse handlers -----------------------------------------------------
    def on_press(self, event):
        # Space+Click -> pan
        if self._interaction.panning:
            self.scan_mark(event.x, event.y)
            self.drag_data["type"] = "pan"
            return

        x, y = self.canvasx(event.x), self.canvasy(event.y)
        items = self.find_overlapping(x - 3, y - 3, x + 3, y + 3)
        if not items:
            self.selected_node = None
            self.on_change()
            return

        top_item = items[-1]
        tags = self.gettags(top_item)

        if "out" in tags:
            node_id = tags[0]
            node = next((n for n in self.nodes if n.id == node_id), None)
            if node:
                self.connecting["src"] = node_id
                px, py = node.get_output_coords()
                self.connecting["line"] = self.create_line(
                    px, py, px, py,
                    fill=node.accent, width=2, dash=(5, 3), tags="temp_edge",
                )

        elif "node" in tags:
            node_id = tags[0]
            if node_id != self.selected_node:
                self.selected_node = node_id
                self.on_change()

            self._push_undo()
            self.drag_data["item"] = node_id
            self.drag_data["type"] = "node"
            self.drag_data["x"] = x
            self.drag_data["y"] = y

    def on_drag(self, event):
        # Space+drag -> pan
        if self.drag_data.get("type") == "pan":
            self.scan_dragto(event.x, event.y, gain=1)
            return

        x, y = self.canvasx(event.x), self.canvasy(event.y)

        if self.connecting["src"]:
            node = next((n for n in self.nodes if n.id == self.connecting["src"]), None)
            if node:
                px, py = node.get_output_coords()
                self.coords(self.connecting["line"], px, py, x, y)

        elif self.drag_data["item"] and self.drag_data["type"] == "node":
            dx = x - self.drag_data["x"]
            dy = y - self.drag_data["y"]
            node = next((n for n in self.nodes if n.id == self.drag_data["item"]), None)
            if node:
                node.move(dx, dy)
                self.drag_data["x"] = x
                self.drag_data["y"] = y
                self.draw_edges()

    def on_release(self, event):
        if self.drag_data.get("type") == "pan":
            self.drag_data["type"] = None
            return

        if self.connecting["src"]:
            self._push_undo()
            x, y = self.canvasx(event.x), self.canvasy(event.y)

            # Find target: either an input socket or the body of a dynamic-input node
            items = self.find_overlapping(x - 8, y - 8, x + 8, y + 8)
            connected = False

            # Try input socket first
            for item in items:
                tags = self.gettags(item)
                if "in" in tags:
                    tgt_id = tags[0]
                    tgt_inp = tags[3]
                    if tgt_id != self.connecting["src"]:
                        # Remove existing edge on this exact port
                        self.edges = [e for e in self.edges
                                      if not (e["tgt"] == tgt_id and e["tgt_input"] == tgt_inp)]
                        self.edges.append({
                            "src": self.connecting["src"],
                            "tgt": tgt_id,
                            "tgt_input": tgt_inp,
                        })
                        connected = True
                    break

            # If dropped on a node body (not socket), auto-assign port
            if not connected:
                for node in self.nodes:
                    if node.id != self.connecting["src"] and node.hit_test(x, y):
                        if node.inputs or node.dynamic_inputs:
                            inp_name = self._resolve_target_input(
                                node, node.id, self.connecting["src"])
                            self.edges.append({
                                "src": self.connecting["src"],
                                "tgt": node.id,
                                "tgt_input": inp_name,
                            })
                        break

            self.delete("temp_edge")
            self.connecting["src"] = None
            self.connecting["line"] = None
            self.draw_edges()
            self.request_update()

        self.drag_data["item"] = None
        self.drag_data["type"] = None

    def on_pan_press(self, event):
        self.scan_mark(event.x, event.y)

    def on_pan_drag(self, event):
        self.scan_dragto(event.x, event.y, gain=1)

    # -- Helpers ------------------------------------------------------------
    def request_update(self):
        self.on_change()

    def get_selected(self):
        return next((n for n in self.nodes if n.id == self.selected_node), None)

    def set_selected_val(self, val):
        node = self.get_selected()
        if node:
            node.set_value(val)
            self.request_update()

    def delete_selected(self):
        if self.selected_node:
            self.delete_node_by_id(self.selected_node)

    def get_graph_data(self):
        return {
            "nodes": [{"id": n.id, "type": n.type, "value": n.value,
                        "inputs": [i["name"] for i in n.inputs]}
                      for n in self.nodes],
            "edges": self.edges,
        }

    def reset(self):
        for n in self.nodes:
            n.clear()
        self.nodes = []
        self.edges = []
        self.selected_node = None
        self._hovered_node = None
        self.delete("all")
        self._draw_grid()
