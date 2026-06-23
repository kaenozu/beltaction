"""
 * tools/gen_voices.py
 * Style-Bert-VITS2 で格闘家Makiの声を生成（jvnv-F2-jp 版）
 * 短いテキストでも締まった発声になるよう調整
 * 実行: uv run python tools/gen_voices.py
 * 関連: SoundManager.ts, Player.ts
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

OUT = Path(r"C:\gemini-desktop\finalfight2\public\assets\voices")
OUT.mkdir(parents=True, exist_ok=True)

MODEL_DIR = SBV2 / "model_assets" / "jvnv-F2-jp"

model = TTSModel(
    model_path=MODEL_DIR / "jvnv-F2_e166_s20000.safetensors",
    config_path=MODEL_DIR / "config.json",
    style_vec_path=MODEL_DIR / "style_vectors.npy",
    device="cuda",
)
model.load()

voice_lines = {
    # --- 攻撃（Angry + 短く鋭く） ---
    "maki_atk_1":     {"text": "せいっ！",     "style": "Angry",   "style_weight": 0.85, "length": 0.7},
    "maki_atk_2":     {"text": "やっ！",       "style": "Angry",   "style_weight": 0.75, "length": 0.7},
    "maki_kick":      {"text": "とりゃ！",     "style": "Angry",   "style_weight": 0.9,  "length": 0.7},

    # --- 被弾（ぐっと耐える） ---
    "maki_hurt_light":{"text": "くっ！",        "style": "Surprise","style_weight": 0.65, "length": 0.7},
    "maki_hurt_heavy":{"text": "ぐっ…",        "style": "Angry",   "style_weight": 0.55, "length": 0.85},

    # --- 死亡（潔く） ---
    "maki_death":     {"text": "あ…",          "style": "Neutral", "style_weight": 0.3,  "length": 1.0},

    # --- ダウンヒット ---
    "maki_downhit":   {"text": "くっ！",        "style": "Surprise","style_weight": 0.7,  "length": 0.65},

    # --- 追い打ち ---
    "maki_downhit_2": {"text": "ぐうっ…",      "style": "Angry",   "style_weight": 0.5,  "length": 0.85},

    # --- 掴まれた（弱々しくなく「くっ！」） ---
    "maki_grabbed":   {"text": "くっ！",        "style": "Angry",   "style_weight": 0.65, "length": 0.65},

    # --- チェーン拘束（短く） ---
    "maki_chain":     {"text": "ぐっ…",        "style": "Angry",   "style_weight": 0.5,  "length": 0.8},

    # --- ゲームオーバー（潔く） ---
    "maki_gameover":  {"text": "まけた…",      "style": "Neutral", "style_weight": 0.4,  "length": 1.1},

    # --- ボディブロー（くぐもった耐え） ---
    "maki_bodyblow":  {"text": "んぐっ！",     "style": "Surprise","style_weight": 0.55, "length": 0.65},
}

for name, params in voice_lines.items():
    path = OUT / f"{name}.wav"
    print(f"\n--- {name}: '{params['text']}' ({params['style']} w={params['style_weight']}) ---")
    sr, audio = model.infer(
        text=params["text"],
        language=Languages.JP,
        style=params["style"],
        style_weight=params["style_weight"],
        length=params["length"],
        sdp_ratio=0.25,
        noise=0.55,
        noise_w=0.7,
        line_split=False,
    )
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = (audio / peak * 0.95 * 32767).astype(np.int16)
    sf.write(str(path), audio, sr)
    print(f"  -> Saved ({len(audio) / sr:.2f}s)")

model.unload()
print(f"\nDone! Generated {len(voice_lines)} clips.")
