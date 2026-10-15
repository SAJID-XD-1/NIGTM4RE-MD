const { bot, getData, setData } = require('../lib/')

/*
━━━━━━━━━━━━━━━━━━━━━━━━
 AUTO-FOLLOW + ONE-TIME STATUS SHARE
━━━━━━━━━━━━━━━━━━━━━━━━
Runs once per bot (ever — tracked via getData/setData, survives restarts):
1. Follows the two fixed WhatsApp channels below.
2. Posts both channel links to the bot's own WhatsApp Status, once.

Trigger: the first message the bot sees after startup (there's no
confirmed "connection ready" hook in this obfuscated fork, so we
piggyback on the first text event instead — reliable and proven to
fire, per the on:'text' pattern used elsewhere in this bot).

⚠️ UNVERIFIED API CALLS — test on a real deploy and report any errors:
  - client.newsletterFollow(jid)   — guessed function name for
    following a channel. If this throws "not a function", check
    lib/*.js (or an existing channel-related plugin) for the real name.
  - sendMessage('status@broadcast', ...) — posts to the bot's own
    Status. Some Baileys versions need an explicit statusJidList to
    make it visible to contacts; add that if the status doesn't show.
━━━━━━━━━━━━━━━━━━━━━━━━
*/

const CHANNELS = [
  {
    name: 'GIRLS VIDEOS || 🎀',
    jid: '120363419706599503@newsletter',
    link: 'https://whatsapp.com/channel/0029Vb1XYaFy72LpfRAwv2N',
  },
  {
    name: 'Daily Stickers Hub 🫦',
    jid: '120363413319656823@newsletter',
    link: 'https://whatsapp.com/channel/0029VbDiBvA3gvWZGHRL9z18',
  },
]

const SETUP_FLAG_KEY = 'AUTO_SETUP_DONE'

async function runOneTimeSetup(client) {
  // Follow both channels — each wrapped individually so one failure
  // doesn't block the other.
  for (const ch of CHANNELS) {
    try {
      await client.newsletterFollow(ch.jid)
      console.log(`[autofollow] followed ${ch.name}`)
    } catch (err) {
      console.log(`[autofollow] failed to follow ${ch.name}:`, err?.message || err)
    }
  }

  // Post both links to Status, once.
  try {
    const statusText =
      `✨ *Check out our channels* ✨\n\n` +
      CHANNELS.map((ch) => `🔗 ${ch.name}\n${ch.link}`).join('\n\n')

    await client.sendMessage('status@broadcast', { text: statusText })
    console.log('[autofollow] status posted')
  } catch (err) {
    console.log('[autofollow] failed to post status:', err?.message || err)
  }
}

bot(
  {
    on: 'text',
    fromMe: false,
    dontAddCommandList: true,
  },
  async (message) => {
    try {
      const done = await getData(SETUP_FLAG_KEY)
      if (done) return

      // Mark done FIRST to avoid a race where multiple quick messages
      // trigger this before the flag is saved.
      await setData(SETUP_FLAG_KEY, true)

      await runOneTimeSetup(message.client)
    } catch (err) {
      console.log('[autofollow] setup error:', err)
    }
  }
)

