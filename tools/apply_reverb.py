"""
 * tools/apply_reverb.py
 * 生成済み WAV にピッチ低下 + リバーブ適用
 * 実行: uv run python tools/apply_reverb.py
 * (ffmpeg 必須: rubberband フィルタでピッチシフト、scipy でリバーブ)
 * 関連: gen_voices.py（入力元）, SoundManager.ts（再生先）
"""

import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve

WAVES_DIR = Path(r"C:\gemini-desktop\finalfight2\public\assets\voices")

PITCH_FACTOR = 0.95  # -0.9 semitones

def make_ir(sr: int, decay_s: float = 0.25, predelay_s: float = 0.008) -> np.ndarray:
    predelay = int(predelay_s * sr)
    length = int(decay_s * sr) + predelay
    ir = np.random.randn(length) * 0.5
    env = np.exp(-np.arange(length) / (sr * decay_s * 0.3))
    ir *= env
    ir[:predelay] = 0
    ir /= np.sqrt(np.sum(ir ** 2)) * 0.5
    return ir.astype(np.float32)

def apply_reverb(audio: np.ndarray, sr: int, mix: float = 0.22) -> np.ndarray:
    ir = make_ir(sr)
    wet = fftconvolve(audio, ir, mode='full')[:len(audio)]
    wet = wet / (np.max(np.abs(wet)) + 1e-8) * np.max(np.abs(audio))
    return (1 - mix) * audio + mix * wet

for path in sorted(WAVES_DIR.glob("maki_*.wav")):
    print(f"  {path.name}: ", end="")

    # Step 1: pitch shift with ffmpeg rubberband
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(path),
         "-af", f"rubberband=pitch={PITCH_FACTOR}",
         "-ac", "1", "-ar", "44100", str(tmp_path)],
        capture_output=True, check=True,
    )

    # Step 2: reverb (Python)
    data, sr = sf.read(tmp_path)
    orig_peak = np.max(np.abs(data))
    processed = apply_reverb(data, sr)
    processed = processed / (np.max(np.abs(processed)) + 1e-8) * orig_peak
    sf.write(path, processed, sr)
    tmp_path.unlink()
    print(f"pitch={PITCH_FACTOR} reverb=22%")

print("Done.")
