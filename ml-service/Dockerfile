# Stage 1: Builder
FROM python:3.10-slim AS builder

WORKDIR /build

# Copy requirements and install to user local directory to optimize layer cache
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runner
FROM python:3.10-slim AS runner

WORKDIR /app

# Create non-root user
RUN useradd -m -r -u 1000 mluser

# Copy python dependencies from builder
COPY --from=builder --chown=mluser:mluser /root/.local /home/mluser/.local

# Set path for installed binaries (like uvicorn)
ENV PATH=/home/mluser/.local/bin:$PATH

# Copy application source
COPY --chown=mluser:mluser . .

# Run as non-root user
USER mluser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
