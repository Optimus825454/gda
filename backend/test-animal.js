// Animal modülünü test etmek için basit bir script
require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');
const Animal = require('./src/models/Animal');

async function testAnimalSearch() {
  try {
    // Test parametreleri
    const animalId = 'TR601553987';
    
    // Animal sınıfı metodu testi
    const animal = await Animal.findByAnimalId(animalId);
    console.log('Animal testi sonucu:', animal ? 'Bulundu' : 'Bulunamadı');

    // Supabase sorgusu testi
    const { data, error } = await supabaseAdmin
      .from('animals')
      .select('*')
      .eq('animal_id', animalId);
    
    console.log('Supabase testi sonucu:', error ? 'Hata' : (data && data.length ? 'Bulundu' : 'Bulunamadı'));
    
    // Kan numunesi test kaydı oluşturma
    if (animal) {
      const testData = {
        animal_id: animalId,
        test_type: 'Kan Numunesi',
        detection_tag: '5555',
        test_date: new Date().toISOString(),
        result: 'SONUÇ BEKLENIYOR',
        status: 'BEKLIYOR',
        notes: 'Kan numunesi alındı. Tespit No: 5555'
      };
      
      try {
        const { data: testResult, error: testError } = await supabaseAdmin
          .from('animal_tests')
          .insert(testData);
          
        if (testError) {
          console.log('Test kaydedilemedi');
        } else {
          console.log('Test başarıyla kaydedildi');
        }
      } catch (err) {
        console.log('Test kayıt işlemi başarısız');
      }
    }
  } catch (error) {
    console.error('Test hatası');
  }
}

// Testi çalıştır
testAnimalSearch(); 