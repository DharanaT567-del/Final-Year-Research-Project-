"""Tiny pipeline rehearsal only; not a production Sinhala model.
Run: pip install -r requirements.txt && python train_rehearsal.py
Model download requires internet access.
"""
import pandas as pd
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, DataCollatorForSeq2Seq, Seq2SeqTrainingArguments, Seq2SeqTrainer

MODEL_NAME = "google/mt5-small"
DATA_PATH = "sinhala_lyrics_rehearsal.csv"
OUTPUT_DIR = "./naada-mt5-sinhala-rehearsal"

df = pd.read_csv(DATA_PATH).dropna(subset=["original_sinhala", "simplified_sinhala"])
if len(df) < 8:
    raise ValueError("Expected at least 8 examples for this pipeline rehearsal.")
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
test_count = max(2, round(len(df) * 0.2))
test_df, train_df = df.iloc[:test_count].copy(), df.iloc[test_count:].copy()
train_ds = Dataset.from_pandas(train_df[["original_sinhala", "simplified_sinhala"]], preserve_index=False)
test_ds = Dataset.from_pandas(test_df[["original_sinhala", "simplified_sinhala"]], preserve_index=False)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
def preprocess(batch):
    x = tokenizer(["simplify Sinhala: " + s for s in batch["original_sinhala"]], max_length=128, truncation=True)
    y = tokenizer(text_target=batch["simplified_sinhala"], max_length=128, truncation=True)
    x["labels"] = y["input_ids"]
    return x
train_ds = train_ds.map(preprocess, batched=True, remove_columns=train_ds.column_names)
test_ds = test_ds.map(preprocess, batched=True, remove_columns=test_ds.column_names)
args = Seq2SeqTrainingArguments(output_dir=OUTPUT_DIR, eval_strategy="epoch", save_strategy="epoch", learning_rate=5e-5, per_device_train_batch_size=2, per_device_eval_batch_size=2, num_train_epochs=3, weight_decay=0.01, predict_with_generate=True, logging_steps=1, save_total_limit=1, report_to="none")
trainer = Seq2SeqTrainer(model=model, args=args, train_dataset=train_ds, eval_dataset=test_ds, processing_class=tokenizer, data_collator=DataCollatorForSeq2Seq(tokenizer, model=model))
trainer.train()
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print("Saved rehearsal model to", OUTPUT_DIR)
print("This tiny run demonstrates the pipeline only; it does not validate quality.")
