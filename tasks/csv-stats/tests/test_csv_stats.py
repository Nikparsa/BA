import csv
import importlib.util
import sys
from pathlib import Path


def load_solution():
    sol_path = Path('solution.py')
    assert sol_path.exists(), "solution.py not found"
    spec = importlib.util.spec_from_file_location('solution', str(sol_path))
    mod = importlib.util.module_from_spec(spec)
    sys.modules['solution'] = mod
    spec.loader.exec_module(mod)
    return mod


def write_csv(path, rows):
    with open(path, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerows(rows)


def test_mean_median(tmp_path):
    p = tmp_path / 'data.csv'
    write_csv(p, [[1], [2], [3], [4]])
    s = load_solution()
    mean, median = s.compute_stats(str(p))
    assert mean == 2.5
    assert median == 2.5








