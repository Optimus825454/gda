/**
 * initPermissions.js - Tu00fcm izinleri bau015flatan ana script
 */

require('dotenv').config();
const { initSystemAdminPagePermissions } = require('./permissions/initSystemAdminPermissions');

async function initAllPermissions() {
    try {
        console.log('Tu00fcm izinler bau015flatu0131lu0131yor...');
        
        // SYSTEM_ADMIN rolu00fc iu00e7in sayfa izinlerini bau015flat
        await initSystemAdminPagePermissions();
        
        console.log('Tu00fcm izinler bau015faru0131yla bau015flatu0131ldu0131.');
    } catch (error) {
        console.error('u0130zinler bau015flatu0131lu0131rken hata:', error);
        throw error;
    }
}

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda
if (require.main === module) {
    initAllPermissions()
        .then(() => {
            console.log('u0130u015flem bau015faru0131yla tamamlandu0131.');
            process.exit(0);
        })
        .catch(error => {
            console.error('u0130u015flem su0131rasu0131nda hata oluu015ftu:', error);
            process.exit(1);
        });
}

module.exports = { initAllPermissions };