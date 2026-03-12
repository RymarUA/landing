import pandas as pd
from pathlib import Path
path = Path(r'c:/Users/Nitro/OneDrive/Рабочий стол/landing/Пошук_товару_–_fc37912f_efe2_4e33_9919_e20186b607a2.xlsx')
print('exists', path.exists())
df = pd.read_excel(path)
print(df.columns.tolist())
