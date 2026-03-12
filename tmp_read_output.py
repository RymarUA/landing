import pandas as pd
path = r'c:/Users/Nitro/OneDrive/Рабочий стол/landing/Готовый_список_товаров.xlsx'
df = pd.read_excel(path)
print(df.columns.tolist())
print(df.head(1).to_dict(orient='records')[0])
