$fixtureDir = "src\test\fixtures"
$files = Get-ChildItem -Path $fixtureDir -Recurse -Filter "index.ts"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Skip if already fixed
    if ($content -match "headersToObject") {
        Write-Host "Skipping $($file.FullName) - already fixed"
        continue
    }
    
    # Add import
    $content = $content -replace "export default \{", "import { headersToObject } from '../../utils/headers-helper'`n`nexport default {"
    
    # Fix headers conversion
    $content = $content -replace "headers: Object\.fromEntries\(request\.headers\),", "headers: headersToObject(request.headers),"
    
    # Write changes back to file
    Set-Content -Path $file.FullName -Value $content
    Write-Host "Fixed $($file.FullName)"
}

Write-Host "All files processed"
