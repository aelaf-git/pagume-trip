# Pagume LangGraph multi-agent planning service
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PAGUME_API_BASE_URL=http://api:8000

WORKDIR /app

COPY pyproject.toml README.md ./
COPY src ./src

RUN pip install -e .

RUN useradd --create-home --uid 10001 pagume && chown -R pagume:pagume /app
USER pagume

EXPOSE 8100

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8100/health')"

CMD ["pagume-agents"]
