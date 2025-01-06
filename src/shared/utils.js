function isAdmin(ctx) {
    const {id: userId} = ctx.from
    const ifAdmin = userId.toString() === ADMIN_ID

    if (!ifAdmin) {
        ctx.reply(errors.unknown);
    }

    return ifAdmin
}

function sendErrorToAdmin(err) {
    bot.telegram.sendMessage(ADMIN_ID, `Something went wrong. ${err}`)
        .catch(() => {});
}

function initSession(ctx) {
    if (ctx.session == null) {
        ctx.session = {};
    }
}

function clearSession(ctx) {
    const {id: userId} = ctx.from

    if (ctx.session != null) {
        ctx.session[userId] = {}
    }
}


module.exports = {
    isAdmin,
    sendErrorToAdmin,
    initSession,
    clearSession
}