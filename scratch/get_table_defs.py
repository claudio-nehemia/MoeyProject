import re

sql_file = r"c:\projectFlutter\MOEYPROJECT\presensiv2\gawe01072026.sql"
target_tables = [
    "pengaturan_umum"
]

with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

for table in target_tables:
    pattern = r"CREATE TABLE\s+`" + table + r"`\s*\((.*?)\)\s*ENGINE\s*="
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    if match:
        print(f"DROP TABLE IF EXISTS `{table}`;")
        print(f"CREATE TABLE `{table}` (")
        print(match.group(1))
        print(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;")
    else:
        print(f"FAILED: {table}")
