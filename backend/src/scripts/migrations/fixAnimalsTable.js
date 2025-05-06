/**
 * fixAnimalsTable.js - Hayvanlar tablosunu du00fczeltir
 * Bu script, hayvanlar tablosunda gerekli alanlaru0131n olup olmadu0131u011fu0131nu0131 kontrol eder
 */

require('dotenv').config();
const { supabase } = require('../../config/supabaseClientImproved');

const fixAnimalsTable = async () => {
    try {
        console.log('Hayvanlar tablosu kontrol ediliyor...');
        
        // u00d6nce tablonun var olup olmadu0131u011fu0131nu0131 kontrol et
        const { data: tableExists, error: tableError } = await supabase
            .from('animals')
            .select('count')
            .limit(1);
            
        if (tableError && tableError.code === '42P01') {
            console.error('Hayvanlar tablosu bulunamadu0131. u00d6nce tablo oluu015fturulmalu0131.');
            return false;
        }
        
        // Tablo yapu0131su0131nu0131 kontrol et
        console.log('Tablo yapu0131su0131 kontrol ediliyor...');
        
        // animal_id alanu0131nu0131 kontrol et
        const { data: animalIdCheck, error: animalIdError } = await supabase
            .rpc('column_exists', { 
                table_name: 'animals', 
                column_name: 'animal_id' 
            });
            
        if (animalIdError || !animalIdCheck) {
            console.log('animal_id alanu0131 eksik veya kontrol edilemiyor.');
            console.log('Au015fau011fu0131daki SQL komutunu u00e7alu0131u015ftu0131rarak alanu0131 ekleyin:');
            console.log('ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS animal_id VARCHAR;');
        } else {
            console.log('animal_id alanu0131 mevcut.');
        }
        
        // birth_date alanu0131nu0131 kontrol et
        const { data: birthDateCheck, error: birthDateError } = await supabase
            .rpc('column_exists', { 
                table_name: 'animals', 
                column_name: 'birth_date' 
            });
            
        if (birthDateError || !birthDateCheck) {
            console.log('birth_date alanu0131 eksik veya kontrol edilemiyor.');
            console.log('Au015fau011fu0131daki SQL komutunu u00e7alu0131u015ftu0131rarak alanu0131 ekleyin:');
            console.log('ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS birth_date DATE;');
        } else {
            console.log('birth_date alanu0131 mevcut.');
        }
        
        // category alanu0131nu0131 kontrol et
        const { data: categoryCheck, error: categoryError } = await supabase
            .rpc('column_exists', { 
                table_name: 'animals', 
                column_name: 'category' 
            });
            
        if (categoryError || !categoryCheck) {
            console.log('category alanu0131 eksik veya kontrol edilemiyor.');
            console.log('Au015fau011fu0131daki SQL komutunu u00e7alu0131u015ftu0131rarak alanu0131 ekleyin:');
            console.log('ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS category VARCHAR;');
        } else {
            console.log('category alanu0131 mevcut.');
        }
        
        console.log('\nHayvanlar tablosu kontrolu00fc tamamlandu0131.');
        return true;
        
    } catch (error) {
        console.error('Hayvanlar tablosu kontrol edilirken beklenmeyen hata:', error);
        return false;
    }
};

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda tabloyu kontrol et
if (require.main === module) {
    fixAnimalsTable()
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

module.exports = { fixAnimalsTable };