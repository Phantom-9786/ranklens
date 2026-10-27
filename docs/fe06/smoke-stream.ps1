param([string]$BaseUrl = 'https://ranklens-beta.vercel.app')
$ErrorActionPreference = 'Stop'
$payload = @{ messages = @(@{ id = 'public-stream-check'; role = 'user'; parts = @(@{ type = 'text'; text = 'In two sentences, explain the highest-priority sample audit finding.' }) }) } | ConvertTo-Json -Depth 6
$client = [System.Net.Http.HttpClient]::new()
$request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, "$BaseUrl/api/chat")
$request.Content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')
$clock = [System.Diagnostics.Stopwatch]::StartNew()
try {
  $response = $client.SendAsync($request, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
  $response.EnsureSuccessStatusCode() | Out-Null
  $reader = [System.IO.StreamReader]::new($response.Content.ReadAsStream())
  $deltas = 0
  $text = ''
  $finished = $false
  while (($line = $reader.ReadLine()) -ne $null) {
    if (!$line.StartsWith('data: ')) { continue }
    $part = $line.Substring(6) | ConvertFrom-Json
    if ($part.type -eq 'error') { throw $part.message }
    if ($part.type -eq 'text-delta') {
      $deltas++
      if ($deltas -eq 1) { Write-Output "First text at $($clock.ElapsedMilliseconds)ms" }
      $text += $part.delta
    }
    if ($part.type -eq 'finish') { $finished = $true }
  }
  if (!$finished -or $deltas -lt 2) { throw 'Expected a finished response with multiple streamed deltas.' }
  Write-Output "HTTP $([int]$response.StatusCode); deltas=$deltas; finished=$finished; total=$($clock.ElapsedMilliseconds)ms"
  Write-Output $text
} finally {
  if ($reader) { $reader.Dispose() }
  if ($response) { $response.Dispose() }
  $request.Dispose()
  $client.Dispose()
}
