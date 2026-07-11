import re

sql_file = r"c:\projectFlutter\MOEYPROJECT\presensiv2_tables.sql"
migration_file = r"c:\projectFlutter\MOEYPROJECT\MoeyBackendAdmin\database\migrations\2026_07_12_000001_create_absensi_tables.php"

with open(sql_file, "r", encoding="utf-8") as f:
    sql_content = f.read()

# Let's clean the SQL to be database statement friendly
# e.g., double quotes, newlines, etc.
# We can separate statements by semicolon
statements = []
current_stmt = []
for line in sql_content.splitlines():
    line_strip = line.strip()
    if not line_strip:
        continue
    current_stmt.append(line)
    if line_strip.endswith(";"):
        statements.append("\n".join(current_stmt))
        current_stmt = []

if current_stmt:
    statements.append("\n".join(current_stmt))

# Let's separate into UP statements and DOWN statements
up_statements = []
down_statements = []

for stmt in statements:
    stmt = stmt.strip()
    if not stmt:
        continue
    # If it is DROP TABLE, we collect the table name for DOWN
    drop_match = re.match(r"DROP TABLE IF EXISTS `([a-zA-Z0-9_]+)`", stmt, re.IGNORECASE)
    if drop_match:
        table_name = drop_match.group(1)
        down_statements.insert(0, f"Schema::dropIfExists('{table_name}');")
        # We don't need drop statements in UP method unless we want it, but let's keep them in UP to clear state too
        up_statements.append(stmt)
    else:
        # In karyawan table, we want to add user_id foreign key pointing to users table
        if "CREATE TABLE `karyawan`" in stmt:
            # Let's insert `user_id` bigint unsigned NULL after `nik` or somewhere, and add FK constraint
            # Find the line with `PRIMARY KEY` or other columns and insert user_id
            lines = stmt.splitlines()
            new_lines = []
            for line in lines:
                new_lines.append(line)
                if "`nik` char(9)" in line:
                    new_lines.append("  `user_id` bigint unsigned DEFAULT NULL,")
            # Before the closing parenthesis, let's insert foreign key constraint
            # Since users table might not have nik, we just reference users(id)
            # Find PRIMARY KEY or foreign key lines
            fk_idx = -1
            for idx, line in enumerate(new_lines):
                if "CONSTRAINT" in line or "PRIMARY KEY" in line:
                    fk_idx = idx
            if fk_idx != -1:
                new_lines.insert(fk_idx, "  CONSTRAINT `karyawan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,")
            stmt = "\n".join(new_lines)
            
        up_statements.append(stmt)

# Let's build the Migration file
migration_code = f"""<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{{
    /**
     * Run the migrations.
     */
    public function up(): void
    {{
        // Disable foreign key checks for clean migration
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

"""

for stmt in up_statements:
    # Escape single quotes and backslashes
    escaped_stmt = stmt.replace('\\', '\\\\').replace("'", "\\'")
    migration_code += f"        DB::statement('{escaped_stmt}');\n\n"

migration_code += """        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
"""

for stmt in down_statements:
    migration_code += f"        {stmt}\n"

migration_code += """        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
};
"""

with open(migration_file, "w", encoding="utf-8") as f:
    f.write(migration_code)

print("Migration file generated successfully!")
