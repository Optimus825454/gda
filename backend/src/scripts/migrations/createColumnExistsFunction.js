/**
 * createColumnExistsFunction.js - Bir tabloda su00fctun olup olmadu0131u011fu0131nu0131 kontrol eden fonksiyon oluu015fturur
 */

require('dotenv').config();
const { supabase } = require('../../config/supabaseClientImproved');

const createColumnExistsFunction = async () => {
    try {
        console.log('column_exists fonksiyonu oluu015fturuluyor...');
        
        // SQL fonksiyonunu oluu015ftur
        const { error } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE OR REPLACE FUNCTION public.column_exists(table_name text, column_name text)
                RETURNS boolean
                LANGUAGE plpgsql
                AS $$
                DECLARE
                    exists_bool boolean;
                BEGIN
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                        AND table_name = $1
                        AND column_name = $2
                    ) INTO exists_bool;
                    
                    RETURN exists_bool;
                END;
                $$;
            `
        });
        
        if (error) {
            console.error('Fonksiyon oluu015fturulurken hata:', error);
            return false;
        }
        
        console.log('column_exists fonksiyonu bau015faru0131yla oluu015fturuldu.');
        return true;
        
    } catch (error) {
        console.error('Fonksiyon oluu015fturulurken beklenmeyen hata:', error);
        return false;
    }
};

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda fonksiyonu oluu015ftur
if (require.main === module) {
    createColumnExistsFunction()
        .then(result => {
            if (result) {
                console.log('u0130u015flem bau015faru0131lu0131');
                process.exit(0);
            } else {
                console.error('u0130u015flem bau015faru0131su0131z');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Beklenmeyen hata:', error);
            process.exit(1);
        });
}

module.exports = { createColumnExistsFunction };