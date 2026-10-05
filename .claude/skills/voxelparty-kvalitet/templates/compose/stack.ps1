param([string]$out, [string]$title, [string[]]$images, [string[]]$labels, [int]$width = 1400)
# Images one under another at `width`, each with its label (a caption bar above it): for film strips,
# whose frames are too small side by side (voxelparty-kvalitet §2). Before on top, after below.
#   & stack.ps1 -out qa\compare\shove.png -title "The shove" -images before.png, after.png -labels "BEFORE: …", "AFTER: …"
# å ä ö in labels: $([char]0xE5) $([char]0xE4) $([char]0xF6), Å Ä Ö: 0xC5 0xC4 0xD6.
Add-Type -AssemblyName System.Drawing
$pad = 12; $head = 56; $bar = 40
$sizes = $images | ForEach-Object { $i = [System.Drawing.Image]::FromFile($_); , @($i.Width, $i.Height); $i.Dispose() }
$total = $head
foreach ($s in $sizes) { $total += $bar + [int]($s[1] * $width / $s[0]) + $pad }
$bmp = New-Object System.Drawing.Bitmap ($width + 2 * $pad), $total
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.Clear([System.Drawing.Color]::FromArgb(18, 19, 26))
$font = New-Object System.Drawing.Font 'Segoe UI', 20, ([System.Drawing.FontStyle]::Bold)
$small = New-Object System.Drawing.Font 'Segoe UI', 15, ([System.Drawing.FontStyle]::Bold)
$white = [System.Drawing.Brushes]::White
$g.DrawString($title, $font, $white, $pad, 12)
$y = $head
for ($k = 0; $k -lt $images.Count; $k++) {
  $g.DrawString($labels[$k], $small, $white, $pad, $y + 8)
  $y += $bar
  $img = [System.Drawing.Image]::FromFile($images[$k])
  $ih = [int]($img.Height * $width / $img.Width)
  $g.DrawImage($img, $pad, $y, $width, $ih)
  $img.Dispose()
  $y += $ih + $pad
}
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
"saved $out"
