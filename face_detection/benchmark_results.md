# YOLOv8 Crowd Monitoring Benchmark Evaluation

## Research Paper Evaluation Table

| Evaluation metric | Measured result |
| :--- | :--- |
| **Average inference latency** | 28.53 ms/frame |
| **Average pipeline FPS** | 22.21 frames/second |
| **Number of measured frames** | 200 (warm-up: 10) |
| **Benchmark trials** | 3 |
| **Model** | yolov8n.pt |
| **Input image size** | 640 x 640 |
| **Confidence threshold** | 0.40 |
| **IoU threshold** | 0.45 |
| **Hardware accelerator** | MPS |
| **Host Processor** | Apple Silicon ARM |
| **Host RAM** | 8.0 GB |
| **Operating System** | Darwin 27.2 |
| **Python version** | 3.12.7 |

## LaTeX Code (Ready to paste into Paper)

```latex
\begin{table}[h]
\centering
\caption{YOLOv8 Real-Time Crowd Monitoring Performance Evaluation}
\begin{tabular}{ll}
\hline
\textbf{Evaluation Metric} & \textbf{Measured Result} \\
\hline
Average inference latency & 28.53 ms/frame \\
Average pipeline FPS & 22.21 frames/second \\
Number of measured frames & 200 \\
Model & yolov8n.pt \\
Input image size & 640 \times 640 \\
Confidence threshold & 0.40 \\
IoU threshold & 0.45 \\
Hardware accelerator & MPS \\
Host Processor & Apple Silicon ARM \\
Host RAM & 8.0 GB \\
Operating System & Darwin 27.2 \\
Python version & 3.12.7 \\
\hline
\end{tabular}
\end{table}
```
