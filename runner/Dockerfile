FROM python:3.11-slim

WORKDIR /app

RUN pip install flask requests pytest pytest-json-report

COPY app ./app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app/__init__.py

EXPOSE 5001
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5001"]

