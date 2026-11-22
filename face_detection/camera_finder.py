#!/usr/bin/env python3
"""
Campus Crave — Camera Finder & Diagnostic Tool
Quickly inspects, names, and tests all connected camera devices on macOS.

Usage:
  python camera_finder.py               # Probe and list all cameras
  python camera_finder.py --test 0      # Preview camera Index 0 in a test window
  python camera_finder.py --test 1      # Preview camera Index 1 in a test window
"""

import sys
import os
import subprocess
import argparse

# Suppress OpenCV device probing warnings
os.environ["OPENCV_LOG_LEVEL"] = "SILENT"

def get_macos_camera_names():
    """Retrieves hardware device names using AVFoundation via ffmpeg or system_profiler."""
    dev_names = {}

    # Method 1: ffmpeg avfoundation device list
    try:
        res = subprocess.run(
            ["ffmpeg", "-f", "avfoundation", "-list_devices", "true", "-i", ""],
            stderr=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            timeout=5
        )
        in_video = False
        for line in res.stderr.splitlines():
            if "AVFoundation video devices:" in line:
                in_video = True
                continue
            if in_video and "AVFoundation audio devices:" in line:
                break
            if in_video and "[" in line and "]" in line:
                parts = line.split("]")
                if len(parts) >= 2:
                    idx_str = parts[-2].split("[")[-1].strip()
                    if idx_str.isdigit():
                        name = parts[-1].strip()
                        dev_names[int(idx_str)] = name
        if dev_names:
            return dev_names
    except Exception:
        pass

    # Method 2: system_profiler fallback
    try:
        res = subprocess.run(
            ["system_profiler", "SPCameraDataType"],
            stdout=subprocess.PIPE,
            text=True,
            timeout=5
        )
        lines = res.stdout.splitlines()
        found = []
        for line in lines:
            trimmed = line.strip()
            if trimmed.endswith(":") and not trimmed.startswith("Camera:") and not "ID:" in trimmed:
                found.append(trimmed[:-1])
        for idx, name in enumerate(found):
            dev_names[idx] = name
    except Exception:
        pass

    return dev_names


def list_cameras(max_devices=6):
    try:
        import cv2
        try:
            cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_SILENT)
        except Exception:
            pass
    except ImportError:
        print("\n[ERROR] OpenCV is not installed.")
        print(f"Run: {sys.executable} -m pip install opencv-python\n")
        return []

    print("\n" + "=" * 70)
    print(" 📹 CAMPUS CRAVE — CAMERA FINDER (MACOS)")
    print("=" * 70)

    names = get_macos_camera_names()
    # Filter out screen capture devices like 'Capture screen 0'
    video_devices = {k: v for k, v in names.items() if "screen" not in v.lower()}
    limit = len(video_devices) if video_devices else max_devices

    active_cameras = []

    for idx in range(limit):
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            ret, frame = cap.read()
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            cap.release()

            name = names.get(idx, f"Camera Device {idx}")
            if ret and frame is not None:
                active_cameras.append({
                    "index": idx,
                    "name": name,
                    "width": w,
                    "height": h,
                    "fps": round(fps, 1) if fps > 0 else 30.0,
                    "status": "READY"
                })
                print(f"  [Index {idx}]  ✅  {name:<24}  |  Resolution: {w}x{h}  |  Status: ACTIVE")
            else:
                print(f"  [Index {idx}]  ⚠️  {name:<24}  |  Detected (No video frames received)")
        else:
            break

    print("-" * 70)
    if active_cameras:
        print("\nQUICK LAUNCH SHORTCUTS:")
        for cam in active_cameras:
            idx = cam["index"]
            name = cam["name"]
            print(f"  • Use {name}:")
            print(f"      python yolov8_crowd_monitor.py --source {idx} --device mps")

        print("\nTEST A CAMERA FEED:")
        print("  To open a live test preview window for any camera, run:")
        print("      python camera_finder.py --test <INDEX>")
        print("      e.g. python camera_finder.py --test 0")
    else:
        print("  No active cameras returned a video frame.")
        print("  Check camera permissions in macOS System Settings > Privacy & Security > Camera.")

    print("=" * 70 + "\n")
    return active_cameras


def preview_camera(index: int):
    try:
        import cv2
    except ImportError:
        print("[ERROR] OpenCV required to preview camera.")
        return

    names = get_macos_camera_names()
    name = names.get(index, f"Camera {index}")

    print(f"\nOpening test preview for [Index {index}] {name}...")
    print("Press 'q' or 'ESC' in the preview window to exit.\n")

    cap = cv2.VideoCapture(index)
    if not cap.isOpened():
        print(f"[ERROR] Could not open camera at index {index}.")
        return

    window_title = f"Camera Finder Test: [Index {index}] {name}"
    cv2.namedWindow(window_title, cv2.WINDOW_NORMAL)

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            print("[WARN] Failed to read frame from camera.")
            break

        h, w = frame.shape[:2]
        # Overlay banner
        cv2.rectangle(frame, (0, 0), (w, 50), (20, 20, 25), -1)
        cv2.putText(
            frame,
            f"Index {index}: {name} ({w}x{h}) - Press Q to close",
            (16, 32),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 120),
            2,
            cv2.LINE_AA
        )

        cv2.imshow(window_title, frame)
        key = cv2.waitKey(1) & 0xFF
        if key in (ord('q'), ord('Q'), 27):  # 'q' or ESC
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Preview closed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Camera Finder for macOS")
    parser.add_argument("--test", type=int, default=None, help="Test camera index in a live preview window")
    args = parser.parse_args()

    if args.test is not None:
        preview_camera(args.test)
    else:
        list_cameras()
