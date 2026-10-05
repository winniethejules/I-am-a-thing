param([string]$out, [string]$title, [string[]]$images, [string[]]$labels, [int]$cols = 2, [int]$cell = 760)
# Images in a grid, `cols` across, each `cell` px wide with a label under it: a contact sheet of
# every photo point, to look at a whole set at once (voxelparty-kvalitet §2).
#   & grid.ps1 -out sheet.png -title "Photo points, before" -images F1.png, F2.png, F3.png -labels F1, F2, F3 -cols 3 -cell 600
Add-Type -AssemblyName System.Drawing
$pad = 10; $head = 50; $bar = 30
$first = [System.Drawing.Image]::FromFile($images[0]); $ch = [int]($first.Height * $cell / $first.Width); $first.Dispose()
$rows = [Math]::Ceiling($images.Count / $cols)
$bmp = New-Object System.Drawing.Bitmap ($cols * ($cell + $pad) + $pad), ($head + $rows * ($ch + $bar + $pad) + $pad)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.Clear([System.Drawing.Color]::FromArgb(18, 19, 26))
$font = New-Object System.Drawing.Font 'Segoe UI', 18, ([System.Drawing.FontStyle]::Bold)
$small = New-Object System.Drawing.Font 'Segoe UI', 12, ([System.Drawing.FontStyle]::Bold)
$white = [System.Drawing.Brushes]::White
$g.DrawString($title, $font, $white, $pad, 10)
for ($k = 0; $k -lt $images.Count; $k++) {
  $cx = $pad + ($k % $cols) * ($cell + $pad); $cy = $head + [Math]::Floor($k / $cols) * ($ch + $bar + $pad)
  $img = [System.Drawing.Image]::FromFile($images[$k])
  $g.DrawImage($img, $cx, $cy, $cell, $ch)
  $img.Dispose()
  if ($labels -and $k -lt $labels.Count) { $g.DrawString($labels[$k], $small, $white, $cx, $cy + $ch + 4) }
}
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
"saved $out"
