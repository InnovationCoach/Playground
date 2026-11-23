from __future__ import annotations

import ast
import math
from typing import Any

try:
    import bpy  # type: ignore
    import bmesh  # type: ignore
    from mathutils import Euler, Matrix, Vector  # type: ignore
except ImportError:  # pragma: no cover
    bpy = None  # type: ignore
    bmesh = None  # type: ignore
    Euler = Matrix = Vector = None  # type: ignore


ALLOWED_IMPORTS = frozenset({"bpy", "bmesh", "math", "mathutils"})
BLOCKED_CALLS = frozenset({
    "open", "eval", "exec", "compile", "__import__", "input",
    "getattr", "setattr", "delattr", "globals", "locals", "vars", "dir",
})
BLOCKED_MODULES = frozenset({
    "os", "sys", "subprocess", "shutil", "pathlib", "socket", "http",
    "urllib", "requests", "importlib", "builtins", "ctypes", "pickle",
})


class _AstSecurityVisitor(ast.NodeVisitor):
    def __init__(self) -> None:
        self.violation: str | None = None

    def _fail(self, msg: str) -> None:
        if self.violation is None:
            self.violation = msg

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            root = alias.name.split(".")[0]
            if root not in ALLOWED_IMPORTS:
                self._fail(f"Import '{alias.name}' is blocked by the Tinker AST sandbox.")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        root = (node.module or "").split(".")[0]
        if root not in ALLOWED_IMPORTS:
            self._fail(f"Import from '{node.module}' is blocked by the Tinker AST sandbox.")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr.startswith("__") and node.attr.endswith("__"):
            self._fail(f"Dunder attribute access '{node.attr}' is blocked.")
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if node.id in BLOCKED_MODULES:
            self._fail(f"Reference to '{node.id}' is blocked.")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        if isinstance(node.func, ast.Name) and node.func.id in BLOCKED_CALLS:
            self._fail(f"Call to '{node.func.id}()' is blocked by the Tinker AST sandbox.")
        self.generic_visit(node)


def validate_bpy_ast(code: str) -> tuple[bool, str | None]:
    """Validate generated bpy/bmesh Python code against the security AST allowlist."""
    if not code or not code.strip():
        return False, "Script cannot be empty."
    if len(code) > 16000:
        return False, "Script exceeds 16 KB limit."
    try:
        tree = ast.parse(code, mode="exec")
    except SyntaxError as exc:
        return False, f"Syntax error on line {exc.lineno}: {exc.msg}"

    visitor = _AstSecurityVisitor()
    visitor.visit(tree)
    if visitor.violation:
        return False, visitor.violation
    return True, None


_SAFE_BUILTINS: dict[str, Any] = {
    "range": range,
    "len": len,
    "min": min,
    "max": max,
    "abs": abs,
    "round": round,
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "list": list,
    "tuple": tuple,
    "dict": dict,
    "enumerate": enumerate,
    "zip": zip,
    "sum": sum,
}


def execute_sandboxed_bpy(code: str) -> None:
    """Validate AST and execute restricted bpy/bmesh script inside the active session."""
    from .bmesh_ops import HAS_BPY, purge_orphans

    ok, reason = validate_bpy_ast(code)
    if not ok:
        raise ValueError(reason or "Script rejected by AST sandbox.")
    if not HAS_BPY or bpy is None:
        return

    safe_globals: dict[str, Any] = {
        "__builtins__": _SAFE_BUILTINS,
        "bpy": bpy,
        "bmesh": bmesh,
        "math": math,
        "Euler": Euler,
        "Matrix": Matrix,
        "Vector": Vector,
    }
    exec(compile(code, "<tinker_ai_script>", "exec"), safe_globals, {})
    purge_orphans()
