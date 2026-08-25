param(
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$WebAppUrl = 'https://trashhh14.github.io/find-me-quest/'
)

$apiBase = "https://api.telegram.org/bot$Token"
$imagePath = Join-Path $PSScriptRoot 'public/assets/quest-invitation.png'
$welcomeText = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('0KLQtdCx0LUg0L/RgNC10LTRgdGC0L7QuNGCINC80LXQvdGPINC90LDQudGC0LguINCV0YHQu9C4INCz0L7RgtC+0LLQsCDigJQg0LbQvNC4IMKr0JjRgdC60LDRgtGMwrsu'))
$buttonText = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('0J7RgtC60YDRi9GC0Ywg0LrQstC10YHRgiDinKY='))
$menuText = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('0JrQstC10YHRgg=='))
if ($WebAppUrl -and -not $WebAppUrl.EndsWith('/')) { $WebAppUrl = "$WebAppUrl/" }

function Invoke-Telegram([string]$Method, [hashtable]$Body) {
  $json = $Body | ConvertTo-Json -Depth 8 -Compress
  $utf8Body = [Text.Encoding]::UTF8.GetBytes($json)
  Invoke-RestMethod -Method Post -Uri "$apiBase/$Method" -ContentType 'application/json; charset=utf-8' -Body $utf8Body
}

function Send-QuestPhoto([Int64]$ChatId, [hashtable]$ReplyMarkup) {
  $form = @{
    chat_id = "$ChatId"
    photo = Get-Item -LiteralPath $imagePath
    caption = $welcomeText
  }
  if ($ReplyMarkup) { $form.reply_markup = $ReplyMarkup | ConvertTo-Json -Compress -Depth 8 }
  Invoke-RestMethod -Method Post -Uri "$apiBase/sendPhoto" -Form $form | Out-Null
}

function Test-StartCommand($text) {
  if (-not $text) { return $false }
  return [bool]($text.Trim() -match '^/start(@[A-Za-z0-9_]+)?(\s|$)')
}

Invoke-Telegram 'deleteWebhook' @{ drop_pending_updates = $false } | Out-Null
if ($WebAppUrl) {
  Invoke-Telegram 'setChatMenuButton' @{
    menu_button = @{
      type = 'web_app'
      text = $menuText
      web_app = @{ url = $WebAppUrl }
    }
  } | Out-Null
}
Write-Host "Telegram long polling is running. Mini App: $WebAppUrl"
$offset = 0
while ($true) {
  try {
    $updates = (Invoke-Telegram 'getUpdates' @{ offset = $offset; timeout = 25 }).result
    foreach ($update in $updates) {
      $offset = $update.update_id + 1
      if (-not (Test-StartCommand $update.message.text)) { continue }
      $replyMarkup = $null
      if ($WebAppUrl) {
        $button = @{ text = $buttonText; web_app = @{ url = $WebAppUrl } }
        $row = ,$button
        $replyMarkup = @{ inline_keyboard = ,$row }
      }
      Send-QuestPhoto $update.message.chat.id $replyMarkup
      Write-Host "Sent quest invitation to chat $($update.message.chat.id)."
    }
  } catch {
    Write-Warning "Telegram polling error: $($_.Exception.Message)"
    Start-Sleep -Seconds 3
  }
}
