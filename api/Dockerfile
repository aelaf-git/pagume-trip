# Pagume inventory / booking / portal API
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY pyproject.toml README.md ./
COPY src ./src

# Editable install keeps the package at /app/src/pagume_api, so seed.py still
# resolves SEED_DIR to /app/data/seed.
RUN pip install -e .

COPY data ./data
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

RUN useradd --create-home --uid 10001 pagume && chown -R pagume:pagume /app
USER pagume

EXPOSE 8000

# Neon probe + seed can take well over a minute when the primary is unreachable;
# keep start_period above that so depends_on: service_healthy does not fail early.
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=6 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

CMD ["pagume-api"]
