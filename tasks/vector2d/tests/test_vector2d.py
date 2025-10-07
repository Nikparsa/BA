import importlib.util
import sys
from math import isclose
from pathlib import Path


def load_solution():
    sol_path = Path('solution.py')
    assert sol_path.exists(), "solution.py not found"
    spec = importlib.util.spec_from_file_location('solution', str(sol_path))
    mod = importlib.util.module_from_spec(spec)
    sys.modules['solution'] = mod
    spec.loader.exec_module(mod)
    return mod


def test_ops():
    s = load_solution()
    v1 = s.Vector2D(3, 4)
    v2 = s.Vector2D(-3, 1)
    v3 = v1 + v2
    assert v3.x == 0 and v3.y == 5
    assert isclose(v1.magnitude(), 5.0)
    assert (v1 * 2).x == 6 and (v1 * 2).y == 8








