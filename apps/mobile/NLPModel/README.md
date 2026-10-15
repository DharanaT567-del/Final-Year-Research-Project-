# Naada Sinhala lyrics simplification — rehearsal pack

This pack contains 12 **original synthetic Sinhala lyric-style examples**, not actual lyrics from published songs. Each row includes an original sentence, a simpler paraphrase, an English gloss, and vocabulary notes.

## Files
- `sinhala_lyrics_rehearsal.csv`: open in Excel or use with Python.
- `sinhala_lyrics_rehearsal.jsonl`: JSON Lines format.
- `train_rehearsal.py`: optional mT5 fine-tuning pipeline rehearsal.
- `requirements.txt`: Python dependencies.

## Important
Twelve examples are only enough to test data loading and the training pipeline. A model trained on this set will likely memorize examples and perform poorly on unseen text. Do not report it as a validated model. For research evaluation, build a larger dataset with permission, review Sinhala paraphrases with fluent speakers, and split by source/song to prevent leakage. Keep copyrighted song lyrics out of public repositories unless you have permission.
