@echo off
cd /d "%~dp0"
echo Baixando dependencias do MediaPipe (necessario apenas na primeira vez com internet)...

python -c "import urllib.request, os; files={'hands.js':'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js', 'camera_utils.js':'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'hands_landmark.tflite':'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_landmark.tflite', 'hands_solution_simd_wasm_bin.wasm':'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_simd_wasm_bin.wasm'}; [urllib.request.urlretrieve(u, f) for f, u in files.items() if not os.path.exists(f)]"

echo.
echo Iniciando simulador local para liberar a camera...
start http://localhost:8000
python -m http.server 8000
