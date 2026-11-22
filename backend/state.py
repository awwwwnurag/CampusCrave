"""
Campus Crave - Thread-Safe Global State Manager
"""

import threading
from typing import Dict, Optional, Any

# Locks
state_lock = threading.Lock()
frame_lock = threading.Lock()

# Live Video Frame
latest_jpeg_frame: Optional[bytes] = None
is_running: bool = True

# Active mapped outlet
target_restaurant_id: str = "dice-n-sip"

# Active hardware and model settings
inference_metadata: Dict[str, Any] = {
    "hardware": "cpu",
    "image_size": 640,
    "iou_threshold": 0.45,
    "conf_threshold": 0.40,
    "model": "yolov8n.pt",
    "video_source": "0",
}

# Live Latency and FPS metrics
benchmark_metrics: Dict[str, Any] = {
    "frame_count": 0,
    "warmup_frames": 10,
    "measured_frames": 0,
    "current_latency_ms": 0.0,
    "avg_latency_ms": 0.0,
    "current_fps": 0.0,
    "avg_fps": 0.0,
}


def update_jpeg_frame(frame_bytes: bytes):
    """Safely updates latest MJPEG frame bytes."""
    global latest_jpeg_frame
    with frame_lock:
        latest_jpeg_frame = frame_bytes


def get_jpeg_frame() -> Optional[bytes]:
    """Safely retrieves latest MJPEG frame bytes."""
    with frame_lock:
        return latest_jpeg_frame


def update_metrics(metrics: Dict[str, Any]):
    """Safely updates benchmark metrics."""
    with state_lock:
        benchmark_metrics.update(metrics)


def update_inference_config(config: Dict[str, Any]):
    """Safely updates inference metadata."""
    with state_lock:
        inference_metadata.update(config)
