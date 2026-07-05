<?php
require __DIR__ . '/vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;

$file = __DIR__ . '/storage/app/public/Salinan Moey Finance.xlsx';
$spreadsheet = IOFactory::load($file);
$sheet = $spreadsheet->getSheetByName('contoh');

// Let's search for "spk_external_fix" or check row labels in column B and see their formulas in Column C or other columns
for ($row = 1; $row <= 120; $row++) {
    $b = $sheet->getCell("B$row")->getValue();
    $c = $sheet->getCell("C$row")->getValue();
    $c_calc = $sheet->getCell("C$row")->getCalculatedValue();
    
    // Check if the label matches SPK External / Eksternal
    if (stripos($b, 'eksternal') !== false || stripos($b, 'external') !== false) {
        echo "Row $row: B='$b' | C='$c' | Calculated='$c_calc'\n";
    }
}

// Let's inspect Column I as well, because SPK Fix values are often in Column I (e.g. I21, I22, I23, I24)
echo "\n=== COLUMN I (SPK Fix Rows) ===\n";
for ($row = 15; $row <= 30; $row++) {
    $b = $sheet->getCell("B$row")->getValue();
    $i = $sheet->getCell("I$row")->getValue();
    $i_calc = $sheet->getCell("I$row")->getCalculatedValue();
    if (($b !== null && $b !== '') || ($i !== null && $i !== '')) {
        echo "Row $row: B='$b' | I='$i' | Calculated='$i_calc'\n";
    }
}
