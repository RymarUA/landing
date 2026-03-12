import pandas as pd
from pathlib import Path

base = Path(r"c:/Users/Nitro/OneDrive/Рабочий стол/landing")
template_path = base / "Пошук_товару_–_fc37912f_efe2_4e33_9919_e20186b607a2.xlsx"
output_path = base / "Готовый_список_товаров.xlsx"

template = pd.read_excel(template_path)
output = pd.read_excel(output_path)

print("template columns:", template.columns.tolist())
print("output columns:", output.columns.tolist())
missing = [col for col in template.columns if col not in output.columns]
print("missing cols in output:", missing)

print("\nEmpty rows by column:")
for col in output.columns:
    empty_mask = output[col].isna() | (output[col].astype(str).str.strip() == "")
    print(f"{col}: {empty_mask.sum()} / {len(output)} empty")
