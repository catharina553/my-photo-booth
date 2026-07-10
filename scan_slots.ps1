Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\USER\.gemini\antigravity\scratch\photo-booth\client\public\templates\mt_sheep_word.png")

$w = $img.Width
$h = $img.Height

Write-Host "Image size: $w x $h"

# We search for transparent slot bounds. 
# A transparent pixel has Alpha < 100.
# We will scan rows and columns to find the boundaries of the transparent boxes.

$transparentRows = @()
for ($y = 0; $y -lt $h; $y++) {
    $rowHasTransparency = $false
    for ($x = 0; $x -lt $w; $x++) {
        if ($img.GetPixel($x, $y).A -lt 100) {
            $rowHasTransparency = $true
            break
        }
    }
    if ($rowHasTransparency) { $transparentRows += $y }
}

$transparentCols = @()
for ($x = 0; $x -lt $w; $x++) {
    $colHasTransparency = $false
    for ($y = 0; $y -lt $h; $y++) {
        if ($img.GetPixel($x, $y).A -lt 100) {
            $colHasTransparency = $true
            break
        }
    }
    if ($colHasTransparency) { $transparentCols += $x }
}

if ($transparentRows.Count -gt 0 -and $transparentCols.Count -gt 0) {
    $minY = $transparentRows[0]
    $maxY = $transparentRows[-1]
    $minX = $transparentCols[0]
    $maxX = $transparentCols[-1]
    
    Write-Host "Overall transparent bounding box in 682x1024 coordinates:"
    Write-Host "X range: $minX to $maxX (width: $($maxX - $minX + 1))"
    Write-Host "Y range: $minY to $maxY (height: $($maxY - $minY + 1))"
    
    # Let's find horizontal gap and individual box width.
    # Scan middle row to find boundary where transparency stops and starts again.
    $midY = [int](($minY + $maxY) / 2)
    $transitionX = @()
    $prevA = $img.GetPixel(0, $midY).A
    for ($x = 1; $x -lt $w; $x++) {
        $currA = $img.GetPixel($x, $midY).A
        if (($prevA -lt 100 -and $currA -ge 100) -or ($prevA -ge 100 -and $currA -lt 100)) {
            $transitionX += $x
        }
        $prevA = $currA
    }
    Write-Host "Horizontal transitions at Y=$midY : $($transitionX -join ', ')"
    
    # Scan middle column to find vertical gap
    $midX = [int](($minX + $maxX) / 2)
    $transitionY = @()
    $prevA = $img.GetPixel($midX, 0).A
    for ($y = 1; $y -lt $h; $y++) {
        $currA = $img.GetPixel($midX, $y).A
        if (($prevA -lt 100 -and $currA -ge 100) -or ($prevA -ge 100 -and $currA -lt 100)) {
            $transitionY += $y
        }
        $prevA = $currA
    }
    Write-Host "Vertical transitions at X=$midX : $($transitionY -join ', ')"
} else {
    Write-Host "No transparent pixels found!"
}

$img.Dispose()
