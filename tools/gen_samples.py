"""
 * tools/gen_samples.py
 * Mofa-Xingche 5話者モデルでサンプル生成
 * 実行: uv run python tools/gen_samples.py
 * 出力: public/assets/voices/samples/*.wav
"""

import sys
from pathlib import Path

SBV2 = Path(r"C:\gemini-desktop\VOICE\Style-Bert-VITS2")
sys.path.insert(0, str(SBV2))

import style_bert_vits2.nlp.japanese.pyopenjtalk_worker as pjw
pjw.WORKER_CLIENT = "BYPASS"
import pyopenjtalk
pjw.run_frontend = lambda t: pyopenjtalk.run_frontend(t)
pjw.make_label = lambda n: pyopenjtalk.make_label(n)

import numpy as np
import soundfile as sf
from style_bert_vits2.tts_model import TTSModel
from style_bert_vits2.constants import Languages

OUT = Path(r"C:\gemini-desktop\finalfight2\public\assets\voices\samples")
OUT.mkdir(parents=True, exist_ok=True)

MODEL_DIR = SBV2 / "model_assets" / "mofa-xingche"

model = TTSModel(
    model_path=MODEL_DIR / "NotAnimeJPManySpeaker_e120_s22200.safetensors",
    config_path=MODEL_DIR / "config.json",
    style_vec_path=MODEL_DIR / "style_vectors.npy",
    device="cuda",
)
model.load()

tests = [
    ("atk_sei",   "せいっ！"),
    ("atk_ya",    "やっ！"),
    ("atk_torya", "とりゃ！"),
    ("hurt_ku",   "くっ！"),
    ("hurt_gu",   "ぐっ…"),
    ("grab_ku",   "くっ！"),
]

# 各話者のNeutral + 特徴的なスタイル1つ
speaker_styles = [
    ("amazinGood",  "Neutral"),
    ("amazinGood",  "amazinGood(lol)"),
    ("calmCloud",   "Neutral"),
    ("calmCloud",   "calmCloud(down)"),
    ("coolcute",    "Neutral"),
    ("coolcute",    "coolcute(fine)"),
    ("fineCrystal", "Neutral"),
    ("fineCrystal", "fineCrystal(veryfine)"),
]

for tag, text in tests:
    for spk, style in speaker_styles:
        fname = f"mx_{tag}_{spk}_{style.replace('(','_').replace(')','')}.wav"
        path = OUT / fname
        print(f"\n--- {fname}: '{text}' spk={spk} style={style} ---")
        sr, audio = model.infer(
            text=text,
            language=Languages.JP,
            style=style,
            style_weight=0.7,
            length=0.75,
            sdp_ratio=0.25,
            noise=0.55,
            noise_w=0.7,
            line_split=False,
        )
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = (audio / peak * 0.95 * 32767).astype(np.int16)
        sf.write(str(path), audio, sr)
        print(f"  -> {len(audio)/sr:.2f}s")

model.unload()
print(f"\nDone! {len(tests)*len(speaker_styles)} samples")
