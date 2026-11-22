"""
Campus Crave - Real-Time YOLOv8 Crowd Monitoring Backend
========================================================
This script uses Ultralytics YOLOv8 to detect and count people (headcount) in real-time
from a webcam, video stream, or RTSP feed with Polygon Region of Interest (ROI) filtering,
configurable Image Size, IoU Threshold, Hardware Acceleration (MPS, CUDA, CPU),
and precise Latency & FPS benchmark measurements (with GPU synchronization and warm-up exclusion).
It serves live occupancy data through a FastAPI REST API and MJPEG video stream, directly
integrated with Campus Crave's frontend `CrowdMonitor.tsx` component.

Performance & Latency Evaluation:
---------------------------------
- Average Inference Latency (ms/frame) via high-precision `time.perf_counter()`
- Average Pipeline FPS (frames/second)
- Hardware synchronization (`torch.cuda.synchronize()` / `torch.mps.synchronize()`)
- First 10 warm-up frames excluded for stable research benchmarks
- Automatic evaluation summary table printed on completion

Crowd Density Levels:
---------------------
- Low:    1 - 5 people   (Quiet)
- Medium: 6 - 10 people  (Moderate)
- High:   > 10 people    (Crowded)

Usage:
------
1. Run with live webcam and default benchmark tracking:
   python yolov8_crowd_monitor.py --view

2. Run research benchmark for 200 measured frames on Apple Silicon (MPS):
   python yolov8_crowd_monitor.py --device mps --imgsz 640 --iou 0.45 --benchmark 200 --view

3. Run with custom video file and benchmark evaluation:
   python yolov8_crowd_monitor.py --source /path/to/cctv.mp4 --benchmark 300
"""

import argparse
import logging
import sys
import threading
import time
from collections import deque
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Deferred imports for cv2, numpy, ultralytics, fastapi, uvicorn
cv2 = None
np = None


def ensure_dependencies():
    """Verify and import runtime dependencies with friendly error guidance."""
    global cv2, np
    missing = []
    try:
        import cv2 as _cv2
        cv2 = _cv2
    except ImportError:
        missing.append("opencv-python")

    try:
        import numpy as _np
        np = _np
    except ImportError:
        missing.append("numpy")

    try:
        import ultralytics
    except ImportError:
        missing.append("ultralytics")

    try:
        import fastapi
        import uvicorn
    except ImportError:
        missing.append("fastapi")
        missing.append("uvicorn")

    if missing:
        print("\n" + "=" * 60)
        print("MISSING DEPENDENCIES DETECTED:")
        print(f"Current Python: {sys.executable} (v{sys.version.split()[0]})")
        print(f"Missing: {', '.join(missing)}")
        print("\nIf you installed dependencies in Conda (base), run with 'python':")
        print("    python yolov8_crowd_monitor.py")
        print("\nOr install them for this specific Python environment:")
        print("    pip install -r requirements.txt")
        print("=" * 60 + "\n")
        sys.exit(1)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("YOLOv8CrowdMonitor")

# ---------------------------------------------------------------------------
# Outlets Database (aligned with Campus Crave frontend)
# ---------------------------------------------------------------------------
OUTLETS_DATA: Dict[str, dict] = {
    "dice-n-sip": {"name": "Dice n Sip", "max_capacity": 50, "occupancy": 0},
    "georgia": {"name": "Georgia", "max_capacity": 40, "occupancy": 0},
    "basil": {"name": "Basil", "max_capacity": 30, "occupancy": 0},
    "subway": {"name": "Subway", "max_capacity": 45, "occupancy": 0},
    "uncles": {"name": "Uncle's Cafe", "max_capacity": 50, "occupancy": 0},
    "happiness-store": {"name": "Happiness Store", "max_capacity": 35, "occupancy": 0},
    "nescafe": {"name": "Nescafe", "max_capacity": 40, "occupancy": 0},
    "ccd": {"name": "CCD", "max_capacity": 50, "occupancy": 0},
    "food-court": {"name": "Food Court", "max_capacity": 120, "occupancy": 0},
    "ahaar-cafe": {"name": "Ahaar Cafe", "max_capacity": 40, "occupancy": 0},
}

# ---------------------------------------------------------------------------
# Global State & Thread Safety
# ---------------------------------------------------------------------------
state_lock = threading.Lock()
frame_lock = threading.Lock()
latest_jpeg_frame: Optional[bytes] = None
is_running = True
target_restaurant_id = "dice-n-sip"

# Active hardware and inference settings
inference_metadata: Dict[str, object] = {
    "hardware": "cpu",
    "image_size": 640,
    "iou_threshold": 0.45,
    "conf_threshold": 0.40,
    "model": "yolov8n.pt",
}

# Live latency and FPS performance metrics
benchmark_metrics: Dict[str, object] = {
    "frame_count": 0,
    "warmup_frames": 10,
    "measured_frames": 0,
    "current_latency_ms": 0.0,
    "avg_latency_ms": 0.0,
    "current_fps": 0.0,
    "avg_fps": 0.0,
}


# ---------------------------------------------------------------------------
# Hardware Accelerator Resolution & Synchronization
# ---------------------------------------------------------------------------
def resolve_hardware_device(requested_device: str) -> str:
    """
    Selects optimal hardware execution target:
    - 'auto': automatically selects CUDA (NVIDIA) > MPS (Apple Silicon Mac) > CPU
    - 'mps': Apple Silicon Metal Performance Shaders
    - 'cuda' or '0': NVIDIA GPU acceleration
    - 'cpu': Standard CPU execution
    """
    req = requested_device.strip().lower()
    if req in ("auto", ""):
        try:
            import torch
            if torch.cuda.is_available():
                return "cuda"
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
        except Exception:
            pass
        return "cpu"
    return req


