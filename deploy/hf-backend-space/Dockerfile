FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

COPY requirements.txt ./requirements.txt
COPY backend_service ./backend_service
COPY mirror_agent ./mirror_agent

RUN pip install --upgrade pip && pip install -r requirements.txt

EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend_service.app:app --host 0.0.0.0 --port ${PORT:-7860}"]