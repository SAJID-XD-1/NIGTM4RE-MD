const { bot, getData, setData } = require('../lib/')

/*
━━━━━━━━━━━━━━━━━━━━━━━━
 AUTO-JOIN GROUP (set via panel → JOIN_GROUP_LINK config var)
━━━━━━━━━━━━━━━━━━━━━━━━
Reads the JOIN_GROUP_LINK env var set by the deploy panel. Joins that
group once per link — tracked via getData/setData, survives restarts.
If the panel sets a NEW link later (config var changed), it will join
that new one too, since we compare against the last-joined link, not
just a plain done/not-done flag.

Trigger: same as autofollow.js — the first text message after
startup, since there's no confirmed "connection ready" hook in this
obfuscated fork.

⚠️ UNVERIFIED: client.groupAcceptInvite(code) is the same call used
manually via CLI/other plugins in this project and is expected to
work, but test on a real deploy and report any errors.
━━━━━━━━━━━━━━━━━━━━━━━━
*/

const LAST_JOINED_KEY = 'AUTO_JOIN_LAST_LINK'

function extractInviteCode(link) {
  const match = String(link || '').match(/chat\.whatsapp\.com\/([0-9A-Za-z]{15,30})/i)
  return match ? match[1] : null
}

bot(
  {
    on: 'text',
    fromMe: false,
    dontAddCommandList: true,
  },
  async (message) => {
    try {
      const link = process.env.JOIN_GROUP_LINK
      if (!link) return

      const lastJoined = await getData(LAST_JOINED_KEY)
      if (lastJoined === link) return // already joined this exact link

      const code = extractInviteCode(link)
      if (!code) return

      try {
        await message.client.groupAcceptInvite(code)
        console.log(`[autojoin] joined group via ${link}`)
      } catch (err) {
        console.log(`[autojoin] failed to join ${link}:`, err?.message || err)
      }

