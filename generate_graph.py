#!/usr/bin/env python3
"""Render the Pagume multi-agent graph as an image.

Builds the compiled LangGraph (mock inventory, no LLM) and writes a PNG of
node relationships to the repository root.

Usage (from the repo root):

    agents/.venv/bin/python generate_graph.py
    agents/.venv/bin/python generate_graph.py --output pagume_agent_graph.png
"""

from __future__ import annotations

import argparse
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AGENTS_SRC = ROOT / "agents" / "src"
if str(AGENTS_SRC) not in sys.path:
    sys.path.insert(0, str(AGENTS_SRC))

SPECIALISTS = (
    "destination",
    "accommodation",
    "transport",
    "car_rental",
    "tour",
    "budget",
    "itinerary",
    "booking",
)


def build_app():
    from pagume_agents.clients.mock import MockInventoryClient
    from pagume_agents.graph import build_graph

    return build_graph(client=MockInventoryClient(), use_llm=False)


def save_mermaid(drawable, path: Path) -> None:
    path.write_text(drawable.draw_mermaid(), encoding="utf-8")


def save_mermaid_png(drawable, path: Path) -> None:
    drawable.draw_mermaid_png(output_file_path=str(path))


def _node_box(
    svg: ET.Element,
    x: float,
    y: float,
    w: float,
    h: float,
    label: str,
    fill: str,
    stroke: str,
    *,
    rx: float = 10,
) -> None:
    ET.SubElement(
        svg,
        "rect",
        {
            "x": str(x),
            "y": str(y),
            "width": str(w),
            "height": str(h),
            "rx": str(rx),
            "fill": fill,
            "stroke": stroke,
            "stroke-width": "1.6",
        },
    )
    text = ET.SubElement(
        svg,
        "text",
        {
            "x": str(x + w / 2),
            "y": str(y + h / 2 + 5),
            "text-anchor": "middle",
            "font-family": "Helvetica, Arial, sans-serif",
            "font-size": "13",
            "font-weight": "600",
            "fill": "#1f2937",
        },
    )
    text.text = label


def _line(
    svg: ET.Element,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    *,
    dashed: bool = False,
    color: str = "#4b5563",
) -> None:
    attrs = {
        "x1": str(x1),
        "y1": str(y1),
        "x2": str(x2),
        "y2": str(y2),
        "stroke": color,
        "stroke-width": "1.5",
        "marker-end": "url(#arrow)",
    }
    if dashed:
        attrs["stroke-dasharray"] = "6 4"
    ET.SubElement(svg, "line", attrs)


def save_svg_fallback(path: Path) -> None:
    """Draw the supervisor star topology without mermaid.ink or Graphviz."""
    width, height = 1280, 720
    svg = ET.Element(
        "svg",
        {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": str(width),
            "height": str(height),
            "viewBox": f"0 0 {width} {height}",
        },
    )
    ET.SubElement(svg, "rect", {"width": "100%", "height": "100%", "fill": "#fafafa"})
    title = ET.SubElement(
        svg,
        "text",
        {
            "x": str(width / 2),
            "y": "42",
            "text-anchor": "middle",
            "font-family": "Helvetica, Arial, sans-serif",
            "font-size": "22",
            "font-weight": "700",
            "fill": "#111827",
        },
    )
    title.text = "Pagume Trip — agent graph"

    defs = ET.SubElement(svg, "defs")
    marker = ET.SubElement(
        defs,
        "marker",
        {
            "id": "arrow",
            "viewBox": "0 0 10 10",
            "refX": "9",
            "refY": "5",
            "markerWidth": "7",
            "markerHeight": "7",
            "orient": "auto-start-reverse",
        },
    )
    ET.SubElement(marker, "path", {"d": "M 0 0 L 10 5 L 0 10 z", "fill": "#4b5563"})

    start_w, start_h = 120, 44
    start_x, start_y = (width - start_w) / 2, 80
    _node_box(svg, start_x, start_y, start_w, start_h, "START", "#e5e7eb", "#9ca3af", rx=22)

    sup_w, sup_h = 160, 52
    sup_x, sup_y = (width - sup_w) / 2, 200
    _node_box(svg, sup_x, sup_y, sup_w, sup_h, "supervisor", "#fde68a", "#d97706")
    _line(svg, width / 2, start_y + start_h, width / 2, sup_y)

    node_w, node_h = 128, 46
    gap = 12
    row = list(SPECIALISTS) + ["respond"]
    row_width = len(row) * node_w + (len(row) - 1) * gap
    row_x = (width - row_width) / 2
    row_y = 430
    centers: dict[str, tuple[float, float, float, float]] = {}
    for i, name in enumerate(row):
        x = row_x + i * (node_w + gap)
        fill, stroke = ("#bbf7d0", "#16a34a") if name == "respond" else ("#ddd6fe", "#7c3aed")
        _node_box(svg, x, row_y, node_w, node_h, name, fill, stroke)
        centers[name] = (x + node_w / 2, row_y, x + node_w / 2, row_y + node_h)

    sup_bottom = (width / 2, sup_y + sup_h)
    for name in row:
        cx, top, _, _ = centers[name]
        _line(svg, sup_bottom[0], sup_bottom[1], cx, top, dashed=True, color="#7c3aed")
        if name != "respond":
            _line(svg, cx, centers[name][3], sup_bottom[0], sup_bottom[1], color="#6b7280")

    end_w, end_h = 120, 44
    end_x, end_y = centers["respond"][0] - end_w / 2, 580
    _node_box(svg, end_x, end_y, end_w, end_h, "END", "#e5e7eb", "#9ca3af", rx=22)
    _line(svg, centers["respond"][0], centers["respond"][3], centers["respond"][0], end_y)

    caption = ET.SubElement(
        svg,
        "text",
        {
            "x": "40",
            "y": str(height - 28),
            "font-family": "Helvetica, Arial, sans-serif",
            "font-size": "12",
            "fill": "#6b7280",
        },
    )
    caption.text = (
        "Dashed arrows: supervisor routes to a specialist. "
        "Solid arrows: specialists return to supervisor; respond ends the turn."
    )

    path.write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(svg, encoding="unicode"),
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a PNG of the Pagume agent graph.")
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "pagume_agent_graph.png",
        help="PNG output path (default: ./pagume_agent_graph.png)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output = args.output if args.output.is_absolute() else ROOT / args.output
    mermaid_path = output.with_suffix(".mmd")
    svg_path = output.with_suffix(".svg")

    print("Building compiled graph…")
    app = build_app()
    drawable = app.get_graph()

    save_mermaid(drawable, mermaid_path)
    print(f"Wrote Mermaid source: {mermaid_path}")

    try:
        save_mermaid_png(drawable, output)
        print(f"Wrote graph image: {output}")
        return 0
    except Exception as exc:  # noqa: BLE001 — mermaid.ink / Graphviz may be unavailable
        print(f"Mermaid PNG render failed ({exc!r}); writing SVG fallback.")
        save_svg_fallback(svg_path)
        print(f"Wrote graph image: {svg_path}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
