param([string[]]$images, [double]$ignoreTop = 0, [double]$ignoreBottom = 0, [int]$dark = 35, [int]$light = 90)
# The measurable half of the image test (voxelparty-kvalitet §4), for photo-point screenshots:
#   - the top third is at most 85% near-black;
#   - at least three brightness levels (dark < $dark, mid, light >= $light), each on >= 10% of the pixels;
#   - no bright blob (luminance >= 200, connected) bigger than 3% of the picture;
#   - at most 2 signal colours dominate (saturated hues covering >= 2% each).
# It can't tell whether the brightest pixels are lamps or haze: look at the picture for that.
# The HUD counts too: shave it off with -ignoreTop / -ignoreBottom (fractions of the height), or
# hide it in photo mode.
#   & image-test.ps1 -images (Get-ChildItem qa\phase1\after\F*.png).FullName -ignoreTop 0.12
Add-Type -AssemblyName System.Drawing
if (-not ('ImageTest' -as [type])) {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class ImageTest {
  // [topBlack, darkShare, midShare, lightShare, biggestBlob, dominantHues, p99]
  public static double[] Measure(string path, double ignoreTop, double ignoreBottom, int dark, int light) {
    using (Bitmap src = new Bitmap(path)) {
      int W = 320, H = (int)(src.Height * 320.0 / src.Width);
      using (Bitmap bmp = new Bitmap(W, H, PixelFormat.Format24bppRgb)) {
        using (Graphics g = Graphics.FromImage(bmp)) {
          g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBilinear;
          g.DrawImage(src, 0, 0, W, H);
        }
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
        byte[] buf = new byte[d.Stride * H];
        Marshal.Copy(d.Scan0, buf, 0, buf.Length);
        bmp.UnlockBits(d);
        int y0 = (int)(H * ignoreTop), y1 = H - (int)(H * ignoreBottom);
        int rows = y1 - y0, n = rows * W;
        double[] L = new double[n];
        int[] hue = new int[12];
        int topN = 0, topBlack = 0, nd = 0, nm = 0, nl = 0;
        int topEnd = y0 + rows / 3;
        for (int y = y0; y < y1; y++) for (int x = 0; x < W; x++) {
          int i = y * d.Stride + x * 3;
          double b = buf[i], gr = buf[i + 1], r = buf[i + 2];
          double lum = 0.2126 * r + 0.7152 * gr + 0.0722 * b;
          L[(y - y0) * W + x] = lum;
          if (lum < dark) nd++; else if (lum < light) nm++; else nl++;
          if (y < topEnd) { topN++; if (lum < 20) topBlack++; }
          double mx = Math.Max(r, Math.Max(gr, b)), mn = Math.Min(r, Math.Min(gr, b));
          if (mx > 70 && (mx - mn) / mx > 0.55) {
            double h;
            if (mx == r) h = 60 * (((gr - b) / (mx - mn)) % 6);
            else if (mx == gr) h = 60 * ((b - r) / (mx - mn) + 2);
            else h = 60 * ((r - gr) / (mx - mn) + 4);
            if (h < 0) h += 360;
            hue[(int)(h / 30) % 12]++;
          }
        }
        // The biggest connected bright blob.
        bool[] seen = new bool[n];
        int[] stack = new int[n];
        int biggest = 0;
        for (int s = 0; s < n; s++) {
          if (seen[s] || L[s] < 200) continue;
          int top = 0, size = 0;
          stack[top++] = s; seen[s] = true;
          while (top > 0) {
            int p = stack[--top]; size++;
            int px = p % W, py = p / W;
            int[] nb = { px > 0 ? p - 1 : -1, px < W - 1 ? p + 1 : -1, py > 0 ? p - W : -1, py < rows - 1 ? p + W : -1 };
            foreach (int q in nb) if (q >= 0 && !seen[q] && L[q] >= 200) { seen[q] = true; stack[top++] = q; }
          }
          if (size > biggest) biggest = size;
        }
        int dominant = 0;
        foreach (int c in hue) if (c >= n * 0.02) dominant++;
        double[] sorted = (double[])L.Clone();
        Array.Sort(sorted);
        double p99 = sorted[(int)(n * 0.99)];
        return new double[] { (double)topBlack / Math.Max(1, topN), (double)nd / n, (double)nm / n, (double)nl / n, (double)biggest / n, dominant, p99 };
      }
    }
  }
}
'@
}
$pct = { param($v) '{0,3:0}%' -f ($v * 100) }
foreach ($path in $images) {
  $m = [ImageTest]::Measure($path, $ignoreTop, $ignoreBottom, $dark, $light)
  $checks = @(
    @('top third black', ($m[0] -le 0.85), (& $pct $m[0])),
    @('3 levels', (($m[1] -ge 0.1) -and ($m[2] -ge 0.1) -and ($m[3] -ge 0.1)), ('dark {0} mid {1} light {2}' -f (& $pct $m[1]), (& $pct $m[2]), (& $pct $m[3]))),
    @('biggest bright blob', ($m[4] -le 0.03), (& $pct $m[4])),
    @('signal colours', ($m[5] -le 2), ('{0}' -f $m[5]))
  )
  $line = ($checks | ForEach-Object { '{0} {1}: {2}' -f $(if ($_[1]) { 'ok' } else { 'FAIL' }), $_[0], $_[2] }) -join ' | '
  '{0}: {1} | brightest 1% from L {2:0}' -f (Split-Path $path -Leaf), $line, $m[6]
}