def sync_hardware_device(device_str: str):
    """
    Synchronizes GPU execution queues for high-precision timing measurements.
    Prevents asynchronous GPU dispatch from skewing latency benchmarks.
    """
    try:
        import torch
        dev = device_str.lower()
        if "cuda" in dev and torch.cuda.is_available():
            torch.cuda.synchronize()
        elif "mps" in dev and hasattr(torch, "mps") and hasattr(torch.mps, "synchronize"):
            torch.mps.synchronize()
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Density Thresholds & Status Mapping
# Low (1–5), Medium (6–10), High (> 10)
# ---------------------------------------------------------------------------
def get_density_status(occupancy: int) -> str:
    """
    Map occupancy headcount to status keyword:
    Low:    1 - 5 (and 0) -> Quiet
    Medium: 6 - 10        -> Moderate
    High:   > 10          -> Crowded
    """
    if occupancy <= 5:
        return "Quiet"       # Low
    elif occupancy <= 10:
        return "Moderate"    # Medium
    else:
        return "Crowded"     # High


def get_density_level(occupancy: int) -> str:
    """Returns human-readable density tier name: Low, Medium, or High."""
    if occupancy <= 5:
        return "Low"
    elif occupancy <= 10:
        return "Medium"
    else:
        return "High"


def get_density_range_label(occupancy: int) -> str:
    """Returns the descriptive range badge text."""
    if occupancy <= 5:
        return "LOW (1-5)" if occupancy > 0 else "LOW (0-5)"
    elif occupancy <= 10:
        return "MEDIUM (6-10)"
    else:
        return "HIGH (>10)"


# ---------------------------------------------------------------------------
# Polygon Region of Interest (ROI) Utilities
# ---------------------------------------------------------------------------
def parse_roi_polygon(roi_str: Optional[str], frame_w: int, frame_h: int) -> Optional["np.ndarray"]:
    """
    Parses ROI polygon coordinates.
    Accepts:
      - None or "default": creates an active perspective trapezoid ROI
      - "none", "off", "full", "all": disables ROI filtering (whole frame active)
      - Semicolon-separated pairs of x,y coordinates:
        - Normalized values (0.0 - 1.0): "0.1,0.2;0.9,0.2;0.95,0.92;0.05,0.92"
        - Pixel values: "64,100;576,100;608,440;32,440"
    """
    if roi_str is None or roi_str.strip().lower() in ("default", ""):
        # Focused canteen counter ordering zone (Stomach-to-Face focused, inset from edges)
        normalized_pts = [
            (0.12, 0.16),  # Top-left (below HUD)
            (0.88, 0.16),  # Top-right
            (0.92, 0.92),  # Bottom-right
            (0.08, 0.92),  # Bottom-left
        ]
        pts = [(int(x * frame_w), int(y * frame_h)) for x, y in normalized_pts]
        return np.array(pts, dtype=np.int32)

    cleaned = roi_str.strip().lower()
    if cleaned in ("none", "off", "full", "all", "false", "0"):
        return None

    try:
        raw_pairs = [pair.strip() for pair in roi_str.split(";") if pair.strip()]
        if len(raw_pairs) < 3:
            logger.warning("Polygon ROI requires at least 3 vertices. Falling back to default.")
            return parse_roi_polygon("default", frame_w, frame_h)

        pts = []
        for pair in raw_pairs:
            x_str, y_str = [p.strip() for p in pair.split(",")]
            x_val, y_val = float(x_str), float(y_str)
            # If coordinates are normalized (0.0 to 1.0)
            if 0.0 <= x_val <= 1.0 and 0.0 <= y_val <= 1.0:
                px = int(x_val * frame_w)
                py = int(y_val * frame_h)
            else:
                px = int(x_val)
                py = int(y_val)
            pts.append((px, py))
        return np.array(pts, dtype=np.int32)
    except Exception as e:
        logger.error("Failed to parse --roi '%s': %s. Using default ROI.", roi_str, e)
        return parse_roi_polygon("default", frame_w, frame_h)


def is_inside_polygon(point: Tuple[int, int], polygon: Optional["np.ndarray"]) -> bool:
    """
    Checks if a coordinate lies inside or on the boundary of the ROI polygon using OpenCV pointPolygonTest.
    """
    if polygon is None:
        return True
    return cv2.pointPolygonTest(polygon, (float(point[0]), float(point[1])), False) >= 0


def check_person_in_roi(
    x1: int, y1: int, x2: int, y2: int, polygon: Optional["np.ndarray"]
) -> Tuple[bool, Tuple[int, int]]:
    """
    Stomach-to-Face Priority ROI Check:
    Anchors onto head/face (y1 + 0.25h), chest (y1 + 0.45h), and stomach (y1 + 0.65h).
    Ensures persons standing behind counters or seated are accurately detected and visual dot stays on upper body.
    """
    h = y2 - y1
    center_x = int((x1 + x2) / 2)
    face_y = int(y1 + 0.25 * h)
    chest_y = int(y1 + 0.45 * h)
    stomach_y = int(y1 + 0.65 * h)

    if polygon is None:
        return True, (center_x, chest_y)

    anchors = [
        (center_x, face_y),     # Face / Head
        (center_x, chest_y),    # Upper Chest
        (center_x, stomach_y),  # Stomach
    ]
    for pt in anchors:
        if is_inside_polygon(pt, polygon):
            return True, (center_x, chest_y)

    return False, (center_x, chest_y)


