import argparse
import re
from pathlib import Path
from typing import List

import pandas as pd  # type: ignore[import]

PRICE_PATTERN = re.compile(r"(\d+[\.,]?\d*)")


def load_source(path: Path) -> pd.DataFrame:
    """Load 1688 CSV export handling common encodings and parsing issues."""
    for encoding in ["utf-8-sig", "cp1251"]:
        try:
            # Try to parse with more robust parameters
            df = pd.read_csv(
                path, 
                encoding=encoding,
                on_bad_lines='warn',  # Skip problematic lines but warn
                quoting=1,  # QUOTE_ALL
                escapechar='\\',  # Handle escaped characters
                engine='python'  # Use python engine for better handling
            )
            return df
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"Warning: Error with encoding {encoding}: {e}")
            continue
    
    # If all else fails, try basic reading
    return pd.read_csv(path, encoding="utf-8-sig", on_bad_lines='skip')


def load_template_columns(path: Path) -> list[str]:
    """Read template headers to preserve exact column order."""
    df_template = pd.read_excel(path)
    return df_template.columns.tolist()


def clean_price(value) -> str:
    if pd.isna(value):
        return ""
    match = PRICE_PATTERN.search(str(value).replace(",", "."))
    return match.group(1) if match else ""


def price_to_float(value: str) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def get_series(df: pd.DataFrame, column: str, length: int) -> pd.Series:
    if column in df.columns:
        return df[column].fillna("")
    return pd.Series([""] * length)


def format_money(val: float | None) -> str:
    return (
        f"{val:.2f}"
        if isinstance(val, (int, float)) and pd.notna(val)
        else ""
    )


def build_output(
    df_source: pd.DataFrame,
    template_columns: list[str],
    contact_value: str,
) -> pd.DataFrame:
    rows = len(df_source)
    output = pd.DataFrame("", index=range(rows), columns=template_columns)

    names = get_series(df_source, "Наименование товара", rows)
    images = get_series(df_source, "Ссылка на изображение", rows)
    links = get_series(df_source, "Ссылка на товар", rows)
    qty = get_series(df_source, "Количество", rows)
    raw_prices = get_series(df_source, "Цена", rows)
    characteristics = get_series(df_source, "Характеристики", rows)

    unit_price_clean = raw_prices.apply(clean_price)
    qty_numeric = pd.to_numeric(qty, errors="coerce")
    unit_price_numeric = unit_price_clean.apply(price_to_float)
    total_prices: List[float | None] = []
    for idx, unit_price in enumerate(unit_price_numeric):
        qty_value = qty_numeric.iloc[idx]
        if unit_price is None or pd.isna(qty_value):
            total_prices.append(None)
            continue
        total_prices.append(unit_price * float(qty_value))

    output["№"] = range(1, rows + 1)
    if "Контакти клієнта,ID " in output.columns:
        output["Контакти клієнта,ID "] = contact_value
    output["Назва товару"] = names
    if "Фото товару" in output.columns:
        output["Фото товару"] = images
    if "Посилання на товар" in output.columns:
        output["Посилання на товар"] = links
    output["Кількість"] = qty
    output["Коментар клієнта"] = (
        "Характеристики: " + characteristics.astype(str).str.strip()
    )
    output["Ціна за штуку в юанях"] = unit_price_clean
    output["Ціна за весь товар в юанях"] = [
        format_money(val) for val in total_prices
    ]
    output["Всього в юанях"] = output["Ціна за весь товар в юанях"]

    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert 1688 export into search template format."
    )
    parser.add_argument(
        "--source",
        default="1688_20260318_130556.csv",
        help="Path to the raw 1688 CSV export",
    )
    parser.add_argument(
        "--template",
        default="Пошук_товару_–_fc37912f_efe2_4e33_9919_e20186b607a2.xlsx",
        help="Path to the template file (used for column order)",
    )
    parser.add_argument(
        "--output",
        default="Готовый_список_товаров.xlsx",
        help="Path for the generated Excel file",
    )
    parser.add_argument(
        "--contact",
        default="+380936174140",
        help="Contact info to use for 'Контакти клієнта,ID ' column",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_path = Path(args.source)
    template_path = Path(args.template)
    output_path = Path(args.output)

    if not source_path.exists():
        raise FileNotFoundError(f"Source CSV not found: {source_path}")
    if not template_path.exists():
        raise FileNotFoundError(f"Template file not found: {template_path}")

    df_source = load_source(source_path)
    template_columns = load_template_columns(template_path)
    output_df = build_output(
        df_source,
        template_columns,
        args.contact,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_df.to_excel(output_path, index=False)
    print(f"✅ Файл успешно конвертирован: {output_path}")


if __name__ == "__main__":
    main()
