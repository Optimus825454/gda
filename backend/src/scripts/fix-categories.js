/**
 * Gebelik durumu "gebe" olan ve kategorisi "Düve" olan hayvanları
 * "Gebe Düve" kategorisine güncelleyen script
 */

const { supabaseAdmin } = require('../config/supabase');

async function updatePregnantHeifers() {
  try {
    console.log('Gebe düveleri güncelleme işlemi başlatılıyor...');
    
    // Önce güncellenecek hayvanları tespit edelim
    const { data: animalsToUpdate, error: findError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status')
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
    
    // Hayvanları güncelle
    const { data: updatedAnimals, error: updateError } = await supabaseAdmin
      .from('animals')
      .update({ category: 'Gebe Düve' })
      .in('id', animalsToUpdate.map(animal => animal.id))
      .select('id, animal_id, category, pregnancy_status');
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`${updatedAnimals.length} hayvan başarıyla güncellendi.`);
    console.log('Güncellenen hayvanlar:');
    updatedAnimals.forEach(animal => {
      console.log(`ID: ${animal.id}, Küpe No: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik Durumu: ${animal.pregnancy_status}`);
    });
    
  } catch (error) {
    console.error('Gebe düveleri güncelleme sırasında hata oluştu:', error);
  }
}

// Script'i çalıştır
updatePregnantHeifers();

module.exports = { updatePregnantHeifers }; 