# -*- coding: utf-8 -*-
"""
DataOrchestrator — Shared Macro Model for seamless Quick ↔ Blueprint sync.

Single source of truth: any edit in either mode is instantly reflected
when the user switches to the other view.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

from node_editor import NODE_REGISTRY


# ─────────────────────────────────────────────────────────────────────────────
#  DataOrchestrator
# ─────────────────────────────────────────────────────────────────────────────
class DataOrchestrator:
    """Bidirectional sync between Quick Mode and Blueprint Mode."""

    def __init__(self):
        self.trigger: str = ":hw"
        self.text: str = ""
        self.extensions: list[dict[str, Any]] = []

        self.graph_nodes: list[dict[str, Any]] = []
        self.graph_edges: list[dict[str, Any]] = []

        self._has_complex_graph: bool = False
        self._source: str = "quick"          # last‑edit origin

    # ── Quick Mode → model ────────────────────────────────────────────────
    def update_from_quick(self, trigger: str, text: str, extensions: list[dict]):
        """Capture Quick Mode state into the model."""
        self.trigger = trigger
        self.text = text
        self.extensions = [dict(e) for e in extensions]   # deep copy
        self._source = "quick"
        self._has_complex_graph = False
        # Eagerly build equivalent graph
        self._quick_to_nodes()

    # ── Blueprint Mode → model ────────────────────────────────────────────
    def update_from_blueprint(self, trigger: str, graph_data: dict):
        """Capture Blueprint Mode state into the model."""
        self.trigger = trigger
        self.graph_nodes = [dict(n) for n in graph_data.get("nodes", [])]
        self.graph_edges = [dict(e) for e in graph_data.get("edges", [])]
        self._source = "blueprint"
        # Try reverse‑mapping into Quick representation
        self._nodes_to_quick()

    # ── Provide data for Quick Mode UI ────────────────────────────────────
    def to_quick_view(self) -> dict:
        """Return dict consumed by the Quick Mode builder.

        Keys: trigger, text, extensions, has_complex_graph
        """
        return {
            "trigger": self.trigger,
            "text": self.text,
            "extensions": list(self.extensions),
            "has_complex_graph": self._has_complex_graph,
        }

    # ── Provide data for Blueprint Mode UI ────────────────────────────────
    def to_blueprint_data(self) -> dict:
        """Return dict consumed by the Blueprint Mode builder.

        Keys: trigger, nodes, edges
        """
        return {
            "trigger": self.trigger,
            "nodes": list(self.graph_nodes),
            "edges": list(self.graph_edges),
        }

    # ──────────────────────────────────────────────────────────────────────
    #  MAPPER: Quick → Blueprint nodes
    # ──────────────────────────────────────────────────────────────────────
    def _quick_to_nodes(self):
        """Convert current Quick data into a simple node graph."""
        import uuid

        nodes: list[dict] = []
        edges: list[dict] = []

        # Text Output node (center‑right)
        text_id = str(uuid.uuid4())
        nodes.append({
            "id": text_id,
            "type": "text",
            "value": self.text,
            "x": 550,
            "y": 300,
        })

        # Extension nodes (left column)
        y_offset = 150
        for i, ext in enumerate(self.extensions):
            ext_type = ext.get("type", "text")
            if ext_type not in NODE_REGISTRY:
                continue

            ext_id = str(uuid.uuid4())
            value = ext.get("param", NODE_REGISTRY[ext_type]["default_value"])
            nodes.append({
                "id": ext_id,
                "type": ext_type,
                "value": value,
                "x": 200,
                "y": y_offset + i * 120,
            })

            # Edge: extension output → text input
            reg = NODE_REGISTRY[ext_type]
            if reg.get("has_output") and NODE_REGISTRY["text"].get("inputs"):
                edges.append({
                    "src": ext_id,
                    "tgt": text_id,
                    "tgt_input": NODE_REGISTRY["text"]["inputs"][0],
                })

        # Clipboard placeholders → clipboard nodes
        if "{{clipboard}}" in self.text:
            clip_id = str(uuid.uuid4())
            nodes.append({
                "id": clip_id,
                "type": "clipboard",
                "value": "",
                "x": 200,
                "y": y_offset + len(self.extensions) * 120,
            })
            if NODE_REGISTRY["text"].get("inputs"):
                edges.append({
                    "src": clip_id,
                    "tgt": text_id,
                    "tgt_input": NODE_REGISTRY["text"]["inputs"][0],
                })

        self.graph_nodes = nodes
        self.graph_edges = edges

    # ──────────────────────────────────────────────────────────────────────
    #  REVERSE MAPPER: Blueprint → Quick
    # ──────────────────────────────────────────────────────────────────────
    _SIMPLE_EXT_TYPES = {"date", "shell", "form", "random", "clipboard"}

    def _nodes_to_quick(self):
        """Try to decompose the graph back into Quick Mode fields.

        If the graph is too complex (concat, multi‑level, etc.),
        set ``_has_complex_graph = True`` and provide a simplified view.
        """
        text_nodes = [n for n in self.graph_nodes if n["type"] == "text"]
        if len(text_nodes) != 1:
            self._mark_complex()
            return

        text_node = text_nodes[0]
        self.text = text_node.get("value", "")

        # Build input map: tgt_id → [(src_id, tgt_input)]
        inputs_for_text = [
            e for e in self.graph_edges if e["tgt"] == text_node["id"]
        ]

        extensions: list[dict] = []
        is_complex = False

        for edge in inputs_for_text:
            src_node = next(
                (n for n in self.graph_nodes if n["id"] == edge["src"]), None
            )
            if src_node is None:
                continue

            if src_node["type"] in self._SIMPLE_EXT_TYPES:
                ext_entry = {
                    "type": src_node["type"],
                    "param": src_node.get("value", ""),
                }
                extensions.append(ext_entry)
            else:
                is_complex = True

        # Check for nodes not connected to text (orphans → complex)
        non_text_ids = {n["id"] for n in self.graph_nodes if n["type"] != "text"}
        connected_ids = {e["src"] for e in inputs_for_text}
        if non_text_ids - connected_ids:
            is_complex = True

        # Check if any source node itself has inputs (multi‑level)
        for edge in inputs_for_text:
            if any(e["tgt"] == edge["src"] for e in self.graph_edges):
                is_complex = True
                break

        self.extensions = extensions
        self._has_complex_graph = is_complex

    def _mark_complex(self):
        """Fallback: extract trigger + final text for a simplified Quick view."""
        text_nodes = [n for n in self.graph_nodes if n["type"] == "text"]
        if text_nodes:
            self.text = text_nodes[0].get("value", "")
        self.extensions = []
        self._has_complex_graph = True
