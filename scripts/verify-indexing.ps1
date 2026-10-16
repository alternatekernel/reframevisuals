$ErrorActionPreference = "Stop"

$urls = @(
  "https://reframevisuals.com/",
  "https://www.reframevisuals.com/",
  "https://reframevisuals.com/robots.txt",
  "https://reframevisuals.com/sitemap.xml",
  "https://reframevisuals.com/services/background-removal",
  "https://reframevisuals.com/services/ghost-mannequin",
  "https://reframevisuals.com/services/jewelry-retouch",
  "https://reframevisuals.com/blog"
)

$googlebotUa = "Googlebot/2.1 (+http://www.google.com/bot.html)"

Write-Host "=== Indexing Reliability Check ===" -ForegroundColor Cyan
Write-Host "UTC: $((Get-Date).ToUniversalTime().ToString('s'))Z"
Write-Host ""

foreach ($url in $urls) {
  Write-Host "URL: $url" -ForegroundColor Yellow

  $normalHeaders = & curl.exe -sS -I $url
  $googleHeaders = & curl.exe -sS -I -A $googlebotUa $url
  $body = & curl.exe -sS -A $googlebotUa $url

  $normalStatusMatch = $normalHeaders | Select-String -Pattern "^HTTP/.*" | Select-Object -First 1
  $googleStatusMatch = $googleHeaders | Select-String -Pattern "^HTTP/.*" | Select-Object -First 1
  $locationMatch = $normalHeaders | Select-String -Pattern "^location:" -CaseSensitive:$false | Select-Object -First 1

  $normalStatus = if ($normalStatusMatch) { $normalStatusMatch.ToString() } else { "N/A" }
  $googleStatus = if ($googleStatusMatch) { $googleStatusMatch.ToString() } else { "N/A" }
  $location = if ($locationMatch) { $locationMatch.ToString() } else { "" }

  Write-Host "  Normal:    $normalStatus"
  Write-Host "  Googlebot: $googleStatus"
  if ($location) { Write-Host "  Redirect:  $location" }

  $challengeSignals = @("cf-chl", "attention required", "captcha", "just a moment")
  $foundChallenge = $false
  foreach ($signal in $challengeSignals) {
    if ($body -match [regex]::Escape($signal)) {
      $foundChallenge = $true
      break
    }
  }
  Write-Host "  Challenge markers in body: $foundChallenge"

  if ($url -like "https://reframevisuals.com/services/*" -or $url -eq "https://reframevisuals.com/blog") {
    $hasRootCanonical = [bool]($body -match '<link rel="canonical" href="https://reframevisuals.com/"')
    Write-Host "  Root canonical hardcoded in raw HTML: $hasRootCanonical"
  }

  Write-Host ""
}

Write-Host "Done." -ForegroundColor Green
