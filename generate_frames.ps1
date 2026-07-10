Add-Type -AssemblyName System.Drawing

$W = 1200
$H = 1800

# Colors
$bgColor = [System.Drawing.Color]::White
$slotFill = [System.Drawing.Color]::White
$slotBorder = [System.Drawing.Color]::FromArgb(200, 200, 200)
$labelColor = [System.Drawing.Color]::FromArgb(170, 170, 170)
$textColor = [System.Drawing.Color]::FromArgb(100, 100, 100)
$dashColor = [System.Drawing.Color]::FromArgb(180, 180, 180)

function Draw-Slot($g, $x, $y, $w, $h, $label) {
    $rect = [System.Drawing.RectangleF]::new($x, $y, $w, $h)
    $g.FillRectangle([System.Drawing.Brushes]::White, $rect)
    $pen = [System.Drawing.Pen]::new($slotBorder, 3)
    $g.DrawRectangle($pen, $x, $y, $w, $h)
    $pen.Dispose()

    $font = [System.Drawing.Font]::new("Arial", 28, [System.Drawing.FontStyle]::Regular)
    $sf = [System.Drawing.StringFormat]::new()
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $brush = [System.Drawing.SolidBrush]::new($labelColor)
    $g.DrawString($label, $font, $brush, $rect, $sf)
    $font.Dispose()
    $sf.Dispose()
    $brush.Dispose()
}

function Draw-FooterText($g, $text) {
    $font = [System.Drawing.Font]::new("Arial", 24, [System.Drawing.FontStyle]::Regular)
    $sf = [System.Drawing.StringFormat]::new()
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $brush = [System.Drawing.SolidBrush]::new($textColor)
    $rect = [System.Drawing.RectangleF]::new(0, ($H - 60), $W, 50)
    $g.DrawString($text, $font, $brush, $rect, $sf)
    $font.Dispose()
    $sf.Dispose()
    $brush.Dispose()
}

# ══════════════════════════════════════════════
# 1. 2x6 세로 스트립 PNG
# ══════════════════════════════════════════════
$bmp1 = [System.Drawing.Bitmap]::new($W, $H)
$bmp1.SetResolution(300, 300)
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.Clear($bgColor)
$g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g1.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

$stripWidth = 540
$paddingX = 40
$gapX = 40
$leftX1 = $paddingX
$leftX2 = $paddingX + $stripWidth + $gapX

$photoW = 480
$photoH = 340
$photoGapY = 24
$startY = 60

foreach ($stripX in @($leftX1, $leftX2)) {
    $photoStartX = $stripX + ($stripWidth - $photoW) / 2
    for ($i = 0; $i -lt 4; $i++) {
        $py = $startY + $i * ($photoH + $photoGapY)
        Draw-Slot $g1 $photoStartX $py $photoW $photoH "Photo $($i+1)"
    }
}

# Center dashed cut line
$pen = [System.Drawing.Pen]::new($dashColor, 2)
$pen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$g1.DrawLine($pen, ($W / 2), 40, ($W / 2), ($H - 80))
$pen.Dispose()

Draw-FooterText $g1 "2×6 세로 4컷 스트립  |  1200 × 1800 px  |  300 DPI  |  4×6인치"

$out1 = "C:\Users\USER\.gemini\antigravity\scratch\photo-booth\frame_2x6_strip_white.png"
$bmp1.Save($out1, [System.Drawing.Imaging.ImageFormat]::Png)
$g1.Dispose()
$bmp1.Dispose()
Write-Host "Saved: $out1"

# ══════════════════════════════════════════════
# 2. 2x2 엽서 그리드 PNG
# ══════════════════════════════════════════════
$bmp2 = [System.Drawing.Bitmap]::new($W, $H)
$bmp2.SetResolution(300, 300)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.Clear($bgColor)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g2.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

$gPhotoW = 510
$gPhotoH = 660
$gGapX = 40
$gGapY = 40
$gStartX = ($W - ($gPhotoW * 2 + $gGapX)) / 2
$gStartY = 150

for ($i = 0; $i -lt 4; $i++) {
    $col = $i % 2
    $row = [Math]::Floor($i / 2)
    $px = $gStartX + $col * ($gPhotoW + $gGapX)
    $py = $gStartY + $row * ($gPhotoH + $gGapY)
    Draw-Slot $g2 $px $py $gPhotoW $gPhotoH "Photo $($i+1)"
}

Draw-FooterText $g2 "2×2 엽서 그리드  |  1200 × 1800 px  |  300 DPI  |  4×6인치"

$out2 = "C:\Users\USER\.gemini\antigravity\scratch\photo-booth\frame_2x2_grid_white.png"
$bmp2.Save($out2, [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose()
$bmp2.Dispose()
Write-Host "Saved: $out2"

Write-Host "Done! Both PNG files created."
