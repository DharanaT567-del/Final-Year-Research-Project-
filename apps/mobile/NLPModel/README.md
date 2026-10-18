# Naada Sinhala lyrics simplification — rehearsal pack

This pack contains 12 **original synthetic Sinhala lyric-style examples**, not actual lyrics from published songs. Each row includes an original sentence, a simpler paraphrase, an English gloss, and vocabulary notes.

## Files

- `sinhala_lyrics_rehearsal.csv`: open in Excel or use with Python.
- `train_rehearsal.py`: optional mT5 fine-tuning pipeline rehearsal.
- `requirements.txt`: Python dependencies.
- `test_local_inference.py`: offline smoke test for the saved model.

## Current artifact verification

- The CSV contains 12 synthetic examples. The training script splits these into 10 training and 2 evaluation examples, then runs 3 epochs (15 optimizer steps).
- The saved model and tokenizer are in `naada-mt5-sinhala-rehearsal/`; `checkpoint-15/trainer_state.json` records epoch 3, global step 15, and evaluation losses of 26.74, 27.80, and 28.21.
- **Training completion verified:** the trainer state records the final step, model weights and tokenizer artifacts are present, and both load from local files without downloading weights.
- `test_local_inference.py` runs generation on a Sinhala input. The current output is `<extra_id_0>.`, so execution works but the output is not a usable Sinhala simplification. This smoke test does not validate quality or generalization.
- There is no `sinhala_lyrics_rehearsal.jsonl` in the current workspace; the CSV is the available dataset source.

## Important

Twelve examples are only enough to test data loading and the training pipeline. A model trained on this set will likely memorize examples and perform poorly on unseen text. Do not report it as a validated model. For research evaluation, build a larger dataset with permission, review Sinhala paraphrases with fluent speakers, and split by source/song to prevent leakage. Keep copyrighted song lyrics out of public repositories unless you have permission.
