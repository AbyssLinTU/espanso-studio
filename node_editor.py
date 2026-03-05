import uuid
import tkinter as tk

# ─────────────────────────────────────────────────────────────────────────────
#  NODE TYPE REGISTRY — Plugin Architecture
# ─────────────────────────────────────────────────────────────────────────────
NODE_REGISTRY = {
    "text": {
        "title": "Text Output",
        "icon": "📄",
        "accent": "#5865F2",
        "inputs": ["in1"],
        "has_output": False,
        "default_value": "Hello World",
        "description": "Final text output node",
    },
    "date": {
        "title": "Date Gen",
        "icon": "📅",
        "accent": "#10B981",
        "inputs": [],
        "has_output": True,
        "default_value": "%Y-%m-%d",
        "description": "Insert current date/time",
    },
    "shell": {
        "title": "Shell Cmd",
        "icon": "🖥",
        "accent": "#F59E0B",
        "inputs": ["in1"],
        "has_output": True,
        "default_value": "echo hello",
        "description": "Execute a shell command",
    },
    "form": {
        "title": "Form Input",
        "icon": "📝",
        "accent": "#8B5CF6",
        "inputs": [],
        "has_output": True,
        "default_value": "field_name",
        "description": "User input field (form)",
    },
    "clipboard": {
        "title": "Clipboard",
        "icon": "📋",
        "accent": "#06B6D4",
        "inputs": [],
        "has_output": True,
        "default_value": "",
        "description": "Paste from clipboard",
    },
    "random": {
        "title": "Random Pick",
        "icon": "🎲",
        "accent": "#EC4899",
        "inputs": [],
        "has_output": True,
        "default_value": "option1;option2;option3",
        "description": "Pick random from list",
    },
    "script": {
        "title": "Python Script",
        "icon": "🐍",
        "accent": "#F97316",
        "inputs": ["in1"],
        "has_output": True,
        "default_value": "print('hello')",
        "description": "Run Python code",
    },
    "concat": {
        "title": "Concat",
        "icon": "🔗",
        "accent": "#A855F7",
        "inputs": ["in1", "in2", "in3"],
        "has_output": True,
        "default_value": "",
        "description": "Merge multiple inputs",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
#  DRAGGABLE NODE — Visual representation on Canvas
# ─────────────────────────────────────────────────────────────────────────────
class DraggableNode:
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

        self.x = center_x - width // 2
        self.y = center_y - height // 2

        self.value = value if value is not None else reg["default_value"]

        # Build inputs/outputs from registry
        self.inputs = [{"name": name, "y_rel": int(height * (i + 1) / (len(reg["inputs"]) + 1))}
                       for i, name in enumerate(reg["inputs"])]
        self.output_y_rel = height // 2 if reg["has_output"] else None

        self.ui_elements = []
        self.draw()

    # ── Round-rect helper ─────────────────────────────────────────────────
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

    # ── Drawing ───────────────────────────────────────────────────────────
    def draw(self):
        self.clear()

        body_color = "#212124"
        border_color = "#333338"

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
            r=14, fill=body_color, outline=border_color, width=1,
            tags=(self.id, "node", "bg"),
        )
        self.ui_elements.append(body)

        # Accent stripe (4px at top, inside rounded rect)
        stripe = self.canvas.create_line(
            self.x + 14, self.y + 3,
            self.x + self.width - 14, self.y + 3,
            fill=self.accent, width=3, capstyle="round",
            tags=(self.id, "node", "stripe"),
        )
        self.ui_elements.append(stripe)

        # Separator line below title
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
            text=f"{self.icon_char} {self.title}", anchor="w",
            fill="#E1E1E6", font=("Segoe UI", 10, "bold"),
            tags=(self.id, "node", "title"),
        )
        self.ui_elements.append(title)

        # Value preview
        val_txt = self.value if len(self.value) < 18 else self.value[:15] + "…"
        if self.type == "clipboard":
            val_txt = "{{clipboard}}"
        elif self.type == "concat":
            val_txt = "merge inputs →"
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

        # Input sockets
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


