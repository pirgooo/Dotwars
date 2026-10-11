Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot "assets"
$blue = [Drawing.Color]::FromArgb(48, 70, 255)
$white = [Drawing.Color]::White
$soft = [Drawing.Color]::FromArgb(180, 255, 255, 255)
$pen = [Drawing.Pen]::new($white, 3)
$thin = [Drawing.Pen]::new($soft, 1)
$brush = [Drawing.SolidBrush]::new($white)
$softBrush = [Drawing.SolidBrush]::new($soft)

function Draw-Line($g, $x1, $y1, $x2, $y2, $width = 3) {
  $p = [Drawing.Pen]::new($white, $width)
  $g.DrawLine($p, $x1, $y1, $x2, $y2)
  $p.Dispose()
}

function Draw-FoldMark($g) {
  Draw-Line $g 80 118 80 78 2
  Draw-Line $g 80 78 120 78 2
  Draw-Line $g 80 78 100 98 2
  Draw-Line $g 100 98 120 78 2
  Draw-Line $g 100 98 100 118 2
}

function Draw-Crystal($g) {
  $pts = @(
    [Drawing.Point]::new(790, 155),
    [Drawing.Point]::new(960, 275),
    [Drawing.Point]::new(900, 515),
    [Drawing.Point]::new(680, 515),
    [Drawing.Point]::new(620, 275)
  )
  $g.DrawPolygon($pen, $pts)
  Draw-Line $g 790 155 790 515
  Draw-Line $g 620 275 960 275
  Draw-Line $g 680 515 790 275
  Draw-Line $g 790 275 900 515
}

function Draw-Map($g) {
  $cells = @(
    @([Drawing.Point]::new(660,180),[Drawing.Point]::new(815,140),[Drawing.Point]::new(900,235),[Drawing.Point]::new(850,360),[Drawing.Point]::new(690,370),[Drawing.Point]::new(610,275)),
    @([Drawing.Point]::new(690,370),[Drawing.Point]::new(850,360),[Drawing.Point]::new(910,490),[Drawing.Point]::new(795,585),[Drawing.Point]::new(625,530)),
    @([Drawing.Point]::new(900,235),[Drawing.Point]::new(1010,205),[Drawing.Point]::new(1040,350),[Drawing.Point]::new(850,360))
  )
  foreach ($cell in $cells) { $g.DrawPolygon($pen, $cell) }
  $g.DrawEllipse($pen, 730, 245, 44, 44)
  $g.DrawEllipse($pen, 740, 440, 44, 44)
  $dash = [Drawing.Pen]::new($white, 4)
  $dash.DashPattern = @(3, 4)
  $g.DrawLine($dash, 775, 267, 855, 267)
  $dash.Dispose()
}

function Draw-Duel($g) {
  $g.DrawEllipse($thin, 650, 150, 350, 350)
  Draw-Line $g 825 170 825 480
  Draw-Line $g 825 325 690 220
  Draw-Line $g 825 325 690 430
  Draw-Line $g 825 325 960 220
  Draw-Line $g 825 325 960 430
  $g.FillEllipse($brush, 680, 310, 30, 30)
  $g.FillEllipse($brush, 940, 310, 30, 30)
}

function Draw-Bots($g) {
  $pts = @(
    [Drawing.Point]::new(800,155),
    [Drawing.Point]::new(960,270),
    [Drawing.Point]::new(905,515),
    [Drawing.Point]::new(695,515),
    [Drawing.Point]::new(640,270)
  )
  $g.DrawPolygon($pen, $pts)
  Draw-Line $g 800 155 800 515
  Draw-Line $g 640 270 960 270
  Draw-Line $g 695 515 800 270
  Draw-Line $g 800 270 905 515
  $g.FillEllipse($brush, 600, 180, 16, 16)
  $g.FillEllipse($softBrush, 990, 430, 12, 12)
}

$cards = @(
  @{ File = "dotwars-card-01-three-minutes.png"; Index = "01 / 04"; Eyebrow = "TERRITORY RTS"; Lines = @("Three minutes.", "One map."); Serif = $true; Footer = "T.ME/DOTWARS_BOT/DOTWARS"; Art = "crystal" },
  @{ File = "dotwars-card-02-one-swipe.png"; Index = "02 / 04"; Eyebrow = "ONE MOVE"; Lines = @("ONE SWIPE.", "THE WHOLE", "GARRISON."); Serif = $false; Footer = "PLAY IN TELEGRAM"; Art = "map" },
  @{ File = "dotwars-card-03-invite-a-friend.png"; Index = "03 / 04"; Eyebrow = "PRIVATE PVP"; Lines = @("INVITE A FRIEND.", "LEAVE THEM", "ZERO BASES."); Serif = $false; Footer = "INVITE > PLAY > WIN"; Art = "duel" },
  @{ File = "dotwars-card-04-bots.png"; Index = "04 / 04"; Eyebrow = "VS BOTS"; Lines = @("BOTS DO NOT", "RAGE QUIT."); Serif = $false; Footer = "WARM UP NOW"; Art = "bots" }
)

foreach ($card in $cards) {
  $bmp = [Drawing.Bitmap]::new(1080, 1080)
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($blue)
  $g.DrawRectangle($thin, 30, 30, 1020, 1020)

  Draw-FoldMark $g
  $brandFont = [Drawing.Font]::new("Segoe UI", 20, [Drawing.FontStyle]::Bold)
  $smallFont = [Drawing.Font]::new("Segoe UI", 16, [Drawing.FontStyle]::Regular)
  $eyebrowFont = [Drawing.Font]::new("Segoe UI", 18, [Drawing.FontStyle]::Bold)
  $footerFont = [Drawing.Font]::new("Segoe UI", 14, [Drawing.FontStyle]::Regular)
  $g.DrawString("dot wars", $brandFont, $brush, 140, 81)
  $g.DrawString($card.Index, $smallFont, $brush, 914, 81)

  switch ($card.Art) {
    "crystal" { Draw-Crystal $g }
    "map" { Draw-Map $g }
    "duel" { Draw-Duel $g }
    "bots" { Draw-Bots $g }
  }

  $g.DrawString($card.Eyebrow, $eyebrowFont, $brush, 80, 520)
  $titleFont = if ($card.Serif) {
    [Drawing.Font]::new("Georgia", 88, [Drawing.FontStyle]::Regular)
  } else {
    [Drawing.Font]::new("Segoe UI", 72, [Drawing.FontStyle]::Bold)
  }
  $lineHeight = if ($card.Serif) { 96 } else { 78 }
  $y = 565
  foreach ($line in $card.Lines) {
    $g.DrawString($line, $titleFont, $brush, 76, $y)
    $y += $lineHeight
  }

  $g.DrawString($card.Footer, $footerFont, $brush, 80, 990)
  $right = if ($card.File -like "*bots*") { "v0.3.1" } else { "WE LOVE DOTS" }
  $rightSize = $g.MeasureString($right, $footerFont)
  $g.DrawString($right, $footerFont, $softBrush, 1000 - $rightSize.Width, 990)

  $target = Join-Path $out $card.File
  $bmp.Save($target, [Drawing.Imaging.ImageFormat]::Png)
  $titleFont.Dispose()
  $brandFont.Dispose()
  $smallFont.Dispose()
  $eyebrowFont.Dispose()
  $footerFont.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

$pen.Dispose()
$thin.Dispose()
$brush.Dispose()
$softBrush.Dispose()
