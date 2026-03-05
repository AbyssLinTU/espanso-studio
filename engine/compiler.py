class NodeCompilerError(Exception):
    pass


class NodeGraphCompiler:
    """Compiles a visual node graph into a valid Espanso YAML match dict."""

    @staticmethod
    def compile(nodes, edges, trigger_text):
        if not trigger_text:
            raise NodeCompilerError("Trigger cannot be empty")

        # ── Build adjacency / input maps ──────────────────────────────────
        adjacency = {n["id"]: [] for n in nodes}
        inputs_map = {n["id"]: {} for n in nodes}

        for e in edges:
            src, tgt, input_name = e["src"], e["tgt"], e["tgt_input"]
            if src in adjacency:
                adjacency[src].append((tgt, input_name))
            if tgt in inputs_map:
                inputs_map[tgt][input_name] = src

        # ── Cycle detection (DFS) ────────────────────────────────────────
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

        # ── Find terminal text node ──────────────────────────────────────
        text_nodes = [n for n in nodes if n["type"] == "text"]
        if not text_nodes:
            raise NodeCompilerError("Необходимо добавить хотя бы один Text узел для вывода.")
        if len(text_nodes) > 1:
            raise NodeCompilerError("Поддерживается только один финальный Text узел.")

        final_node = text_nodes[0]

        # ── Traverse graph and collect vars ──────────────────────────────
        ordered_vars = []
        visited_vars = set()
        # Map node_id -> var_name for substitution
        var_names = {}

        def _var_name(node_id):
            if node_id not in var_names:
                short = node_id.replace("-", "_")[:8]
                var_names[node_id] = f"v_{short}"
            return var_names[node_id]

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

            ntype = node_data["type"]
            val = node_data.get("value", "")
            vname = _var_name(node_id)

            # ── clipboard: no YAML var, inline substitution later ────
            if ntype == "clipboard":
                # Will be inlined as {{clipboard}} in replace text
                return

            # ── concat: no YAML var, resolved as concatenation ───────
            if ntype == "concat":
                # Resolved inline during replace text building
                return

            v_dict = {"name": vname}

            if ntype == "shell":
                v_dict["type"] = "shell"
                cmd = val
                for in_name, src_id in inputs_map.get(node_id, {}).items():
                    src_node = next((n for n in nodes if n["id"] == src_id), None)
                    if src_node and src_node["type"] == "clipboard":
                        cmd = cmd.replace(f"{{{{{in_name}}}}}", "{{clipboard}}")
                    else:
                        cmd = cmd.replace(f"{{{{{in_name}}}}}", f"{{{{{_var_name(src_id)}}}}}")
                v_dict["params"] = {"cmd": cmd}

            elif ntype == "date":
                v_dict["type"] = "date"
                v_dict["params"] = {"format": val or "%Y-%m-%d"}

            elif ntype == "form":
                v_dict["type"] = "form"
                field_name = val or "field"
                v_dict["params"] = {"layout": f"{field_name}: [[{field_name}]]"}

            elif ntype == "random":
                v_dict["type"] = "random"
                choices = [c.strip() for c in val.split(";") if c.strip()]
                if not choices:
                    choices = ["option1", "option2"]
                v_dict["params"] = {"choices": choices}

            elif ntype == "script":
                v_dict["type"] = "shell"
                # Wrap python code properly
                code = val.replace('"', '\\"')
                v_dict["params"] = {"cmd": f'python -c "{code}"'}

            ordered_vars.append(v_dict)

        traverse(final_node["id"])

        # ── Build replace text ───────────────────────────────────────────
        def resolve_node_ref(node_id):
            """Returns the text placeholder for a given node's output."""
            nd = next((n for n in nodes if n["id"] == node_id), None)
            if not nd:
                return ""
            if nd["type"] == "clipboard":
                return "{{clipboard}}"
            if nd["type"] == "concat":
                # Concatenate all inputs of the concat node
                parts = []
                for in_name in sorted(inputs_map.get(node_id, {}).keys()):
                    src_id = inputs_map[node_id][in_name]
                    parts.append(resolve_node_ref(src_id))
                return "".join(parts)
            return "{{" + _var_name(node_id) + "}}"

        replace_text = final_node.get("value", "")
        for in_name, src_id in inputs_map.get(final_node["id"], {}).items():
            ref = resolve_node_ref(src_id)
            replace_text = replace_text.replace(f"{{{{{in_name}}}}}", ref)

        match_obj = {"trigger": trigger_text, "replace": replace_text}
        if ordered_vars:
            match_obj["vars"] = ordered_vars

        return match_obj
