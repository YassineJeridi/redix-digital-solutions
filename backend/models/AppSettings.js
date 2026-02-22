import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const appSettingsSchema = new mongoose.Schema({
    // Passkey used to bypass the 404 screen and access the login page
    passkey: {
        type: String,
        default: 'redix2024'
    },
    // Telegram notification settings
    telegramBotToken: {
        type: String,
        default: ''
    },
    telegramChatId: {
        type: String,
        default: ''
    },
    // Singleton marker
    _singleton: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Static method to get or create the singleton settings document
// Also backfills default values for fields added after the document was first created
appSettingsSchema.statics.getInstance = async function () {
    let settings = await this.findOne({ _singleton: true });
    if (!settings) {
        settings = await this.create({ _singleton: true, passkey: 'redix2024' });
    }

    // Backfill passkey for documents created before this field existed
    if (!settings.passkey) {
        settings.passkey = 'redix2024';
        await settings.save();
    }

    return settings;
};

export default mongoose.model('AppSettings', appSettingsSchema);
