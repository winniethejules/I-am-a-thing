param([string]$out, [string]$title, [string[]]$pairs, [string]$beforeLabel = 'BEFORE', [string]$afterLabel = 'AFTER')
# Before/after side by side (voxelparty-kvalitet §2). Each pair is "before.png|after.png"; one row per pair.
#   & pair.ps1 -out qa\compare\x.png -title "Phase 1: the street" -pairs "a0.png|a1.png", "b0.png|b1.png"
# Swedish labels: -beforeLabel "F$([char]0xD6)RE" -afterLabel EFTER
# (PowerShell variable names ignore case: never use $w and $W for different things.)
Add-Type -AssemblyName System.Drawing
$rows = $pairs | ForEach-Object { , ($_ -split '\|') }
$probe = [System.Drawing.Image]::FromFile($rows[0][0])
$cellW = 960; $cellH = [int]($probe.Height * $cellW / $probe.Width); $probe.Dispose()
$pad = 12; $head = 56
$sheetW = $cellW * 2 + $pad * 3; $sheetH = $head + ($cellH + $pad) * $rows.Count + $pad
$bmp = New-Object System.Drawing.Bitmap $sheetW, $sheetH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.Clear([System.Drawing.Color]::FromArgb(18, 19, 26))
$font = New-Object System.Drawing.Font 'Segoe UI', 20, ([System.Drawing.FontStyle]::Bold)
$small = New-Object System.Drawing.Font 'Segoe UI', 15, ([System.Drawing.FontStyle]::Bold)
$white = [System.Drawing.Brushes]::White
$g.DrawString($title, $font, $white, $pad, 12)
$y = $head
foreach ($r in $rows) {
  for ($i = 0; $i -lt 2; $i++) {
    $img = [System.Drawing.Image]::FromFile($r[$i])
    $x = $pad + $i * ($cellW + $pad)
    $g.DrawImage($img, $x, $y, $cellW, $cellH)
    $img.Dispose()
    $label = if ($i -eq 0) { $beforeLabel } else { $afterLabel }
    $bg = if ($i -eq 0) { [System.Drawing.Color]::FromArgb(200, 120, 40, 40) } else { [System.Drawing.Color]::FromArgb(200, 30, 110, 60) }
    $lw = [int]$g.MeasureString($label, $small).Width + 20
    $g.FillRectangle((New-Object System.Drawing.SolidBrush $bg), $x + [int](($cellW - $lw) / 2), $y + $cellH - 46, $lw, 36)
    $g.DrawString($label, $small, $white, $x + [int](($cellW - $lw) / 2) + 10, $y + $cellH - 43)
  }
  $y += $cellH + $pad
}
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
"saved $out"
