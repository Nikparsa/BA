# Sample Solutions

Here are sample solutions for each assignment to test the system:

## 1. FizzBuzz Assignment

Create a file called `solution.py`:

```python
def fizzbuzz(n):
    if n % 15 == 0:
        return "FizzBuzz"
    elif n % 3 == 0:
        return "Fizz"
    elif n % 5 == 0:
        return "Buzz"
    else:
        return str(n)
```

Zip this file and submit it.

## 2. CSV Statistics Assignment

Create a file called `solution.py`:

```python
import math

def calculate_mean(data):
    if not data:
        return 0
    return sum(data) / len(data)

def calculate_median(data):
    if not data:
        return 0
    sorted_data = sorted(data)
    n = len(sorted_data)
    if n % 2 == 0:
        return (sorted_data[n//2 - 1] + sorted_data[n//2]) / 2
    else:
        return sorted_data[n//2]

def calculate_std(data):
    if not data:
        return 0
    mean = calculate_mean(data)
    variance = sum((x - mean) ** 2 for x in data) / len(data)
    return math.sqrt(variance)
```

## 3. Vector2D Assignment

Create a file called `solution.py`:

```python
import math

class Vector2D:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __add__(self, other):
        return Vector2D(self.x + other.x, self.y + other.y)
    
    def __mul__(self, scalar):
        return Vector2D(self.x * scalar, self.y * scalar)
    
    def magnitude(self):
        return math.sqrt(self.x**2 + self.y**2)
    
    def dot(self, other):
        return self.x * other.x + self.y * other.y
```

## How to Test

1. Create any of the above solutions
2. Zip the `solution.py` file
3. Submit through the web interface
4. Check the results!

## Test Accounts

- Student: `student@test.com` / `123456`
- Teacher: `teacher@test.com` / `123456`
