# Headless Blender 4.2 + Python 3.11 + FastAPI Worker for SPARK 3D Tinker Studio
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    BLENDER_VERSION=4.2.3 \
    PYTHONUNBUFFERED=1 \
    TINKER_SESSION_ROOT=/tmp/tinker_sessions

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl xz-utils ca-certificates \
    libx11-6 libxi6 libxxf86vm1 libxfixes3 libxrender1 \
    libgl1 libglu1-mesa libsm6 libxext6 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install official Blender 4.2 LTS headless build
RUN curl -fsSL "https://download.blender.org/release/Blender4.2/blender-${BLENDER_VERSION}-linux-x64.tar.xz" -o /tmp/blender.tar.xz \
    && mkdir -p /opt/blender \
    && tar -xf /tmp/blender.tar.xz -C /opt/blender --strip-components=1 \
    && rm /tmp/blender.tar.xz \
    && ln -s /opt/blender/blender /usr/local/bin/blender

# Install FastAPI + Uvicorn into Blender's bundled Python 3.11
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN /opt/blender/4.2/python/bin/python3.11 -m pip install --no-cache-dir -r /app/requirements.txt

COPY app /app/app

EXPOSE 8090

# Run FastAPI inside Blender's Python environment (or via `blender --background --python-exit-code 1 -P ...`)
CMD ["/opt/blender/4.2/python/bin/python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]
