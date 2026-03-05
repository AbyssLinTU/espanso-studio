import uuid
import tkinter as tk
import customtkinter as ctk

class NodeCompilerError(Exception):
    pass

class NodeGraphCompiler:
    """Компилятор графа нод в валидный словарь для Espanso YAML"""
    @staticmethod
    def compile(nodes, edges, trigger_text):
        if not trigger_text:
            raise NodeCompilerError("Trigger cannot be empty")
        
        # Build adjacency list: node_id -> list of (target_node_id, target_input_name)
        adjacency = {n["id"]: [] for n in nodes}
        # Reverse mapping: node_id -> dict of {input_name: source_node_id}
        inputs_map = {n["id"]: {} for n in nodes}
        
        for e in edges:
            src, tgt, input_name = e["src"], e["tgt"], e["tgt_input"]
            if src in adjacency:
                adjacency[src].append((tgt, input_name))
            if tgt in inputs_map:
                inputs_map[tgt][input_name] = src

        # Cycle detection using DFS
        visited = set()
        rec_stack = set()
        
        def is_cyclic(node_id):
            visited.add(node_id)
            rec_stack.add(node_id)
            for neighbor, _ in adjacency.get(node_id, []):
                if neighbor not in visited:
                    if is_cyclic(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.remove(node_id)
            return False

        for n in nodes:
            if n["id"] not in visited:
                if is_cyclic(n["id"]):
                    raise NodeCompilerError("Обнаружена циклическая зависимость в графе!")

        # Find the final text node (terminal node)
        text_nodes = [n for n in nodes if n["type"] == "text"]
        if not text_nodes:
            raise NodeCompilerError("Необходимо добавить хотя бы один Text узел для вывода.")
        if len(text_nodes) > 1:
            raise NodeCompilerError("Поддерживается только один финальный Text узел.")
            
        final_node = text_nodes[0]
        
        # Traverse backwards from final_node to collect vars in correct order (Post-order traversal)
        ordered_vars = []
        visited_vars = set()
        
        def traverse(node_id):
            # Visit dependencies first
            for in_name, src_id in inputs_map.get(node_id, {}).items():
                traverse(src_id)
                
            if node_id in visited_vars:
                return
            visited_vars.add(node_id)
            
            node_data = next((n for n in nodes if n["id"] == node_id), None)
            if not node_data or node_data["type"] == "text":
                return
                
            # Compile variable logic
            var_name = f"var_{node_id.replace('-', '_')[:6]}"
            v_dict = {"name": var_name}
            
            if node_data["type"] == "shell":
                v_dict["type"] = "shell"
                cmd = node_data.get("value", "")
                # Если в Shell входят какие-то переменные, подменяем их
                for in_name, src_id in inputs_map.get(node_id, {}).items():
                    dep_var_name = f"var_{src_id.replace('-', '_')[:6]}"
                    cmd = cmd.replace(f"{{{{{in_name}}}}}", f"{{{{{dep_var_name}}}}}")
                v_dict["params"] = {"cmd": cmd}
                
            elif node_data["type"] == "date":
                v_dict["type"] = "date"
                v_dict["params"] = {"format": node_data.get("value", "%Y-%m-%d")}
                
            ordered_vars.append(v_dict)

        traverse(final_node["id"])
        
        match_obj = {"trigger": trigger_text}
        
        # Compile final replace text
        replace_text = final_node.get("value", "")
        for in_name, src_id in inputs_map.get(final_node["id"], {}).items():
            dep_var_name = f"var_{src_id.replace('-', '_')[:6]}"
            replace_text = replace_text.replace(f"{{{{{in_name}}}}}", f"{{{{{dep_var_name}}}}}")
            
        match_obj["replace"] = replace_text
        if ordered_vars:
            match_obj["vars"] = ordered_vars
            
        return match_obj


class DraggableNode:
    def __init__(self, canvas, center_x, center_y, title, node_type, value="", width=160, height=80):
        self.canvas = canvas
        self.id = str(uuid.uuid4())
        self.type = node_type
        self.title = title
        self.width = width
        self.height = height
        
        # Coordinates (top-left)
        self.x = center_x - width // 2
        self.y = center_y - height // 2
        
        self.value = value
        self.inputs = [] # list of dicts {"name": str, "y_rel": int}
        self.output_y_rel = height // 2 if node_type != "text" else None
        
        if node_type == "text":
            self.inputs = [{"name": "in1", "y_rel": height // 2}]
        elif node_type == "shell":
            self.inputs = [{"name": "in1", "y_rel": height // 2}]
            
        self.ui_elements = []
        self.draw()

    def _create_round_poly(self, x1, y1, x2, y2, r, **kwargs):
        points = [
            x1+r, y1, x1+r, y1,
            x2-r, y1, x2-r, y1,
            x2, y1,
            x2, y1+r, x2, y1+r,
            x2, y2-r, x2, y2-r,
            x2, y2,
            x2-r, y2, x2-r, y2,
            x1+r, y2, x1+r, y2,
            x1, y2,
            x1, y2-r, x1, y2-r,
            x1, y1+r, x1, y1+r,
            x1, y1
        ]
        return self.canvas.create_polygon(points, smooth=True, **kwargs)

    def draw(self):
        self.clear()
        
        # Глубокий темный фон карточки
        color = "#21212B"
        outline = "#5865F2" if self.type == "text" else "#333338"
        
        # Мягкая тень под узлом
        shadow = self._create_round_poly(
            self.x + 3, self.y + 5, self.x + self.width + 3, self.y + self.height + 5,
            r=20, fill="#040405", outline="", tags=(self.id, "node", "shadow")
        )
        self.ui_elements.append(shadow)
        
        # Основной фон с corner_radius=20
        bgrect = self._create_round_poly(
            self.x, self.y, self.x + self.width, self.y + self.height,
            r=20, fill=color, outline=outline, width=2, tags=(self.id, "node", "bg")
        )
        self.ui_elements.append(bgrect)
        
        # Тонкий разделитель для Title (вместо прямоугольника)
        sep_line = self.canvas.create_line(
            self.x + 2, self.y + 32, self.x + self.width - 2, self.y + 32,
            fill="#333338", width=1, tags=(self.id, "node", "sep")
        )
        self.ui_elements.append(sep_line)
        
        txt = self.canvas.create_text(
            self.x + 12, self.y + 16,
            text=f"{self.icon()} {self.title}", anchor="w", fill="#E1E1E6",
            font=("Segoe UI", 10, "bold"), tags=(self.id, "node", "title")
        )
        self.ui_elements.append(txt)
        
        # Helper text / Value preview
        val_txt = self.value if len(self.value) < 15 else self.value[:12] + "..."
        val_lbl = self.canvas.create_text(
            self.x + 12, self.y + 52, text=f'"{val_txt}"', anchor="w", fill="#9CA3AF",
            font=("Segoe UI", 9), tags=(self.id, "node", "val")
        )
        self.ui_elements.append(val_lbl)

        # Output Socket
        if self.output_y_rel is not None:
            r = 5
            ox, oy = self.x + self.width, self.y + self.output_y_rel
            out_socket = self.canvas.create_oval(
                ox - r, oy - r, ox + r, oy + r,
                fill="#5865F2", outline="#E1E1E6", tags=(self.id, "socket", "out")
            )
            self.ui_elements.append(out_socket)
            
        # Input Sockets
        for inp in self.inputs:
            r = 5
            ix, iy = self.x, self.y + inp["y_rel"]
            in_socket = self.canvas.create_oval(
                ix - r, iy - r, ix + r, iy + r,
                fill="#F59E0B", outline="#E1E1E6", tags=(self.id, "socket", "in", inp["name"])
            )
            self.ui_elements.append(in_socket)
            
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

    def icon(self):
        icons = {"text": "📄", "date": "📅", "shell": "🖥"}
        return icons.get(self.type, "📦")
        
    def get_output_coords(self):
        if self.output_y_rel is None:
            return None
        return (self.x + self.width, self.y + self.output_y_rel)
        
    def get_input_coords(self, name):
        for inp in self.inputs:
            if inp["name"] == name:
                return (self.x, self.y + inp["y_rel"])
        return None

class NodeCanvas(tk.Canvas):
    def __init__(self, master, on_change_callback, **kwargs):
        super().__init__(master, bg="#18181A", highlightthickness=0, **kwargs)
        self.on_change = on_change_callback
        self.nodes = []
        self.edges = [] # {"src": node_id, "tgt": node_id, "tgt_input": "in1", "line_id": id}
        
        self.pan_x = 0
        self.pan_y = 0
        self.drag_data = {"x": 0, "y": 0, "item": None, "type": None}
        self.connecting = {"src": None, "line": None}
        self.selected_node = None
        
        self._draw_grid()
        self.bind("<ButtonPress-1>", self.on_press)
        self.bind("<B1-Motion>", self.on_drag)
        self.bind("<ButtonRelease-1>", self.on_release)
        self.bind("<ButtonPress-2>", self.on_pan_press)
        self.bind("<B2-Motion>", self.on_pan_drag)

    def _draw_grid(self, size=20):
        # Basic dot grid
        self.delete("grid")
        w = 2000
        h = 2000
        for i in range(0, w, size):
            for j in range(0, h, size):
                self.create_rectangle(i, j, i+1, j+1, fill="#27272A", outline="", tags="grid")
        self.tag_lower("grid")

    def add_node(self, node_type, px=200, py=200):
        titles = {"text": "Text Output", "date": "Date Gen", "shell": "Shell Cmd"}
        n = DraggableNode(self, px, py, titles.get(node_type, "Node"), node_type)
        self.nodes.append(n)
        self.request_update()
        return n

    def draw_edges(self):
        self.delete("edge")
        for e in self.edges:
            src_node = next((n for n in self.nodes if n.id == e["src"]), None)
            tgt_node = next((n for n in self.nodes if n.id == e["tgt"]), None)
            if src_node and tgt_node:
                p1 = src_node.get_output_coords()
                p2 = tgt_node.get_input_coords(e["tgt_input"])
                if p1 and p2:
                    self.draw_bezier(p1[0], p1[1], p2[0], p2[1], "edge", str(e["src"])+str(e["tgt"]))
        # Lower edges below nodes
        self.tag_lower("edge")
        self.tag_lower("grid")

    def draw_bezier(self, x1, y1, x2, y2, tag, edge_id):
        # Cubic Bezier for smooth wires
        cx1 = x1 + abs(x2 - x1) * 0.5
        cy1 = y1
        cx2 = x2 - abs(x2 - x1) * 0.5
        cy2 = y2
        line = self.create_line(x1, y1, cx1, cy1, cx2, cy2, x2, y2, smooth=True, fill="#A8B2D1", width=2, tags=(tag, edge_id))
        return line

    def on_press(self, event):
        x, y = self.canvasx(event.x), self.canvasy(event.y)
        items = self.find_overlapping(x-2, y-2, x+2, y+2)
        if not items:
            self.selected_node = None
            return

        top_item = items[-1]
        tags = self.gettags(top_item)
        
        if "out" in tags:
            node_id = tags[0]
            node = next((n for n in self.nodes if n.id == node_id), None)
            if node:
                self.connecting["src"] = node_id
                px, py = node.get_output_coords()
                self.connecting["line"] = self.create_line(px, py, px, py, fill="#F59E0B", width=2, dash=(4,4), tags="temp_edge")
        
        elif "node" in tags:
            node_id = tags[0]
            if node_id != self.selected_node:
                self.selected_node = node_id
                self.on_change() # Triggers UI to show properties
                
            self.drag_data["item"] = node_id
            self.drag_data["type"] = "node"
            self.drag_data["x"] = x
            self.drag_data["y"] = y

    def on_drag(self, event):
        x, y = self.canvasx(event.x), self.canvasy(event.y)
        
        if self.connecting["src"]:
            node = next((n for n in self.nodes if n.id == self.connecting["src"]))
            px, py = node.get_output_coords()
            self.coords(self.connecting["line"], px, py, x, y)
            
        elif self.drag_data["item"] and self.drag_data["type"] == "node":
            dx = x - self.drag_data["x"]
            dy = y - self.drag_data["y"]
            node = next((n for n in self.nodes if n.id == self.drag_data["item"]))
            node.move(dx, dy)
            self.drag_data["x"] = x
            self.drag_data["y"] = y
            self.draw_edges()

    def on_release(self, event):
        if self.connecting["src"]:
            x, y = self.canvasx(event.x), self.canvasy(event.y)
            items = self.find_overlapping(x-5, y-5, x+5, y+5)
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
                    # Remove existing same target input edge
                    self.edges = [e for e in self.edges if not (e["tgt"] == tgt_id and e["tgt_input"] == tgt_inp)]
                    self.edges.append({
                        "src": self.connecting["src"], 
                        "tgt": tgt_id, 
                        "tgt_input": tgt_inp
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
            self.nodes = [n for n in self.nodes if n.id != self.selected_node]
            self.edges = [e for e in self.edges if e["src"] != self.selected_node and e["tgt"] != self.selected_node]
            self.delete(self.selected_node)
            self.selected_node = None
            self.draw_edges()
            self.request_update()
            
    def get_graph_data(self):
        return {
            "nodes": [{"id": n.id, "type": n.type, "value": n.value} for n in self.nodes],
            "edges": self.edges
        }

    def reset(self):
        self.nodes = []
        self.edges = []
        self.selected_node = None
        self.delete("all")
        self._draw_grid()