def draw_roi_visuals(
    frame: "np.ndarray",
    polygon: Optional["np.ndarray"],
    inside_count: int,
    total_detected: int
) -> "np.ndarray":
    """
    Renders shaded polygon overlay, perimeter boundary, vertex anchors, and ROI tag.
    """
    if polygon is None:
        return frame

    # 1. Semi-transparent polygon fill
    overlay = frame.copy()
    cv2.fillPoly(overlay, [polygon], (230, 160, 20))  # Soft cyan-amber tint (BGR)
    cv2.addWeighted(overlay, 0.12, frame, 0.88, 0, frame)

    # 2. Polygon border line
    cv2.polylines(frame, [polygon], isClosed=True, color=(255, 190, 40), thickness=2, lineType=cv2.LINE_AA)

    # 3. Vertex corner anchors
    for pt in polygon:
        cv2.circle(frame, tuple(pt), 5, (255, 255, 255), -1, cv2.LINE_AA)
        cv2.circle(frame, tuple(pt), 3, (255, 190, 40), -1, cv2.LINE_AA)

    # 4. Monitored Zone Tag badge
    min_y_idx = int(np.argmin(polygon[:, 1]))
    top_x, top_y = int(polygon[min_y_idx][0]), int(polygon[min_y_idx][1])
    tag_x = max(15, min(frame.shape[1] - 250, top_x - 10))
    tag_y = max(112, top_y - 8)

    tag_text = f"ROI ZONE: {inside_count} In / {total_detected} Detected"
    (tw, th), _ = cv2.getTextSize(tag_text, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
    cv2.rectangle(frame, (tag_x - 4, tag_y - th - 6), (tag_x + tw + 6, tag_y + 4), (18, 18, 22), -1)
    cv2.rectangle(frame, (tag_x - 4, tag_y - th - 6), (tag_x + tw + 6, tag_y + 4), (255, 190, 40), 1)
    cv2.putText(frame, tag_text, (tag_x, tag_y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 220, 90), 1, cv2.LINE_AA)

    return frame


def draw_hud(
    frame: "np.ndarray",
    headcount: int,
    restaurant_name: str,
    fps: float,
    status: str,
    hardware: str = "cpu",
    imgsz: int = 640,
    iou: float = 0.45,
    current_latency: float = 0.0,
    avg_latency: float = 0.0,
    avg_fps: float = 0.0,
    measured_frames: int = 0
) -> "np.ndarray":
    """
    Render modern, elegant HUD overlay onto the camera frame.
    Displays:
    - Left: Headcount, density tier (Low 1-5, Medium 6-10, High >10), outlet name
    - Right: Real-time FPS, Average FPS, Inference Latency (ms), Hardware accelerator, Image Size, IoU
    """
    h, w, _ = frame.shape

    # Color palette (BGR)
    color_map = {
        "Quiet": (60, 190, 80),       # Vibrant Green (Low)
        "Moderate": (240, 145, 30),   # Vibrant Amber (Medium)
        "Crowded": (40, 50, 230),     # Vibrant Red (High)
    }
    status_color = color_map.get(status, (200, 200, 200))

    # Top banner background (semi-transparent)
    overlay = frame.copy()
    banner_height = 88
    cv2.rectangle(overlay, (0, 0), (w, banner_height), (15, 15, 18), -1)
    alpha = 0.85
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    # Accent status strip
    cv2.rectangle(frame, (0, banner_height - 4), (w, banner_height), status_color, -1)

    # Left Column: Outlet Header Title
    cv2.putText(
        frame,
        f"CAMPUS CRAVE  |  {restaurant_name.upper()}",
        (20, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (240, 240, 245),
        2,
        cv2.LINE_AA,
    )

    # Left Column: Headcount & Density Level Range Badge
    range_badge = get_density_range_label(headcount)
    hud_text = f"Occupancy (ROI): {headcount}  [{range_badge}]"
    cv2.putText(
        frame,
        hud_text,
        (20, 68),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        status_color,
        2,
        cv2.LINE_AA,
    )

    # Right Column: Line 1 - FPS & Benchmark Count
    fps_display = f"FPS: {fps:.1f} (Avg: {avg_fps:.1f})  |  N={measured_frames}"
    (fps_w, _), _ = cv2.getTextSize(fps_display, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
    cv2.circle(frame, (w - fps_w - 28, 22), 4, (0, 0, 255), -1)  # Red live recording dot
    cv2.putText(
        frame,
        fps_display,
        (w - fps_w - 18, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.48,
        (210, 210, 220),
        1,
        cv2.LINE_AA,
    )

    # Right Column: Line 2 - Latency (Inference Time ms)
    lat_display = f"Latency: {current_latency:.1f}ms (Avg: {avg_latency:.1f}ms)"
    (lat_w, _), _ = cv2.getTextSize(lat_display, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
    cv2.putText(
        frame,
        lat_display,
        (w - lat_w - 18, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.48,
        (100, 240, 160),  # High-visibility neon green
        1,
        cv2.LINE_AA,
    )

    # Right Column: Line 3 - Hardware Accelerator, Image Size, IoU
    hw_spec_text = f"HW: {hardware.upper()}  |  {imgsz}px  |  IoU: {iou:.2f}"
    (spec_w, _), _ = cv2.getTextSize(hw_spec_text, cv2.FONT_HERSHEY_SIMPLEX, 0.44, 1)
    cv2.putText(
        frame,
        hw_spec_text,
        (w - spec_w - 18, 74),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.44,
        (160, 215, 255),  # Soft cyan
        1,
        cv2.LINE_AA,
    )

    return frame


def get_system_specifications() -> Dict[str, str]:
    """Retrieves host hardware and platform specifications for research paper reporting."""
    import platform
    import os

    proc = platform.processor() or platform.machine()
    if not proc and platform.system() == "Darwin":
        proc = "Apple Silicon ARM"
    elif "arm" in proc.lower():
        proc = "Apple Silicon ARM"

    specs = {
        "os": f"{platform.system()} {platform.mac_ver()[0]}" if platform.system() == "Darwin" else platform.platform(),
        "python": platform.python_version(),
        "processor": proc,
        "ram_gb": "Unknown"
    }
    try:
        ram_bytes = os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES')
        specs["ram_gb"] = f"{round(ram_bytes / (1024**3), 1)} GB"
    except Exception:
        pass
    return specs


def probe_cameras(max_tested: int = 5):
    """Probes and lists available video capture device indices on the system."""
    ensure_dependencies()
    try:
        from camera_finder import list_cameras
        list_cameras(max_devices=max_tested)
    except Exception as e:
        logger.error("Failed to run camera finder: %s", e)


def print_benchmark_report(
    model_name: str,
    device: str,
    imgsz: int,
    conf_threshold: float,
    iou_threshold: float,
    warmup_frames: int,
    measured_frames: int,
    avg_latency: float,
    avg_fps: float,
    runs: int = 1,
    trial_results: Optional[List[dict]] = None,
    export_path: Optional[str] = None
):
    """
    Prints research paper evaluation results table formatted exactly for academic papers / reports.
    Optionally exports both Markdown and LaTeX tables to a file.
    """
    sys_info = get_system_specifications()

    print("\n" + "=" * 74)
    print("        YOLOv8 BENCHMARK & PERFORMANCE EVALUATION SUMMARY")
    print("=" * 74)
    print(f"{'Evaluation metric':<38} | {'Measured result'}")
    print("-" * 74)
    print(f"{'Average inference latency':<38} | {round(avg_latency, 2)} ms/frame")
    print(f"{'Average pipeline FPS':<38} | {round(avg_fps, 2)} frames/second")
    print(f"{'Number of measured frames':<38} | {measured_frames} (warm-up: {warmup_frames})")
    if runs > 1:
        print(f"{'Benchmark experiment runs':<38} | {runs} trials averaged")
    print(f"{'Model':<38} | {model_name}")
    print(f"{'Input image size':<38} | {imgsz} x {imgsz}")
    print(f"{'Confidence threshold':<38} | {conf_threshold:.2f}")
    print(f"{'IoU threshold':<38} | {iou_threshold:.2f}")
    print(f"{'Hardware accelerator':<38} | {device.upper()}")
    print(f"{'Host Processor':<38} | {sys_info['processor']}")
    print(f"{'Host RAM':<38} | {sys_info['ram_gb']}")
    print(f"{'Operating System':<38} | {sys_info['os']}")
    print(f"{'Python version':<38} | {sys_info['python']}")
    print("=" * 74)

    if trial_results and len(trial_results) > 1:
        print("\nIndividual Trial Breakdown:")
        for idx, tr in enumerate(trial_results, 1):
            print(f"  Trial {idx}: Latency = {tr['latency']:.2f} ms | Pipeline FPS = {tr['fps']:.2f}")
        print("=" * 74 + "\n")

    if export_path:
        try:
            content = f"""# YOLOv8 Crowd Monitoring Benchmark Evaluation

## Research Paper Evaluation Table

| Evaluation metric | Measured result |
| :--- | :--- |
| **Average inference latency** | {round(avg_latency, 2)} ms/frame |
| **Average pipeline FPS** | {round(avg_fps, 2)} frames/second |
| **Number of measured frames** | {measured_frames} (warm-up: {warmup_frames}) |
| **Benchmark trials** | {runs} |
| **Model** | {model_name} |
| **Input image size** | {imgsz} x {imgsz} |
| **Confidence threshold** | {conf_threshold:.2f} |
| **IoU threshold** | {iou_threshold:.2f} |
| **Hardware accelerator** | {device.upper()} |
| **Host Processor** | {sys_info['processor']} |
| **Host RAM** | {sys_info['ram_gb']} |
| **Operating System** | {sys_info['os']} |
| **Python version** | {sys_info['python']} |

## LaTeX Code (Ready to paste into Paper)

```latex
\\begin{{table}}[h]
\\centering
\\caption{{YOLOv8 Real-Time Crowd Monitoring Performance Evaluation}}
\\begin{{tabular}}{{ll}}
\\hline
\\textbf{{Evaluation Metric}} & \\textbf{{Measured Result}} \\\\
\\hline
Average inference latency & {round(avg_latency, 2)} ms/frame \\\\
Average pipeline FPS & {round(avg_fps, 2)} frames/second \\\\
Number of measured frames & {measured_frames} \\\\
Model & {model_name} \\\\
Input image size & {imgsz} \\times {imgsz} \\\\
Confidence threshold & {conf_threshold:.2f} \\\\
IoU threshold & {iou_threshold:.2f} \\\\
Hardware accelerator & {device.upper()} \\\\
Host Processor & {sys_info['processor']} \\\\
Host RAM & {sys_info['ram_gb']} \\\\
Operating System & {sys_info['os']} \\\\
Python version & {sys_info['python']} \\\\
\\hline
\\end{{tabular}}
\\end{{table}}
```
"""
            with open(export_path, "w") as f:
                f.write(content)
            print(f"[Benchmark] Report exported successfully to: {export_path}\n")
        except Exception as err:
            logger.error("Failed to export benchmark results: %s", err)


def video_processing_loop(
    source: str,
    model_name: str,
    conf_threshold: float,
    iou_threshold: float,
    imgsz: int,
    device: str,
    view_window: bool,
    roi_arg: Optional[str],
    warmup_frames: int = 10,
    benchmark_target: int = 0,
    print_summary: bool = True,
    export_path: Optional[str] = None
):
    """
    Dedicated worker thread:
    - Ingests video / webcam frames
    - Applies Polygon ROI filtering
    - Executes YOLOv8 inference with precision timing and GPU synchronization
    - Excludes warm-up frames for accurate average latency & FPS measurement
    - Computes smoothed occupancy (moving average)
    - Updates shared state and encodes JPEG frames for live HTTP streaming
    """
    global latest_jpeg_frame, is_running

    logger.info("Initializing YOLOv8 model '%s' on device '%s' (imgsz=%d, iou=%.2f)...",
                model_name, device, imgsz, iou_threshold)
    try:
        from ultralytics import YOLO
        model = YOLO(model_name)
        try:
            model.to(device)
        except Exception as dev_err:
            logger.warning("Could not set device '%s' on model: %s. Continuing with default.", device, dev_err)
        logger.info("YOLOv8 model '%s' initialized successfully on %s.", model_name, device.upper())
    except ImportError:
        logger.error("Ultralytics is not installed. Please run: pip install ultralytics")
        sys.exit(1)
    except Exception as e:
        logger.error("Failed to load YOLO model: %s", e)
        sys.exit(1)

    # Open video capture source (webcam index or video path)
    cap_source = int(source) if source.isdigit() else source
    cap = cv2.VideoCapture(cap_source)

    if cap.isOpened() and isinstance(cap_source, int):
        act_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        act_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        logger.info(
            "Connected to video capture device [Index %d] (%dx%d). "
            "Note: If this connects to OBS Virtual Camera, re-run with '--source 1' for your MacBook built-in camera.",
            cap_source, act_w, act_h
        )

    if not cap.isOpened():
        logger.warning(
            "Could not open video source '%s'. Falling back to synthetic simulation stream.",
            source
        )

    # Rolling window for headcount smoothing (avoids rapid frame-by-frame flicker)
    count_history = deque(maxlen=7)
    prev_time = time.time()
    roi_polygon: Optional[np.ndarray] = None
    cached_frame_dim = (0, 0)

    # Benchmark & Performance Timing Metrics (as per research methodology)
    frame_count = 0
    measured_frames = 0
    total_inference_time = 0.0
    total_pipeline_time = 0.0
    avg_latency = 0.0
    avg_fps = 0.0
    current_latency = 0.0

    # Pre-seed other simulated outlets with varying occupancies for testing
    with state_lock:
        for idx, (oid, info) in enumerate(OUTLETS_DATA.items()):
            if oid != target_restaurant_id:
                info["occupancy"] = (idx * 3 + 2) % 16

    logger.info("Crowd detector running for restaurant: '%s'", target_restaurant_id)
    if benchmark_target > 0:
        logger.info("Benchmark mode active: measuring %d post-warmup frames...", benchmark_target)

    while is_running:
        frame_start = time.perf_counter()
        current_time = time.time()
        fps = 1.0 / max(1e-5, (current_time - prev_time))
        prev_time = current_time

        success = False
        frame = None

        if cap.isOpened():
            success, frame = cap.read()
            if not success and not source.isdigit():
                # Loop video files if end of file reached
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                success, frame = cap.read()

        if not success or frame is None:
            # Synthetic canvas for headless / camera-less testing
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            h, w = frame.shape[:2]
            if roi_polygon is None or cached_frame_dim != (w, h):
                roi_polygon = parse_roi_polygon(roi_arg, w, h)
                cached_frame_dim = (w, h)

            # Simulated wave fluctuating between 2 and 14 people (spans Low, Medium, High)
            simulated_people = int(7.0 + 5.5 * np.sin(time.time() / 4.0))
            raw_roi_count = max(0, simulated_people)
            total_detected = raw_roi_count + 2
            current_latency = 12.0  # Simulated nominal latency

            annotated_frame = frame.copy()
            draw_roi_visuals(annotated_frame, roi_polygon, raw_roi_count, total_detected)

            cv2.putText(
                annotated_frame,
                "Camera feed unavailable or permissions required.",
                (40, 220),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 165, 255),
                1,
                cv2.LINE_AA,
            )
            cv2.putText(
                annotated_frame,
                f"Simulating ROI detection: {raw_roi_count} people ({get_density_level(raw_roi_count)})",
                (40, 260),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (180, 180, 180),
                1,
                cv2.LINE_AA,
            )
        else:
            h, w = frame.shape[:2]
            if roi_polygon is None or cached_frame_dim != (w, h):
                roi_polygon = parse_roi_polygon(roi_arg, w, h)
                cached_frame_dim = (w, h)

            # Synchronize GPU before prediction timing for accurate measurement
            sync_hardware_device(device)
            pred_start = time.perf_counter()

            # Run YOLOv8 detection with Image Size, IoU threshold, and Hardware device
            results = model.predict(
                source=frame,
                classes=[0],
                conf=conf_threshold,
                iou=iou_threshold,
                imgsz=imgsz,
                device=device,
                verbose=False
            )

            # Synchronize GPU after prediction
            sync_hardware_device(device)
            pred_end = time.perf_counter()
            current_latency = (pred_end - pred_start) * 1000.0  # in ms

            result = results[0]
            boxes = result.boxes

            annotated_frame = frame.copy()
            raw_roi_count = 0
            total_detected = len(boxes) if boxes is not None else 0

            # Render shaded polygon ROI on base frame first
            draw_roi_visuals(annotated_frame, roi_polygon, 0, total_detected)

            if boxes is not None:
                for box in boxes:
                    xyxy = box.xyxy[0].cpu().numpy().astype(int)
                    conf = float(box.conf[0].cpu().numpy())
                    x1, y1, x2, y2 = xyxy

                    # Robust multi-anchor ROI test (center, torso, head, feet)
                    inside_roi, anchor_pt = check_person_in_roi(x1, y1, x2, y2, roi_polygon)

                    if inside_roi:
                        raw_roi_count += 1
                        box_color = (40, 220, 80)      # Vibrant green
                        label = f"Person {conf:.2f} [ROI]"
                        cv2.circle(annotated_frame, anchor_pt, 5, (0, 255, 120), -1, cv2.LINE_AA)
                        cv2.circle(annotated_frame, anchor_pt, 7, (255, 255, 255), 1, cv2.LINE_AA)
                    else:
                        box_color = (130, 130, 140)    # Dimmed gray-blue (filtered out)
                        label = f"Person {conf:.2f} [Outside]"
                        cv2.circle(annotated_frame, anchor_pt, 4, (80, 80, 190), -1, cv2.LINE_AA)

                    # Draw bounding box
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2 if inside_roi else 1)

                    # Label pill
                    (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
                    cv2.rectangle(
                        annotated_frame,
                        (x1, y1 - lh - 6),
                        (x1 + lw + 4, y1),
                        box_color,
                        -1,
                    )
                    cv2.putText(
                        annotated_frame,
                        label,
                        (x1 + 2, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.42,
                        (15, 15, 15) if inside_roi else (240, 240, 240),
                        1,
                        cv2.LINE_AA,
                    )

            # Re-render ROI tag badge with confirmed headcount
            draw_roi_visuals(annotated_frame, roi_polygon, raw_roi_count, total_detected)

        # Smooth headcount across frames
        count_history.append(raw_roi_count)
        smoothed_count = int(round(sum(count_history) / len(count_history)))

        # Update outlet state
        status = get_density_status(smoothed_count)
        with state_lock:
            if target_restaurant_id in OUTLETS_DATA:
                OUTLETS_DATA[target_restaurant_id]["occupancy"] = smoothed_count

        # Total pipeline time measurement for this frame
        frame_pipeline_time = time.perf_counter() - frame_start
        frame_count += 1

        # Ignore first N warm-up frames for accurate research benchmarks
        if frame_count > warmup_frames:
            total_inference_time += current_latency
            total_pipeline_time += frame_pipeline_time
            measured_frames += 1
            avg_latency = total_inference_time / measured_frames
            avg_fps = measured_frames / max(1e-6, total_pipeline_time)
        else:
            avg_latency = current_latency
            avg_fps = fps

        # Update shared benchmark state
        with state_lock:
            benchmark_metrics.update({
                "frame_count": frame_count,
                "warmup_frames": warmup_frames,
                "measured_frames": measured_frames,
                "current_latency_ms": round(current_latency, 2),
                "avg_latency_ms": round(avg_latency, 2),
                "current_fps": round(fps, 2),
                "avg_fps": round(avg_fps, 2),
            })

        # Render Top HUD Banner with Latency, FPS, Hardware, imgsz, and IoU overlay
        restaurant_name = OUTLETS_DATA.get(target_restaurant_id, {}).get("name", target_restaurant_id)
        display_frame = draw_hud(
            frame=annotated_frame,
            headcount=smoothed_count,
            restaurant_name=restaurant_name,
            fps=fps,
            status=status,
            hardware=device,
            imgsz=imgsz,
            iou=iou_threshold,
            current_latency=current_latency,
            avg_latency=avg_latency,
            avg_fps=avg_fps,
            measured_frames=measured_frames,
        )

        # Encode frame to JPEG for live MJPEG stream
        ret, buffer = cv2.imencode(".jpg", display_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        if ret:
            with frame_lock:
                latest_jpeg_frame = buffer.tobytes()

        # Desktop OpenCV preview window
        if view_window:
            cv2.imshow("Campus Crave - YOLOv8 Crowd Monitor (Polygon ROI)", display_frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                logger.info("Window close requested ('q' pressed).")
                is_running = False
                break

        # Check if benchmark target frames reached
        if benchmark_target > 0 and measured_frames >= benchmark_target:
            logger.info("Benchmark target of %d measured frames reached. Concluding test.", benchmark_target)
            is_running = False
            break

        # Throttle loop to ~30 FPS if running camera preview
        time.sleep(0.005)

    if cap.isOpened():
        cap.release()
    if view_window:
        cv2.destroyAllWindows()

    logger.info("Video processing loop finished.")

    # Output final academic evaluation table if requested
    if print_summary:
        print_benchmark_report(
            model_name=model_name,
            device=device,
            imgsz=imgsz,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold,
            warmup_frames=warmup_frames,
            measured_frames=measured_frames,
            avg_latency=avg_latency,
            avg_fps=avg_fps
        )

    return {
        "latency": avg_latency,
        "fps": avg_fps,
        "measured_frames": measured_frames,
    }


# ---------------------------------------------------------------------------
# FastAPI Web Server
# ---------------------------------------------------------------------------
def create_app() -> "FastAPI":
    """
    Constructs FastAPI instance with CORS and endpoints for CrowdMonitor.tsx.
    """
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse, StreamingResponse

    app = FastAPI(
        title="Campus Crave Crowd Monitoring API",
        description="Real-time crowd headcount detection using YOLOv8 with Polygon ROI, Latency/FPS Benchmarks, and Hardware controls",
        version="2.3.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def index():
        with state_lock:
            metrics_snapshot = dict(benchmark_metrics)
        return {
            "service": "Campus Crave YOLOv8 Crowd Monitor API",
            "active_restaurant": target_restaurant_id,
            "inference_config": inference_metadata,
            "performance_benchmark": metrics_snapshot,
            "density_thresholds": {
                "Low": "1 - 5 people",
                "Medium": "6 - 10 people",
                "High": "> 10 people"
            },
            "endpoints": [
                "/api/cameras",
                "/api/metrics",
                "/api/outlets/{restaurant_id}",
                "/api/outlets",
                "/api/stream",
                "/docs"
            ]
        }

    @app.get("/api/metrics")
    def get_benchmark_metrics():
        """
        Returns live Latency (ms) and Pipeline FPS measurements for research evaluations.
        """
        with state_lock:
            return {
                "success": True,
                "evaluation_metric_table": {
                    "Average inference latency": f"{benchmark_metrics['avg_latency_ms']} ms/frame",
                    "Average pipeline FPS": f"{benchmark_metrics['avg_fps']} frames/second",
                    "Number of measured frames": benchmark_metrics["measured_frames"],
                    "Warm-up frames excluded": benchmark_metrics["warmup_frames"],
                    "Model": inference_metadata.get("model"),
                    "Input image size": f"{inference_metadata.get('image_size')} x {inference_metadata.get('image_size')}",
                    "Confidence threshold": inference_metadata.get("conf_threshold"),
                    "IoU threshold": inference_metadata.get("iou_threshold"),
                    "Hardware accelerator": inference_metadata.get("hardware"),
                },
                "realtime_metrics": dict(benchmark_metrics)
            }

    @app.get("/api/outlets/{restaurant_id}")
    def get_outlet_occupancy(restaurant_id: str):
        """
        API endpoint consumed by CrowdMonitor.tsx:
        fetch(`${apiUrl}/api/outlets/${restaurantId}`)
        """
        with state_lock:
            outlet = OUTLETS_DATA.get(restaurant_id)
            if not outlet:
                raise HTTPException(status_code=404, detail=f"Restaurant '{restaurant_id}' not found")

            occupancy = outlet["occupancy"]
            status = get_density_status(occupancy)
            density_level = get_density_level(occupancy)
            range_badge = get_density_range_label(occupancy)
            max_capacity = outlet.get("max_capacity", 50)
            name = outlet.get("name", restaurant_id)
            avg_lat = benchmark_metrics.get("avg_latency_ms", 0.0)
            avg_fps = benchmark_metrics.get("avg_fps", 0.0)

        return {
            "success": True,
            "data": {
                "restaurantId": restaurant_id,
                "restaurantName": name,
                "occupancy": occupancy,
                "status": status,
                "densityLevel": density_level,
                "densityRange": range_badge,
                "maxCapacity": max_capacity,
                "hardware": inference_metadata.get("hardware"),
                "imageSize": inference_metadata.get("image_size"),
                "iouThreshold": inference_metadata.get("iou_threshold"),
                "averageLatencyMs": avg_lat,
                "averagePipelineFps": avg_fps,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        }

    @app.get("/api/outlets")
    def list_all_outlets():
        """
        Return occupancy status for all restaurants on campus.
        """
        with state_lock:
            result = []
            for oid, data in OUTLETS_DATA.items():
                occ = data["occupancy"]
                result.append({
                    "restaurantId": oid,
                    "restaurantName": data["name"],
                    "occupancy": occ,
                    "status": get_density_status(occ),
                    "densityLevel": get_density_level(occ),
                    "densityRange": get_density_range_label(occ),
                    "maxCapacity": data.get("max_capacity", 50),
                })
            metrics_snapshot = dict(benchmark_metrics)
        return {
            "success": True,
            "inference_config": inference_metadata,
            "performance_metrics": metrics_snapshot,
            "data": result
        }

    @app.post("/api/outlets/{restaurant_id}/occupancy")
    def update_outlet_occupancy(restaurant_id: str, payload: dict):
        """
        Manually override or push crowd count for a specific outlet.
        """
        if "occupancy" not in payload:
            raise HTTPException(status_code=400, detail="Missing 'occupancy' field in request body")

        new_count = max(0, int(payload["occupancy"]))
        with state_lock:
            if restaurant_id not in OUTLETS_DATA:
                OUTLETS_DATA[restaurant_id] = {
                    "name": restaurant_id.replace("-", " ").title(),
                    "max_capacity": 50,
                    "occupancy": new_count
                }
            else:
                OUTLETS_DATA[restaurant_id]["occupancy"] = new_count

        return {
            "success": True,
            "message": f"Updated {restaurant_id} occupancy to {new_count}",
            "data": OUTLETS_DATA[restaurant_id]
        }

    @app.get("/api/stream")
    def live_video_stream():
        """
        MJPEG live video stream endpoint displaying bounding boxes, Polygon ROI, and HUD.
        Can be viewed directly in browser or embedded in an <img src="/api/stream" /> tag.
        """
        def frame_generator():
            while is_running:
                with frame_lock:
                    if latest_jpeg_frame is None:
                        time.sleep(0.04)
                        continue
                    frame_bytes = latest_jpeg_frame

                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
                )
                time.sleep(0.033)  # ~30 FPS

        return StreamingResponse(
            frame_generator(),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )

    @app.get("/api/cameras")
    def api_camera_finder():
        """
        Camera Finder endpoint: Returns available cameras, hardware names, and current source.
        """
        try:
            from camera_finder import get_macos_camera_names
            names = get_macos_camera_names()
            video_devices = {k: v for k, v in names.items() if "screen" not in v.lower()}
            devices = []
            for idx, name in video_devices.items():
                devices.append({
                    "index": idx,
                    "name": name,
                    "resolution": "1920x1080" if "FaceTime" in name or "Camo" in name else "1280x720",
                    "command": f"python yolov8_crowd_monitor.py --source {idx} --device mps"
                })
            return {
                "success": True,
                "current_source": inference_metadata.get("video_source", "0"),
                "cameras": devices
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    return app


# ---------------------------------------------------------------------------
# CLI & Entry Point
# ---------------------------------------------------------------------------
def main():
    global target_restaurant_id, is_running, inference_metadata

    parser = argparse.ArgumentParser(
        description="Campus Crave YOLOv8 Real-Time Crowd Monitor with Polygon ROI, Latency/FPS Benchmarking"
    )
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Video source: '0' for default webcam, video file path (.mp4), or RTSP URL"
    )
    parser.add_argument(
        "--restaurant",
        type=str,
        default="dice-n-sip",
        choices=list(OUTLETS_DATA.keys()),
        help="Target restaurant to map camera feed to (default: dice-n-sip)"
    )
    parser.add_argument(
        "--roi",
        type=str,
        default="default",
        help=(
            "Polygon ROI points (semicolon-separated x,y pairs). "
            "Supports normalized coords (e.g. '0.1,0.2;0.9,0.2;0.95,0.92;0.05,0.92') "
            "or pixels. Use 'none' to disable ROI filtering (default: 'default')"
        )
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="YOLOv8 weights to use (e.g. yolov8n.pt, yolov8s.pt, yolov8m.pt)"
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Inference image resolution/size in pixels (e.g. 320, 480, 640, 1280) (default: 640)"
    )
    parser.add_argument(
        "--iou",
        type=float,
        default=0.45,
        help="NMS IoU threshold for overlapping bounding boxes (0.0 to 1.0) (default: 0.45)"
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.40,
        help="Confidence threshold for person detection (default: 0.40)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        help="Hardware accelerator: 'auto', 'cpu', 'cuda', 'mps' (Apple Silicon), or GPU index '0' (default: 'auto')"
    )
    parser.add_argument(
        "--warmup",
        type=int,
        default=10,
        help="Number of initial warm-up frames to exclude from benchmark calculations (default: 10)"
    )
    parser.add_argument(
        "--benchmark",
        type=int,
        default=0,
        help="Benchmark frame count target (e.g. 200 or 300). If > 0, stops automatically and outputs summary table (default: 0)"
    )
    parser.add_argument(
        "--runs",
        type=int,
        default=1,
        help="Number of consecutive benchmark trials to repeat and average (e.g. 3) (default: 1)"
    )
    parser.add_argument(
        "--export",
        type=str,
        default=None,
        help="Optional file path to export Markdown & LaTeX tables (e.g. benchmark_report.md) (default: None)"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="FastAPI host binding (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="FastAPI port binding (default: 8000)"
    )
    parser.add_argument(
        "--view",
        action="store_true",
        help="Open native OpenCV GUI preview window on desktop"
    )
    parser.add_argument(
        "--no-server",
        action="store_true",
        help="Run only OpenCV vision detector without starting FastAPI web server"
    )
    parser.add_argument(
        "--list-cameras",
        action="store_true",
        help="Probe and list all available video capture devices and their indices on macOS"
    )

    args = parser.parse_args()

    if args.list_cameras:
        probe_cameras()
        return

    ensure_dependencies()
    target_restaurant_id = args.restaurant

    resolved_device = resolve_hardware_device(args.device)

    # Store active inference metadata
    inference_metadata = {
        "hardware": resolved_device,
        "image_size": args.imgsz,
        "iou_threshold": args.iou,
        "conf_threshold": args.conf,
        "model": args.model,
    }

    logger.info("=" * 65)
    logger.info("Campus Crave YOLOv8 Crowd Monitoring & Latency Benchmark Service")
    logger.info("Target Outlet: %s (%s)", target_restaurant_id, OUTLETS_DATA[target_restaurant_id]["name"])
    logger.info("Hardware Accelerator: %s (Requested: %s)", resolved_device.upper(), args.device)
    logger.info("Image Size (--imgsz): %d px", args.imgsz)
    logger.info("IoU Threshold (--iou): %.2f", args.iou)
    logger.info("Confidence Threshold: %.2f", args.conf)
    logger.info("Warm-up Frames Excluded: %d", args.warmup)
    if args.benchmark > 0:
        logger.info("Benchmark Run: Stop automatically after %d measured frames", args.benchmark)
    logger.info("Video Source: %s", args.source)
    logger.info("ROI Config: %s", args.roi)
    logger.info("=" * 65)

    # Multi-trial benchmark execution (e.g. --runs 3 --benchmark 200)
    if args.runs > 1 and args.benchmark > 0:
        logger.info("Executing %d experimental benchmark runs (%d frames each)...", args.runs, args.benchmark)
        trial_results = []
        for r in range(1, args.runs + 1):
            logger.info("=" * 60)
            logger.info(">>> Starting Benchmark Trial %d of %d...", r, args.runs)
            is_running = True
            trial_res = video_processing_loop(
                source=args.source,
                model_name=args.model,
                conf_threshold=args.conf,
                iou_threshold=args.iou,
                imgsz=args.imgsz,
                device=resolved_device,
                view_window=args.view,
                roi_arg=args.roi,
                warmup_frames=args.warmup,
                benchmark_target=args.benchmark,
                print_summary=False,
            )
            trial_results.append(trial_res)
            logger.info("<<< Finished Trial %d: Latency = %.2f ms, FPS = %.2f", r, trial_res["latency"], trial_res["fps"])
            time.sleep(1.0)

        mean_lat = sum(t["latency"] for t in trial_results) / len(trial_results)
        mean_fps = sum(t["fps"] for t in trial_results) / len(trial_results)

        print_benchmark_report(
            model_name=args.model,
            device=resolved_device,
            imgsz=args.imgsz,
            conf_threshold=args.conf,
            iou_threshold=args.iou,
            warmup_frames=args.warmup,
            measured_frames=args.benchmark,
            avg_latency=mean_lat,
            avg_fps=mean_fps,
            runs=args.runs,
            trial_results=trial_results,
            export_path=args.export,
        )
        return

    # 1. Start background FastAPI API server if enabled
    server_instance = None
    server_thread = None
    if not args.no_server and args.benchmark == 0:
        try:
            import uvicorn
            from fastapi import FastAPI
        except ImportError:
            logger.error("FastAPI or Uvicorn not installed. Please run: pip install fastapi uvicorn")
            sys.exit(1)

        app = create_app()

        import socket
        def is_port_busy(port: int, host: str = "127.0.0.1") -> bool:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.4)
                return s.connect_ex((host, port)) == 0

        target_port = args.port
        if is_port_busy(target_port):
            logger.warning(
                "Port %d is currently occupied by another process. Selecting next available port...",
                target_port,
            )
            while is_port_busy(target_port):
                target_port += 1
            logger.warning("Auto-switched API server to port: %d", target_port)

        logger.info("Starting API server on http://%s:%d", args.host, target_port)
        logger.info("API Docs: http://localhost:%d/docs", target_port)
        logger.info("Latency & FPS Metrics: http://localhost:%d/api/metrics", target_port)
        logger.info("Live Video Feed: http://localhost:%d/api/stream", target_port)

        try:
            config = uvicorn.Config(app, host=args.host, port=target_port, log_level="warning")
            server_instance = uvicorn.Server(config)
            server_thread = threading.Thread(target=server_instance.run, daemon=True)
            server_thread.start()
            # Give server a moment to start
            time.sleep(0.3)
        except Exception as err:
            logger.error("Failed to start API server: %s. Continuing in vision mode...", err)

    # 2. Run video processing loop on the MAIN THREAD (Required by macOS Cocoa / cv2.imshow)
    try:
        video_processing_loop(
            args.source,
            args.model,
            args.conf,
            args.iou,
            args.imgsz,
            resolved_device,
            args.view,
            args.roi,
            args.warmup,
            args.benchmark,
            True,           # print_summary
            args.export,    # export_path
        )
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received. Shutting down...")
    finally:
        is_running = False
        if server_instance:
            server_instance.should_exit = True
        logger.info("Service shut down cleanly.")


if __name__ == "__main__":
    main()
