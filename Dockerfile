FROM python:3.13-alpine

ARG VERSION=dev

ENV PYTHONUNBUFFERED=1 \
    PORT=6060 \
    DB_PATH=/data/klaar.db \
    APP_VERSION=${VERSION}

WORKDIR /app
RUN adduser -D -u 1000 klaar && mkdir -p /data && chown klaar:klaar /data

COPY server.py ./
COPY static ./static

USER klaar
VOLUME ["/data"]
EXPOSE 6060

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

CMD ["python", "server.py"]
