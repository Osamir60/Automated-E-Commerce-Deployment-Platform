$services = @{
    "email-service" = "/api/email"
    "product-service" = "/api/product"
    "cart-service" = "/api/cart"
    "search-service" = "/api/search"
    "payment-service" = "/api/payment"
}

foreach ($svc in $services.Keys) {
    $prefix = $services[$svc]
    $file = "$svc\index.js"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        if ($content -notmatch "express\.Router") {
            $content = $content -replace "const app = express\(\);", "const app = express();`nconst api = express.Router();"
            $content = $content -replace "app\.get\(", "api.get("
            $content = $content -replace "app\.post\(", "api.post("
            $content = $content -replace "app\.put\(", "api.put("
            $content = $content -replace "app\.delete\(", "api.delete("
            
            $content = $content -replace "app\.listen", "app.use('$prefix', api);`napp.use('/', api);`n`napp.listen"
            
            Set-Content $file -Value $content
            Write-Host "Updated $file with prefix $prefix"
        } else {
            Write-Host "$file is already updated."
        }
    }
}