# ─────────────────────────────────────────────────────────────────────────────
#  NODE CANVAS — Infinite canvas with zoom, pan, context menu
# ─────────────────────────────────────────────────────────────────────────────
class NodeCanvas(tk.Canvas):
    def __init__(self, master, on_change_callback, **kwargs):
        super().__init__(master, bg="#0B0B0D", highlightthickness=0, **kwargs)
        self.on_change = on_change_callback
        self.nodes = []
        self.edges = []

        self.drag_data = {"x": 0, "y": 0, "item": None, "type": None}
        self.connecting = {"src": None, "line": None}
        self.selected_node = None

        self._zoom_level = 1.0

        self._draw_grid()

        # Bindings
        self.bind("<ButtonPress-1>", self.on_press)
        self.bind("<B1-Motion>", self.on_drag)
        self.bind("<ButtonRelease-1>", self.on_release)
        self.bind("<ButtonPress-2>", self.on_pan_press)
        self.bind("<B2-Motion>", self.on_pan_drag)
        self.bind("<ButtonPress-3>", self.on_right_click)
        self.bind("<MouseWheel>", self.on_scroll)

    # ── Grid ──────────────────────────────────────────────────────────────
    def _draw_grid(self, size=20):
        self.delete("grid")
        w, h = 2000, 2000
        for i in range(0, w, size):
            for j in range(0, h, size):
                self.create_rectangle(i, j, i + 1, j + 1, fill="#1A1A1E", outline="", tags="grid")
        self.tag_lower("grid")

    # ── Node management ───────────────────────────────────────────────────
    def add_node(self, node_type, px=200, py=200):
        if node_type not in NODE_REGISTRY:
            return None
        n = DraggableNode(self, px, py, node_type)
        self.nodes.append(n)
        self.request_update()
        return n

    # ── Context menu (right-click) ────────────────────────────────────────
    def on_right_click(self, event):
        menu = tk.Menu(self, tearoff=0, bg="#212124", fg="#E1E1E6",
                       activebackground="#333338", activeforeground="#E1E1E6",
                       font=("Segoe UI", 10), relief="flat", bd=1)

        cx = self.canvasx(event.x)
        cy = self.canvasy(event.y)

        for ntype, reg in NODE_REGISTRY.items():
            menu.add_command(
                label=f"{reg['icon']}  {reg['title']}",
                command=lambda t=ntype, x=cx, y=cy: self.add_node(t, x, y),
            )

        menu.tk_popup(event.x_root, event.y_root)

    # ── Zoom (Ctrl + Scroll) ─────────────────────────────────────────────
    def on_scroll(self, event):
        ctrl = event.state & 0x4
        if not ctrl:
            return

        cx = self.canvasx(event.x)
        cy = self.canvasy(event.y)

        if event.delta > 0:
            factor = 1.1
        else:
            factor = 0.9

        new_zoom = self._zoom_level * factor
        if new_zoom < 0.3 or new_zoom > 3.0:
            return

        self._zoom_level = new_zoom
        self.scale("all", cx, cy, factor, factor)

    # ── Edge drawing ─────────────────────────────────────────────────────
    def draw_edges(self):
        self.delete("edge")
        for e in self.edges:
            src_node = next((n for n in self.nodes if n.id == e["src"]), None)
            tgt_node = next((n for n in self.nodes if n.id == e["tgt"]), None)
            if src_node and tgt_node:
                p1 = src_node.get_output_coords()
                p2 = tgt_node.get_input_coords(e["tgt_input"])
                if p1 and p2:
                    # Get accent color from source node
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

    # ── Mouse handlers ───────────────────────────────────────────────────
    def on_press(self, event):
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

            self.drag_data["item"] = node_id
            self.drag_data["type"] = "node"
            self.drag_data["x"] = x
            self.drag_data["y"] = y

    def on_drag(self, event):
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
        if self.connecting["src"]:
            x, y = self.canvasx(event.x), self.canvasy(event.y)
            items = self.find_overlapping(x - 6, y - 6, x + 6, y + 6)
            tgt_socket = None
            for item in items:
                tags = self.gettags(item)
                if "in" in tags:
                    tgt_socket = tags
                    break

            if tgt_socket:
                tgt_id = tgt_socket[0]
                tgt_inp = tgt_socket[3]
                if tgt_id != self.connecting["src"]:
                    self.edges = [e for e in self.edges
                                  if not (e["tgt"] == tgt_id and e["tgt_input"] == tgt_inp)]
                    self.edges.append({
                        "src": self.connecting["src"],
                        "tgt": tgt_id,
                        "tgt_input": tgt_inp,
                    })

            self.delete("temp_edge")
            self.connecting["src"] = None
            self.connecting["line"] = None
            self.draw_edges()
            self.request_update()

        self.drag_data["item"] = None

    def on_pan_press(self, event):
        self.scan_mark(event.x, event.y)

    def on_pan_drag(self, event):
        self.scan_dragto(event.x, event.y, gain=1)

    # ── Helpers ───────────────────────────────────────────────────────────
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
            node = next((n for n in self.nodes if n.id == self.selected_node), None)
            if node:
                node.clear()
            self.nodes = [n for n in self.nodes if n.id != self.selected_node]
            self.edges = [e for e in self.edges
                          if e["src"] != self.selected_node and e["tgt"] != self.selected_node]
            self.selected_node = None
            self.draw_edges()
            self.request_update()

    def get_graph_data(self):
        return {
            "nodes": [{"id": n.id, "type": n.type, "value": n.value} for n in self.nodes],
            "edges": self.edges,
        }

    def reset(self):
        for n in self.nodes:
            n.clear()
        self.nodes = []
        self.edges = []
        self.selected_node = None
        self.delete("all")
        self._draw_grid()
