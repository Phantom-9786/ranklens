param([string]$BaseUrl = 'https://ranklens-beta.vercel.app')
$ErrorActionPreference = 'Stop'
foreach ($case in @(@{id='studio-north';state='output-available'}, @{id='missing-report';state='output-error'})) {
  $payload = @{messages=@(@{id="tool-check-$($case.id)";role='user';parts=@(@{type='text';text="Look up the $($case.id) report using get_audit_report."})})} | ConvertTo-Json -Depth 6
  $response = Invoke-WebRequest -Uri "$BaseUrl/api/chat" -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec 60
  $events = @($response.Content -split "`n" | Where-Object { $_.StartsWith('data: ') } | ForEach-Object { $_.Substring(6) | ConvertFrom-Json })
  $states = @($events | Where-Object type -eq 'tool-update' | ForEach-Object { $_.part.state })
  if ($events.type -contains 'error') { throw 'The model stream failed.' }
  if ($events.type -notcontains 'finish' -or $states -notcontains $case.state) { throw "Missing expected $($case.state) for $($case.id)." }
  if ($case.state -eq 'output-available') {
    $report = ($events | Where-Object { $_.type -eq 'tool-update' -and $_.part.state -eq 'output-available' } | Select-Object -First 1).part.output
    if ($report.score -ne 82 -or !$report.sample) { throw 'Unexpected fixture result.' }
  }
  Write-Output "$($case.id): HTTP $($response.StatusCode); states=$($states -join ','); finish=True"
}
