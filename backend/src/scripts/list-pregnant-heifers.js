/**
 * Gebe düveleri ve benzer kriterlere uyan hayvanları listelemek için kapsamlı bir script
 */

const { supabaseAdmin } = require('../config/supabase');

async function listPregnantHeifers() {
  try {
    console.log('=== GEBE DÜVE RAPORU ===');
    console.log('Veritabanında çeşitli kriterlere uyan hayvanlar listeleniyor...\n');

    // 1. Tam olarak "Gebe Düve" kategorisine sahip hayvanlar
    console.log('1. KATEGORİSİ "GEBE DÜVE" OLAN HAYVANLAR:');
    const { data: exactMatchData, error: exactMatchError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet, gender, purpose')
      .or('category.eq.Gebe Düve,category.eq.GEBE DÜVE,category.eq.gebe düve,category.eq.Gebe Duve,category.eq.GEBE DUVE,category.eq.gebe duve');
    
    if (exactMatchError) {
      console.error('Sorgu 1 hatası:', exactMatchError);
    } else {
      console.log(`Toplam: ${exactMatchData.length} hayvan\n`);
      if (exactMatchData.length > 0) {
        exactMatchData.forEach(animal => {
          console.log(`ID: ${animal.id}, Küpe No: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status}, Cinsiyet: ${animal.cinsiyet || animal.gender}, Amaç: ${animal.purpose}`);
        });
      } else {
        console.log('Bu kritere uyan hayvan bulunamadı.');
      }
    }
    
    console.log('\n------------------------------------------------\n');

    // 2. Gebelik durumu "Gebe" ve kategorisi "Düve" olan hayvanlar
    console.log('2. GEBELİK DURUMU "GEBE" VE KATEGORİSİ "DÜVE" OLAN HAYVANLAR:');
    const { data: pregnantHeiferData, error: pregnantHeiferError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet, gender, purpose')
      .or('pregnancy_status.ilike.%gebe%,pregnancy_status.ilike.%GEBE%')
      .or('category.ilike.%düve%,category.ilike.%duve%,category.ilike.%DÜVE%,category.ilike.%DUVE%');
    
    if (pregnantHeiferError) {
      console.error('Sorgu 2 hatası:', pregnantHeiferError);
    } else {
      console.log(`Toplam: ${pregnantHeiferData.length} hayvan\n`);
      if (pregnantHeiferData.length > 0) {
        pregnantHeiferData.forEach(animal => {
          console.log(`ID: ${animal.id}, Küpe No: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status}, Cinsiyet: ${animal.cinsiyet || animal.gender}, Amaç: ${animal.purpose}`);
        });
      } else {
        console.log('Bu kritere uyan hayvan bulunamadı.');
      }
    }
    
    console.log('\n------------------------------------------------\n');

    // 3. Sadece "Düve" kategorisine sahip hayvanlar
    console.log('3. SADECE KATEGORİSİ "DÜVE" OLAN HAYVANLAR:');
    const { data: onlyHeiferData, error: onlyHeiferError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet, gender, purpose')
      .or('category.ilike.%düve%,category.ilike.%duve%,category.ilike.%DÜVE%,category.ilike.%DUVE%');
    
    if (onlyHeiferError) {
      console.error('Sorgu 3 hatası:', onlyHeiferError);
    } else {
      console.log(`Toplam: ${onlyHeiferData.length} hayvan\n`);
      if (onlyHeiferData.length > 0) {
        onlyHeiferData.forEach(animal => {
          console.log(`ID: ${animal.id}, Küpe No: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status}, Cinsiyet: ${animal.cinsiyet || animal.gender}, Amaç: ${animal.purpose}`);
        });
      } else {
        console.log('Bu kritere uyan hayvan bulunamadı.');
      }
    }
    
    console.log('\n------------------------------------------------\n');

    // 4. Sadece gebelik durumu "Gebe" olan hayvanlar
    console.log('4. SADECE GEBELİK DURUMU "GEBE" OLAN HAYVANLAR:');
    const { data: onlyPregnantData, error: onlyPregnantError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet, gender, purpose')
      .or('pregnancy_status.ilike.%gebe%,pregnancy_status.ilike.%GEBE%');
    
    if (onlyPregnantError) {
      console.error('Sorgu 4 hatası:', onlyPregnantError);
    } else {
      console.log(`Toplam: ${onlyPregnantData.length} hayvan\n`);
      if (onlyPregnantData.length > 0) {
        const groupedByCategory = {};
        
        // Kategoriye göre grupla
        onlyPregnantData.forEach(animal => {
          const category = animal.category || 'Kategori Yok';
          if (!groupedByCategory[category]) {
            groupedByCategory[category] = [];
          }
          groupedByCategory[category].push(animal);
        });
        
        // Gruplandırılmış verileri göster
        Object.keys(groupedByCategory).sort().forEach(category => {
          console.log(`\n---- ${category} (${groupedByCategory[category].length} hayvan) ----`);
          groupedByCategory[category].forEach(animal => {
            console.log(`ID: ${animal.id}, Küpe No: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status}, Cinsiyet: ${animal.cinsiyet || animal.gender}, Amaç: ${animal.purpose}`);
          });
        });
      } else {
        console.log('Bu kritere uyan hayvan bulunamadı.');
      }
    }
    
    console.log('\n=== RAPOR SONU ===');
    
  } catch (error) {
    console.error('Script çalıştırılırken bir hata oluştu:', error);
  }
}

// Script'i çalıştır
listPregnantHeifers();

module.exports = { listPregnantHeifers }; 