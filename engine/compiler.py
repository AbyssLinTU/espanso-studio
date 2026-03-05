class NodeCompilerError(Exception):
    pass

class NodeGraphCompiler:
    @staticmethod
    def compile(nodes, edges, trigger_text):
        if not trigger_text:
            raise NodeCompilerError("Trigger cannot be empty")
        
        adjacency = {n["id"]: [] for n in nodes}
        inputs_map = {n["id"]: {} for n in nodes}
        
        for e in edges:
            src, tgt, input_name = e["src"], e["tgt"], e["tgt_input"]
            if src in adjacency:
                adjacency[src].append((tgt, input_name))
            if tgt in inputs_map:
                inputs_map[tgt][input_name] = src

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

        text_nodes = [n for n in nodes if n["type"] == "text"]
        if not text_nodes:
            raise NodeCompilerError("Необходимо добавить хотя бы один Text узел для вывода.")
        if len(text_nodes) > 1:
            raise NodeCompilerError("Поддерживается только один финальный Text узел.")
            
        final_node = text_nodes[0]
        
        ordered_vars = []
        visited_vars = set()
        
        def traverse(node_id):
            for in_name, src_id in inputs_map.get(node_id, {}).items():
                traverse(src_id)
                
            if node_id in visited_vars:
                return
            visited_vars.add(node_id)
            
            node_data = next((n for n in nodes if n["id"] == node_id), None)
            if not node_data or node_data["type"] == "text":
                return
                
            var_name = f"var_{node_id.replace('-', '_')[:6]}"
            v_dict = {"name": var_name}
            
            if node_data["type"] == "shell":
                v_dict["type"] = "shell"
                cmd = node_data.get("value", "")
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
        
        replace_text = final_node.get("value", "")
        for in_name, src_id in inputs_map.get(final_node["id"], {}).items():
            dep_var_name = f"var_{src_id.replace('-', '_')[:6]}"
            replace_text = replace_text.replace(f"{{{{{in_name}}}}}", f"{{{{{dep_var_name}}}}}")
            
        match_obj["replace"] = replace_text
        if ordered_vars:
            match_obj["vars"] = ordered_vars
            
        return match_obj
