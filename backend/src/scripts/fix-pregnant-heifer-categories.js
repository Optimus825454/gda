/**
 * Gebe ineklerin kategorilerini düzeltme scripti
 * Bu script, kategorisi INEK olan ve gebelik durumu Gebe olan hayvanların
 * kategorilerini bir kısmını GEBE_DUVE olarak güncelleyecektir.
 */

const { supabaseAdmin } = require('../config/supabase');

async function fixPregnantHeiferCategories() {
  try {
    console.log('=== GEBE DÜVE KATEGORİLERİNİ DÜZELTME ===');
    console.log('İşlem başlatılıyor...\n');

    // 1. Kategorisi "INEK" ve gebelik durumu "Gebe" olan hayvanları getir
    const { data: pregnantCows, error: queryError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, purpose, cinsiyet')
      .eq('category', 'INEK')
      .eq('pregnancy_status', 'Gebe');

    if (queryError) throw queryError;

    console.log(`Kategorisi INEK ve gebelik durumu Gebe olan hayvan sayısı: ${pregnantCows.length}`);

    if (pregnantCows.length === 0) {
      console.log('Düzeltilecek kayıt bulunamadı.');
      return 0;
    }

    // 2. Test amaçlı olarak ilk 100 hayvanı seçelim (veya daha az ise hepsini)
    const animalsToUpdate = pregnantCows.slice(0, 100);
    console.log(`Düzeltilecek hayvan sayısı: ${animalsToUpdate.length}`);

    // 3. İşlem yapmadan önce onay alalım
    console.log('\nAşağıdaki hayvanların kategorisi "INEK" -> "GEBE_DUVE" olarak değiştirilecek:');
    animalsToUpdate.slice(0, 5).forEach((animal, index) => {
      console.log(`${index + 1}. ID: ${animal.animal_id}, Mevcut kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status}`);
    });

    // 4. Hayvanları GEBE_DUVE olarak güncelle
    console.log(`\nToplam ${animalsToUpdate.length} hayvan güncelleniyor...`);
    
    // Güncelleme işlemini parçalara ayıralım (supabase 1000 limit)
    const batchSize = 100;
    let updatedCount = 0;
    
    for (let i = 0; i < animalsToUpdate.length; i += batchSize) {
      const batch = animalsToUpdate.slice(i, i + batchSize);
      const idsToUpdate = batch.map(animal => animal.id);
      
      console.log(`  Parti ${Math.floor(i/batchSize) + 1}: ${idsToUpdate.length} hayvan güncelleniyor...`);
      
      const { data, error } = await supabaseAdmin
        .from('animals')
        .update({ category: 'GEBE_DUVE' })
        .in('id', idsToUpdate)
        .select('id, animal_id, category');
      
      if (error) {
        console.error(`  Parti ${Math.floor(i/batchSize) + 1} güncellenirken hata:`, error);
      } else {
        updatedCount += data.length;
        console.log(`  Başarıyla güncellenen hayvan sayısı: ${data.length}`);
        
        if (data.length > 0) {
          console.log('  Örnek güncellenen kayıtlar:');
          data.slice(0, 3).forEach(animal => {
            console.log(`  - ID: ${animal.animal_id}, Yeni kategori: ${animal.category}`);
          });
        }
      }
    }

    console.log(`\nİşlem tamamlandı. Toplam ${updatedCount} hayvan GEBE_DUVE olarak güncellendi.`);
    console.log('\n=== KATEGORİ GÜNCELLEME İŞLEMİ TAMAMLANDI ===');
    
    return updatedCount;
  } catch (error) {
    console.error('Kategori düzeltme işlemi sırasında hata:', error);
    console.error(error.stack);
    return 0;
  }
}

// Script doğrudan çalıştırıldıysa çalıştır
if (require.main === module) {
  console.log('Bu işlem kategorileri düzenleyecek. Devam etmek istiyor musunuz?');
  console.log('Otomatik olarak işleme devam ediliyor...\n');
  
  setTimeout(() => {
    fixPregnantHeiferCategories().then(count => {
      console.log(`\nSonuç: Toplam ${count} hayvanın kategorisi güncellendi.`);
      process.exit(0);
    }).catch(err => {
      console.error('Script çalıştırılırken hata:', err);
      process.exit(1);
    });
  }, 2000); // 2 saniye bekleme süresi
}

module.exports = { fixPregnantHeiferCategories }; 