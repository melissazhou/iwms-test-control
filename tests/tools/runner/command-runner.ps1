$ErrorActionPreference = 'Continue'
$root = 'D:\Project\IWMSTEST'
$queueDir = Join-Path $root 'tools\runner\queue'
$doneDir = Join-Path $root 'tools\runner\done'
$logDir = Join-Path $root 'test-results\runner-logs'

New-Item -ItemType Directory -Force -Path $queueDir,$doneDir,$logDir | Out-Null
$heartbeat = Join-Path $root 'tools\runner\heartbeat.txt'
$startupLog = Join-Path $logDir 'runner-startup.log'
$activeJob = Join-Path $root 'tools\runner\active-job.txt'
"[$(Get-Date -Format s)] runner started. root=$root" | Add-Content -Path $startupLog

function Is-AllowedCommand($cmd) {
  $c = $cmd.Trim().ToLower()
  return (
    $c.StartsWith('npm ') -or
    $c.StartsWith('npx ') -or
    $c.StartsWith('node ') -or
    $c.StartsWith('ssh ') -or
    $c.StartsWith('scp ')
  )
}

while ($true) {
  try {
    $jobs = Get-ChildItem -Path $queueDir -Filter *.json | Sort-Object LastWriteTime
    foreach ($job in $jobs) {
      $content = Get-Content $job.FullName -Raw | ConvertFrom-Json
      $id = $content.id
      $cmd = [string]$content.command
      $envName = if ($content.env) { [string]$content.env } else { 'uat' }
      $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
      $log = Join-Path $logDir "$stamp-$id.log"

      if (-not (Is-AllowedCommand $cmd)) {
        "[DENY] $cmd" | Out-File -FilePath $log -Encoding utf8
        Move-Item $job.FullName (Join-Path $doneDir "$($job.BaseName)-denied.json") -Force
        continue
      }

      "[START] $(Get-Date -Format s)" | Out-File -FilePath $log -Encoding utf8
      "[ENV] TEST_ENV=$envName" | Add-Content -Path $log
      "[CMD] $cmd" | Add-Content -Path $log

      $timeoutMin = 15
      if ($cmd -match 'test:smoke') { $timeoutMin = 8 }
      if ($cmd -match 'dashboard:daemon:start') { $timeoutMin = 2 }

      $psi = New-Object System.Diagnostics.ProcessStartInfo
      $psi.FileName = 'cmd.exe'
      $psi.Arguments = "/c $cmd >> `"$log`" 2>&1"
      $psi.WorkingDirectory = $root
      $psi.UseShellExecute = $false
      $psi.CreateNoWindow = $true
      $psi.EnvironmentVariables['TEST_ENV'] = $envName

      $p = New-Object System.Diagnostics.Process
      $p.StartInfo = $psi
      $null = $p.Start()

      "id=$id`nenv=$envName`ncmd=$cmd`nlog=$log`npid=$($p.Id)`nstarted=$(Get-Date -Format s)`ntimeoutMin=$timeoutMin" | Out-File -FilePath $activeJob -Encoding utf8 -Force

      # Keep heartbeat alive while command is running
      $timeoutAt = (Get-Date).AddMinutes($timeoutMin)
      while (-not $p.HasExited -and (Get-Date) -lt $timeoutAt) {
        "$(Get-Date -Format s)" | Out-File -FilePath $heartbeat -Encoding ascii -Force
        Start-Sleep -Seconds 2
      }
      $finished = $p.HasExited
      if (-not $finished) {
        try { $p.Kill() } catch {}
      }

      if (-not $finished) { "`n[TIMEOUT] process killed after $timeoutMin minutes" | Add-Content -Path $log }
      "`n[EXIT] $($p.ExitCode)" | Add-Content -Path $log

      $allOut = if (Test-Path $log) { [string](Get-Content $log -Raw) } else { '' }
      $outTail = if ($allOut) { if ($allOut.Length -gt 4000) { $allOut.Substring($allOut.Length-4000) } else { $allOut } } else { '' }
      $result = [pscustomobject]@{ id=$id; command=$cmd; env=$envName; exitCode=$p.ExitCode; log=$log; finishedAt=(Get-Date).ToString('s'); stdoutTail=$outTail; timedOut=(!$finished) }
      $result | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $doneDir "$id.result.json") -Encoding utf8
      Move-Item $job.FullName (Join-Path $doneDir "$($job.BaseName).json") -Force
      if (Test-Path $activeJob) { try { Remove-Item $activeJob -Force -ErrorAction Stop } catch {} }
    }
  } catch {
    $errLog = Join-Path $logDir "runner-error.log"
    $lastErr = Join-Path $root 'tools\runner\last-error.txt'
    $msg = "[$(Get-Date -Format s)] $($_.Exception.Message)"
    try { $msg | Add-Content -Path $errLog } catch {}
    try { $msg | Out-File -FilePath $lastErr -Encoding utf8 -Force } catch {}
  }
  "$(Get-Date -Format s)" | Out-File -FilePath $heartbeat -Encoding ascii -Force
  Start-Sleep -Seconds 2
}
