Add-Type -AssemblyName System.Drawing

function New-AppIcon {
    param([int]$size, [string]$path)

    $bg     = [System.Drawing.Color]::FromArgb(26, 26, 46)    # #1a1a2e
    $accent = [System.Drawing.Color]::FromArgb(233, 77, 107)  # #e94d6b
    $white  = [System.Drawing.Color]::White

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode    = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bgBrush = New-Object System.Drawing.SolidBrush($bg)
    $radius  = [int]($size * 0.22)
    $rect    = New-Object System.Drawing.Rectangle(0, 0, $size, $size)

    $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path2.AddArc($rect.X,                $rect.Y,                $d, $d, 180, 90)
    $path2.AddArc($rect.Right - $d,       $rect.Y,                $d, $d, 270, 90)
    $path2.AddArc($rect.Right - $d,       $rect.Bottom - $d,      $d, $d,   0, 90)
    $path2.AddArc($rect.X,                $rect.Bottom - $d,      $d, $d,  90, 90)
    $path2.CloseFigure()
    $g.FillPath($bgBrush, $path2)

    $accBrush = New-Object System.Drawing.SolidBrush($accent)
    $barW = [int]($size * 0.68)
    $barH = [int]($size * 0.10)
    $barX = [int](($size - $barW) / 2)
    $barY = [int]($size * 0.72)
    $barRect = New-Object System.Drawing.Rectangle($barX, $barY, $barW, $barH)
    $g.FillRectangle($accBrush, $barRect)

    $fontSize = [single]($size * 0.34)
    $font  = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush($white)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF(0, [single]($size * 0.10), [single]$size, [single]($size * 0.55))
    $g.DrawString('-10', $font, $textBrush, $textRect, $sf)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $bgBrush.Dispose(); $accBrush.Dispose(); $textBrush.Dispose(); $font.Dispose(); $path2.Dispose()
    Write-Host "Saved $path ($size x $size)"
}

$root = Split-Path -Parent $PSScriptRoot
$icons = Join-Path $root 'icons'
if (-not (Test-Path $icons)) { New-Item -ItemType Directory -Path $icons | Out-Null }

New-AppIcon -size 192 -path (Join-Path $icons 'icon-192.png')
New-AppIcon -size 512 -path (Join-Path $icons 'icon-512.png')
