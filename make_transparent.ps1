Add-Type -AssemblyName System.Drawing

$filePath = "C:\Users\USER\.\.gemini\antigravity\scratch\photo-booth\client\public\templates\mt_sheep_word.png"

if (Test-Path $filePath) {
    Write-Host "Loading image..."
    $bmp = [System.Drawing.Bitmap]::FromFile($filePath)
    $newBmp = [System.Drawing.Bitmap]::new($bmp.Width, $bmp.Height)
    $g = [System.Drawing.Graphics]::FromImage($newBmp)
    $g.DrawImage($bmp, 0, 0)
    $bmp.Dispose()

    Write-Host "Processing pixels (Width: $($newBmp.Width), Height: $($newBmp.Height))..."
    # Convert pixels that are black (or very close to black) to transparent
    for ($y = 0; $y -lt $newBmp.Height; $y++) {
        for ($x = 0; $x -lt $newBmp.Width; $x++) {
            $color = $newBmp.GetPixel($x, $y)
            # Check if it is black/dark gray (R < 15, G < 15, B < 15)
            if ($color.R -lt 15 -and $color.G -lt 15 -and $color.B -lt 15) {
                # Set to transparent (Alpha = 0)
                $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }

    Write-Host "Saving image..."
    # Force saving as PNG with alpha support
    $newBmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newBmp.Dispose()
    $g.Dispose()
    Write-Host "Successfully converted black regions to transparent!"
} else {
    Write-Warning "File not found: $filePath"
}
