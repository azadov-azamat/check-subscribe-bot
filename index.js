const { Telegraf, session, Markup } = require('telegraf')
const LocalSession = require('telegraf-session-local');
const bot = new Telegraf('2022383628:AAHlMP4ogpKuJ_vawGtakFXaN36H9va7Hwk');

const channels = ['@search_testa_uz', '@search_testa3_uz', '@search_testa2_uz'];

// Foydalanuvchi kanallarga a'zo bo'lganligini tekshirish
async function checkUserMembership(userId, channels) {
    const results = {};
    for (const channel of channels) {
        const chatMember = await bot.telegram.getChatMember(channel, userId);
        results[channel] = chatMember.status !== 'left';
    }
    return results;
}

// Local session middleware
const localSession = new LocalSession({ database: 'session_db.json' });
bot.use(localSession.middleware());

bot.start(async (ctx) => {
    await handleSubscriptionCheck(ctx);
});

bot.action('check_subscription', async (ctx) => {
    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    await handleSubscriptionCheck(ctx);
});

async function handleSubscriptionCheck(ctx) {
    const userId = ctx.from.id;
    const membership = await checkUserMembership(userId, channels);

    const notSubscribedChannels = Object.keys(membership).filter(channel => !membership[channel]);

    if (notSubscribedChannels.length === 0) {
        ctx.reply('Xush kelibsiz!');
    } else {
        const buttons = notSubscribedChannels.map(channel => [Markup.button.url(`Obuna bo'lish ${channel}`, `https://t.me/${channel.replace('@', '')}`)]);
        buttons.push([Markup.button.callback('Tekshirish', 'check_subscription')]);
        const message = await ctx.reply(
            'Iltimos, quyidagi kanallarga obuna bo\'ling:',
            Markup.inlineKeyboard(buttons)
        );
        ctx.session.messageId = message.message_id;
    }
}

// Har qanday action uchun middleware
bot.use(async (ctx, next) => {
    const userId = ctx.from.id;
    const membership = await checkUserMembership(userId, channels);

    const notSubscribedChannels = Object.keys(membership).filter(channel => !membership[channel]);

    if (notSubscribedChannels.length === 0) {
        await next();
    } else {
        const buttons = notSubscribedChannels.map(channel => [Markup.button.url(`Obuna bo'lish ${channel}`, `https://t.me/${channel.replace('@', '')}`)]);
        buttons.push([Markup.button.callback('Tekshirish', 'check_subscription')]);
        const message = await ctx.reply(
            'Iltimos, quyidagi kanallarga obuna bo\'ling:',
            Markup.inlineKeyboard(buttons)
        );
        ctx.session.messageId = message.message_id;
    }
});

// Rasm, video yoki tekst yuborganda handle qilish
bot.on(['text', 'photo', 'video'], async (ctx) => {
    ctx.reply('Siz barcha kanallarga obuna bo\'lgansiz!');
});

bot.launch();