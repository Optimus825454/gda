/**
 * runMigrations.js - Tu00fcm migrasyon betiklerini u00e7alu0131u015ftu0131ru0131r
 */

require('dotenv').config();
const { fixSettingsTable } = require('./migrations/fixSettingsTable');
const { fixUsersTable } = require('./migrations/fixUsersTable');
const { fixPermissionsTable } = require('./migrations/fixPermissionsTable');

const runMigrations = async () => {
    try {
        console.log('Veritabanu0131 migrasyonlaru0131 bau015flatu0131lu0131yor...');
        
        // Settings tablosunu du00fczelt
        console.log('\n1. Settings tablosu du00fczeltiliyor...');
        const settingsResult = await fixSettingsTable();
        if (settingsResult) {
            console.log('u2705 Settings tablosu du00fczeltildi');
        } else {
            console.error('u274C Settings tablosu du00fczeltilirken sorun oluu015ftu');
            console.log('Lu00fctfen Supabase yu00f6netim panelinden SQL sorgularu0131nu0131 manuel olarak u00e7alu0131u015ftu0131ru0131n.');
        }
        
        // Users tablosunu du00fczelt
        console.log('\n2. Users tablosu du00fczeltiliyor...');
        const usersResult = await fixUsersTable();
        if (usersResult) {
            console.log('u2705 Users tablosu du00fczeltildi');
        } else {
            console.error('u274C Users tablosu du00fczeltilirken sorun oluu015ftu');
            console.log('Lu00fctfen Supabase yu00f6netim panelinden SQL sorgularu0131nu0131 manuel olarak u00e7alu0131u015ftu0131ru0131n.');
        }
        
        // Permissions tablosunu du00fczelt
        console.log('\n3. Permissions tablosu du00fczeltiliyor...');
        const permissionsResult = await fixPermissionsTable();
        if (permissionsResult) {
            console.log('u2705 Permissions tablosu du00fczeltildi');
        } else {
            console.error('u274C Permissions tablosu du00fczeltilirken sorun oluu015ftu');
            console.log('Lu00fctfen Supabase yu00f6netim panelinden SQL sorgularu0131nu0131 manuel olarak u00e7alu0131u015ftu0131ru0131n.');
        }
        
        console.log('\nMigrasyonlar tamamlandu0131');
        
        if (!settingsResult || !usersResult || !permissionsResult) {
            console.log('\nBazu0131 migrasyonlar bau015faru0131su0131z oldu. Lu00fctfen Supabase yu00f6netim panelinden SQL sorgularu0131nu0131 manuel olarak u00e7alu0131u015ftu0131ru0131n.');
            console.log('Supabase SQL Editoru00fc: https://supabase.com/dashboard/project/[PROJECT_ID]/sql');
        }
        
        return settingsResult && usersResult && permissionsResult;
        
    } catch (error) {
        console.error('Migrasyon u00e7alu0131u015ftu0131rma hatasu0131:', error);
        return false;
    }
};

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda migrasyonlaru0131 u00e7alu0131u015ftu0131r
if (require.main === module) {
    runMigrations()
        .then(result => {
            if (result) {
                console.log('Tu00fcm migrasyonlar bau015faru0131yla tamamlandu0131');
                process.exit(0);
            } else {
                console.error('Bazu0131 migrasyonlar bau015faru0131su0131z oldu');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Beklenmeyen hata:', error);
            process.exit(1);
        });
}

module.exports = { runMigrations };