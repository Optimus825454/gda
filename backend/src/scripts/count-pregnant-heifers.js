/**
 * Gebe düvelerin sayısını ve detaylarını gösteren script
 */

const { supabaseAdmin } = require('../config/supabase');

async function countPregnantHeifers() {
  try {
    console.log('=== GEBE DÜVE SAYIM RAPORU ===');
    console.log('Rapor çalıştırılıyor...\n');

    // 0. Önce tüm hayvanların sayısını göster
    const { data: allAnimals, error: allError } = await supabaseAdmin
      .from('animals')
      .select('id')
      .limit(1);

    if (allError) throw allError;
    
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('animals')
      .select('*', { count: 'exact', head: true });
      
    if (countError) throw countError;
    
    console.log(`Veritabanındaki toplam hayvan sayısı: ${totalCount}`);

    // 0.1. Veritabanındaki kategori değerlerini göster
    const { data: categoryData, error: catError } = await supabaseAdmin
      .from('animals')
      .select('category');
      
    if (catError) throw catError;
    
    const uniqueCategories = [...new Set(categoryData.map(a => a.category))];
    console.log('Veritabanındaki mevcut kategori değerleri:', uniqueCategories);
    
    // 0.2. Veritabanındaki gebelik durumu değerlerini göster
    const { data: pregData, error: pregError } = await supabaseAdmin
      .from('animals')
      .select('pregnancy_status')
      .not('pregnancy_status', 'is', null);
      
    if (pregError) throw pregError;
    
    const uniquePregnancyStatuses = [...new Set(pregData.map(a => a.pregnancy_status))];
    console.log('Veritabanındaki mevcut gebelik durumları:', uniquePregnancyStatuses);

    // 1. Kategori adında "gebe düve", "gebe duve" vb. içeren kayıtlar
    const { data: categoryBasedData, error: categoryError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet')
      .or('category.ilike.%gebe%düve%,category.ilike.%gebe%duve%');

    if (categoryError) throw categoryError;

    console.log(`\n1. Kategori adında "gebe düve" içeren hayvanlar: ${categoryBasedData.length}`);
    
    if (categoryBasedData.length > 0) {
      console.log('   Örnek kayıtlar:');
      categoryBasedData.slice(0, 3).forEach(animal => {
        console.log(`   - ID: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status || 'Belirtilmemiş'}`);
      });
    }

    // 2. Kategorisinde "düve"/"duve" geçen VE gebelik durumu "gebe" olan kayıtlar
    const { data: pregnancyBasedData, error: pregnancyError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet')
      .or('category.ilike.%düve%,category.ilike.%duve%,category.ilike.%DÜVE%,category.ilike.%DUVE%')
      .not('pregnancy_status', 'is', null)
      .or('pregnancy_status.ilike.%gebe%,pregnancy_status.ilike.%GEBE%,pregnancy_status.ilike.%hamile%');

    if (pregnancyError) throw pregnancyError;

    console.log(`\n2. Kategorisi "düve" ve gebelik durumu "gebe" olan hayvanlar: ${pregnancyBasedData.length}`);
    
    if (pregnancyBasedData.length > 0) {
      console.log('   Örnek kayıtlar:');
      pregnancyBasedData.slice(0, 3).forEach(animal => {
        console.log(`   - ID: ${animal.animal_id}, Kategori: ${animal.category}, Gebelik: ${animal.pregnancy_status || 'Belirtilmemiş'}`);
      });
    }

    // 3. Tüm gebe hayvanlar
    const { data: allPregnantAnimals, error: allPregnantError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, cinsiyet')
      .or('pregnancy_status.ilike.%gebe%,pregnancy_status.ilike.%GEBE%,pregnancy_status.ilike.%hamile%');

    if (allPregnantError) throw allPregnantError;

    console.log(`\n3. Tüm gebe hayvanlar: ${allPregnantAnimals.length}`);
    
    if (allPregnantAnimals.length > 0) {
      console.log('   Gebelik durumuna göre dağılım:');
      const pregStats = {};
      allPregnantAnimals.forEach(animal => {
        pregStats[animal.pregnancy_status] = (pregStats[animal.pregnancy_status] || 0) + 1;
      });
      
      Object.entries(pregStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} hayvan`);
      });
      
      console.log('\n   Kategoriye göre dağılım:');
      const catStats = {};
      allPregnantAnimals.forEach(animal => {
        catStats[animal.category] = (catStats[animal.category] || 0) + 1;
      });
      
      Object.entries(catStats).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} hayvan`);
      });
    }

    // 4. Amaca göre düve grubu içindeki hayvanları getir
    const { data: heifersByPurpose, error: purposeError } = await supabaseAdmin
      .from('animals')
      .select('id, animal_id, category, pregnancy_status, purpose')
      .or('purpose.ilike.%damız%,purpose.ilike.%DAMIZ%,purpose.eq.DAMIZLIK')
      .or('category.ilike.%düve%,category.ilike.%duve%,category.ilike.%DÜVE%,category.ilike.%DUVE%');

    if (purposeError) throw purposeError;

    console.log(`\n4. Damızlık amacı olan düve grubu hayvanlar: ${heifersByPurpose.length}`);
    
    // 5. Hem gebelik durumu hem kategori hem de amaç açısından gebe düve olabilecek tüm hayvanlar
    const allPossiblePregnantHeifers = [
      ...categoryBasedData,
      ...pregnancyBasedData,
      ...heifersByPurpose.filter(h => 
        h.pregnancy_status && 
        (h.pregnancy_status.toUpperCase().includes('GEBE') || 
         h.pregnancy_status.toUpperCase().includes('HAMILE')))
    ];
    
    // Benzersiz kayıtları al
    const uniqueIds = new Set();
    const uniquePregnantHeifers = allPossiblePregnantHeifers.filter(animal => {
      if (uniqueIds.has(animal.id)) return false;
      uniqueIds.add(animal.id);
      return true;
    });

    console.log(`\n5. Toplam benzersiz gebe düve sayısı: ${uniquePregnantHeifers.length}`);

    // 6. Gebelik durumuna göre kategori dağılımı
    if (uniquePregnantHeifers.length > 0) {
      console.log('\n6. Gebe düvelerin kategori dağılımı:');
      const catDistribution = {};
      uniquePregnantHeifers.forEach(animal => {
        catDistribution[animal.category || 'Belirtilmemiş'] = 
          (catDistribution[animal.category || 'Belirtilmemiş'] || 0) + 1;
      });
      
      Object.entries(catDistribution).forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count} hayvan`);
      });
    }

    console.log('\n=== RAPOR SONU ===');
    return uniquePregnantHeifers.length;
  } catch (error) {
    console.error('Gebe düve sayımı sırasında hata:', error);
    console.error(error.stack);
    return 0;
  }
}

// Script doğrudan çalıştırıldıysa çalıştır
if (require.main === module) {
  countPregnantHeifers().then(count => {
    console.log(`\nSonuç: Sistemde toplam ${count} gebe düve bulunmaktadır.`);
    process.exit(0);
  }).catch(err => {
    console.error('Script çalıştırılırken hata:', err);
    process.exit(1);
  });
}

module.exports = { countPregnantHeifers }; 