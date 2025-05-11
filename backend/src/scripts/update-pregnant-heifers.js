/**
 * Bu script, gebelik durumu "gebe" olan ve kategorisi "Düve" olan hayvanları 
 * "Gebe Düve" kategorisine güncellemek için kullanılır
 */

const { supabaseAdmin } = require('../config/supabase');

async function updatePregnantHeifers() {
  try {
    console.log('=== GEBE DÜVE GÜNCELLEME İŞLEMİ ===');
    console.log('Veritabanında kategori güncellemesi başlatılıyor...\n');

    // Güncellenecek hayvanları tespit edelim: 
    // Gebelik durumu "gebe" içeren ve kategorisi "düve" içeren hayvanlar
    const { data: animalsToUpdate, error: findError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet, gender')
      .or('pregnancy_status.ilike.%gebe%,pregnancy_status.ilike.%GEBE%')
      .or('category.ilike.%düve%,category.ilike.%duve%,category.ilike.%DÜVE%,category.ilike.%DUVE%');
    
    if (findError) {
      throw findError;
    }
    
    console.log(`Güncellenecek hayvan sayısı: ${animalsToUpdate.length}`);
    
    if (animalsToUpdate.length === 0) {
      console.log('Güncellenecek hayvan bulunamadı.');
      return;
    }
    
    // Hayvanların önceki halini göster
    console.log('\nGÜNCELLENECEK HAYVANLAR (ÖNCE):');
    animalsToUpdate.forEach(animal => {
      console.log(`ID: ${animal.id}, Küpe No: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status}, Cinsiyet: ${animal.cinsiyet || animal.gender}`);
    });
    
    // Hayvanları güncelle
    const { data: updatedAnimals, error: updateError } = await supabaseAdmin
      .from('animals')
      .update({ category: 'Gebe Düve' })
      .in('id', animalsToUpdate.map(animal => animal.id))
      .select('id, animal_id, category, pregnancy_status, cinsiyet, gender');
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`\n${updatedAnimals.length} hayvan başarıyla güncellendi.`);
    console.log('\nGÜNCELLENEN HAYVANLAR (SONRA):');
    updatedAnimals.forEach(animal => {
      console.log(`ID: ${animal.id}, Küpe No: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status}, Cinsiyet: ${animal.cinsiyet || animal.gender}`);
    });
    
    console.log('\n=== GÜNCELLEME İŞLEMİ TAMAMLANDI ===');
    
  } catch (error) {
    console.error('Gebe düveleri güncelleme sırasında hata oluştu:', error);
  }
}

// Script'i çalıştır
updatePregnantHeifers();

module.exports = { updatePregnantHeifers }; 