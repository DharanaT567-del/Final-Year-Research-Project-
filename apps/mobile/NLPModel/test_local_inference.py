from pathlib import Path

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


MODEL_DIR = Path(__file__).resolve().parent / "naada-mt5-sinhala-rehearsal"
INPUT_TEXT = "simplify Sinhala: හිරු එළිය වැටෙන විට මගේ හිතට අලුත් බලාපොරොත්තුවක් දැනේ."


def main():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, local_files_only=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_DIR, local_files_only=True)
    model.eval()

    encoded = tokenizer(INPUT_TEXT, return_tensors="pt", truncation=True, max_length=128)
    with torch.inference_mode():
        generated = model.generate(**encoded, max_new_tokens=48, num_beams=1)

    output_text = tokenizer.decode(generated[0], skip_special_tokens=True).strip()
    if not output_text:
        raise RuntimeError("The local model returned an empty output.")

    print(f"Input: {INPUT_TEXT}")
    print(f"Output: {output_text}")
    print("Smoke test passed: local artifacts loaded and generation returned text.")
    print("This checks execution only, not Sinhala quality or generalization.")


if __name__ == "__main__":
    main()