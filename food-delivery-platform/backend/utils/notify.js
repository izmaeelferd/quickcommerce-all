const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPush } = require('./push');
const { sendEmail } = require('./email');
const { sendSms } = require('./sms');
const { getTranslator } = require('./i18n');

/**
 * Sends a notification to a single user on all permitted channels and stores it in-app.
 * `titleKey` / `bodyKey` are translation keys resolved in the user's language.
 */
async function notifyUser(userId, { titleKey, bodyKey, vars = {}, title, body, type = 'general', data = {}, channels = ['push', 'inapp'] }) {
  const user = await User.findById(userId).select('+fcmTokens email phone language notificationPrefs');
  if (!user) return null;
  const t = await getTranslator(user.language);
  const finalTitle = titleKey ? t(titleKey, vars) : title;
  const finalBody = bodyKey ? t(bodyKey, vars) : body;

  const notif = await Notification.create({ user: user._id, audience: 'user', title: finalTitle, body: finalBody, type, data, channels });
  const jobs = [];
  if (channels.includes('push') && user.notificationPrefs.push) {
    jobs.push(
      sendPush({ tokens: user.fcmTokens, title: finalTitle, body: finalBody, data: { ...data, type, notificationId: notif._id.toString() } }).then(
        async (r) => {
          if (r && r.invalid && r.invalid.length) await User.updateOne({ _id: user._id }, { $pull: { fcmTokens: { $in: r.invalid } } });
        }
      )
    );
  }
  if (channels.includes('email') && user.email && user.notificationPrefs.email) jobs.push(sendEmail({ to: user.email, subject: finalTitle, text: finalBody }));
  if (channels.includes('sms') && user.phone && user.notificationPrefs.sms) jobs.push(sendSms({ to: user.phone, body: `${finalTitle}: ${finalBody}` }));
  await Promise.allSettled(jobs);
  return notif;
}

module.exports = { notifyUser };
