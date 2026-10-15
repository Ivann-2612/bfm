# Regenerates public/og-sr.png and public/og-en.png (link previews, 1200x630).
# Run after changing the festival name, dates or venue:  powershell -ExecutionPolicy Bypass -File scripts/make-og.ps1
# Texts are in scripts/og-text.json (keep them in sync with content/*.json).
Add-Type -AssemblyName System.Drawing
$root = "C:\Users\ivan.nikolic\OneDrive - FINCORE LTD\Desktop\golden"
$texts = Get-Content "$root\scripts\og-text.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$scene = [System.Drawing.Image]::FromFile("$root\public\images\naslovna-scena.jpg")

function Color($hex, $a = 255) {
  $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return [System.Drawing.Color]::FromArgb($a, $c.R, $c.G, $c.B)
}

# Largest font size (from $start down) at which $text fits in $maxWidth.
function Fit($g, $text, $family, $style, $start, $maxWidth) {
  for ($s = $start; $s -gt 20; $s -= 2) {
    $f = New-Object System.Drawing.Font($family, $s, $style, [System.Drawing.GraphicsUnit]::Pixel)
    if ($g.MeasureString($text, $f).Width -le $maxWidth) { return $f }
    $f.Dispose()
  }
  return New-Object System.Drawing.Font($family, 20, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

foreach ($lang in @("sr", "en")) {
  $t = $texts.$lang
  $W = 1200; $H = 630; $imgX = 560
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "HighQuality"
  $g.InterpolationMode = "HighQualityBicubic"
  $g.TextRenderingHint = "AntiAliasGridFit"
  $g.Clear((Color "#0D0B0A"))

  # Stage photo on the right: centre crop of the text-free poster scene.
  $srcW = [int](($W - $imgX) * $scene.Height / $H)
  $srcX = [int](($scene.Width - $srcW) / 2)
  $g.DrawImage($scene, (New-Object System.Drawing.Rectangle $imgX, 0, ($W - $imgX), $H), (New-Object System.Drawing.Rectangle $srcX, 0, $srcW, $scene.Height), "Pixel")

  # Fade the photo into the dark text side.
  $fade = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Point ($imgX - 1), 0), (New-Object System.Drawing.Point ($imgX + 260), 0), (Color "#0D0B0A"), (Color "#0D0B0A" 0))
  $g.FillRectangle($fade, $imgX - 1, 0, 261, $H)

  $left = 72; $maxW = $imgX - $left - 20
  $gold = New-Object System.Drawing.SolidBrush (Color "#C8A04B")
  $bone = New-Object System.Drawing.SolidBrush (Color "#EEE7D8")
  $smoke = New-Object System.Drawing.SolidBrush (Color "#9A8F80")
  $velvet = New-Object System.Drawing.SolidBrush (Color "#C0394A")

  $kick = New-Object System.Drawing.Font("Consolas", 20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($t.kicker, $kick, $gold, $left, 118)

  $f1 = Fit $g $t.line1 "Georgia" ([System.Drawing.FontStyle]::Italic) 84 $maxW
  $f2 = Fit $g $t.line2 "Georgia" ([System.Drawing.FontStyle]::Regular) 84 $maxW
  $size = [Math]::Min($f1.Size, $f2.Size)
  $f1 = New-Object System.Drawing.Font("Georgia", $size, [System.Drawing.FontStyle]::Italic, [System.Drawing.GraphicsUnit]::Pixel)
  $f2 = New-Object System.Drawing.Font("Georgia", $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($t.line1, $f1, $gold, $left - 4, 160)
  $g.DrawString($t.line2, $f2, $bone, $left - 4, 160 + $size * 1.08)

  # Date line with the site's day suits: spade (black) and heart (red).
  $y = 160 + $size * 2.3 + 18
  $sym = New-Object System.Drawing.Font("Segoe UI Symbol", 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString([string][char]0x2660, $sym, $bone, $left, $y)
  $g.DrawString([string][char]0x2665, $sym, $velvet, $left + 30, $y)
  $dateF = New-Object System.Drawing.Font("Georgia", 32, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($t.date, $dateF, $bone, $left + 72, $y + 2)

  $pen = New-Object System.Drawing.Pen((Color "#C8A04B" 120), 1)
  $g.DrawLine($pen, $left, 520, $imgX - 40, 520)
  $foot = New-Object System.Drawing.Font("Consolas", 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($t.foot, $foot, $smoke, $left, 540)

  $bmp.Save("$root\public\og-$lang.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  "og-$lang.png: title size $size"
}
$scene.Dispose()
