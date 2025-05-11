const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Hayvan kategorileri ve diğer sabit değerler
const ANIMAL_CATEGORIES = {
    INEK: 'INEK',
    GEBE_DUVE: 'GEBE_DUVE',
    TOHUMLU_DUVE: 'TOHUMLU_DUVE',
    DUVE: 'DUVE',
    BUZAGI: 'BUZAGI'
};

const ANIMAL_GENDERS = {
    ERKEK: 'ERKEK',
    DISI: 'DISI'
};

const ANIMAL_STATUSES = {
    AKTIF: 'AKTIF',
    PASIF: 'PASIF',
    HASTA: 'HASTA',
    SATISA_HAZIR: 'SATISA_HAZIR'
};

const ANIMAL_BREEDS = {
    HOLSTEIN: 'HOLSTEIN',
    SIMENTAL: 'SIMENTAL',
    MONTOFON: 'MONTOFON',
    JERSEY: 'JERSEY',
    ANGUS: 'ANGUS',
    YERLI: 'YERLI',
    MELEZ: 'MELEZ',
    DIGER: 'DIGER'
};

const TEST_STATUSES = {
    BEKLIYOR: 'BEKLIYOR',
    TAMAMLANDI: 'TAMAMLANDI',
    IPTAL: 'IPTAL'
};

const TEST_RESULTS = {
    POZITIF: 'POZITIF',
    NEGATIF: 'NEGATIF',
    BELIRSIZ: 'BELIRSIZ'
};

const SALE_STATUSES = {
    BEKLIYOR: 'BEKLIYOR',
    SATISA_HAZIR: 'SATISA_HAZIR',
    SATILDI: 'SATILDI',
    IPTAL: 'IPTAL'
};

const PREGNANCY_STATUSES = {
    GEBE: 'GEBE',
    GEBE_DEGIL: 'GEBE_DEGIL',
    BELIRSIZ: 'BELIRSIZ'
};

const PURPOSES = {
    KESIM: 'KESIM',
    DAMIZLIK: 'DAMIZLIK'
};

// Örnek veri - farklı hayvan kategorilerinden örnekler içeriyor
const sampleData = [
    {
        // Temel Kimlik Bilgileri
        animal_id: 'TR12345678',
        tespit_no: 'TSP12345',
        tag_number: 'TAG12345',
        
        // Hayvan Özellikleri
        gender: ANIMAL_GENDERS.DISI,
        cinsiyet: ANIMAL_GENDERS.DISI,
        birth_date: '2022-05-15',
        category: ANIMAL_CATEGORIES.INEK,
        breed: ANIMAL_BREEDS.HOLSTEIN,
        anne_no: 'TR12345000',
        baba_no: 'TR12345001',
        name: 'Sarıkız',
        
        // Durum Bilgileri
        status: ANIMAL_STATUSES.AKTIF,
        durum: ANIMAL_STATUSES.AKTIF,
        test_status: TEST_STATUSES.TAMAMLANDI,
        test_result: TEST_RESULTS.NEGATIF,
        test_group: 'GRUP-A',
        pregnancy_status: PREGNANCY_STATUSES.GEBE,
        sale_status: SALE_STATUSES.BEKLIYOR,
        
        // Ölçüm ve Değerler
        weight: '450',
        
        // Finansal Bilgiler
        price: '15000',
        
        // Diğer Bilgiler
        purpose: PURPOSES.KESIM,
        notes: 'Sağlıklı inek, 2. laktasyon döneminde',
        destination_company: 'Çiftlik A',
        tohumlama_tarihi: '2022-02-10'
    },
    {
        // Temel Kimlik Bilgileri
        animal_id: 'TR12345679',
        tespit_no: 'TSP12346',
        tag_number: 'TAG12346',
        
        // Hayvan Özellikleri
        gender: ANIMAL_GENDERS.DISI,
        cinsiyet: ANIMAL_GENDERS.DISI,
        birth_date: '2022-06-10',
        category: ANIMAL_CATEGORIES.GEBE_DUVE,
        breed: ANIMAL_BREEDS.SIMENTAL,
        anne_no: 'TR12345002',
        baba_no: 'TR12345003',
        name: 'Benekli',
        
        // Durum Bilgileri
        status: ANIMAL_STATUSES.AKTIF,
        durum: ANIMAL_STATUSES.AKTIF,
        test_status: TEST_STATUSES.BEKLIYOR,
        test_result: null,
        test_group: 'GRUP-A',
        pregnancy_status: PREGNANCY_STATUSES.GEBE,
        sale_status: SALE_STATUSES.BEKLIYOR,
        
        // Ölçüm ve Değerler
        weight: '320',
        
        // Finansal Bilgiler
        price: '12000',
        
        // Diğer Bilgiler
        purpose: PURPOSES.DAMIZLIK,
        notes: 'Gebe düve - 3 aylık gebe',
        destination_company: null,
        tohumlama_tarihi: '2022-03-15'
    },
    {
        // Temel Kimlik Bilgileri
        animal_id: 'TR12345680',
        tespit_no: 'TSP12347',
        tag_number: 'TAG12347',
        
        // Hayvan Özellikleri
        gender: ANIMAL_GENDERS.DISI,
        cinsiyet: ANIMAL_GENDERS.DISI,
        birth_date: '2022-07-20',
        category: ANIMAL_CATEGORIES.TOHUMLU_DUVE,
        breed: ANIMAL_BREEDS.MONTOFON,
        anne_no: 'TR12345004',
        baba_no: 'TR12345005',
        name: 'Karabaş',
        
        // Durum Bilgileri
        status: ANIMAL_STATUSES.AKTIF,
        durum: ANIMAL_STATUSES.AKTIF,
        test_status: TEST_STATUSES.TAMAMLANDI,
        test_result: TEST_RESULTS.NEGATIF,
        test_group: 'GRUP-B',
        pregnancy_status: PREGNANCY_STATUSES.BELIRSIZ,
        sale_status: SALE_STATUSES.BEKLIYOR,
        
        // Ölçüm ve Değerler
        weight: '300',
        
        // Finansal Bilgiler
        price: '10000',
        
        // Diğer Bilgiler
        purpose: PURPOSES.DAMIZLIK,
        notes: 'Tohumlu düve - 1 ay önce tohumlandı',
        destination_company: null,
        tohumlama_tarihi: '2022-04-20'
    },
    {
        // Temel Kimlik Bilgileri
        animal_id: 'TR12345681',
        tespit_no: 'TSP12348',
        tag_number: 'TAG12348',
        
        // Hayvan Özellikleri
        gender: ANIMAL_GENDERS.DISI,
        cinsiyet: ANIMAL_GENDERS.DISI,
        birth_date: '2023-01-15',
        category: ANIMAL_CATEGORIES.DUVE,
        breed: ANIMAL_BREEDS.JERSEY,
        anne_no: 'TR12345006',
        baba_no: 'TR12345007',
        name: 'Sarı',
        
        // Durum Bilgileri
        status: ANIMAL_STATUSES.AKTIF,
        durum: ANIMAL_STATUSES.AKTIF,
        test_status: TEST_STATUSES.BEKLIYOR,
        test_result: null,
        test_group: 'GRUP-B',
        pregnancy_status: PREGNANCY_STATUSES.GEBE_DEGIL,
        sale_status: SALE_STATUSES.BEKLIYOR,
        
        // Ölçüm ve Değerler
        weight: '280',
        
        // Finansal Bilgiler
        price: '8000',
        
        // Diğer Bilgiler
        purpose: PURPOSES.DAMIZLIK,
        notes: 'Düve',
        destination_company: null,
        tohumlama_tarihi: null
    },
    {
        // Temel Kimlik Bilgileri
        animal_id: 'TR12345682',
        tespit_no: 'TSP12349',
        tag_number: 'TAG12349',
        
        // Hayvan Özellikleri
        gender: ANIMAL_GENDERS.ERKEK,
        cinsiyet: ANIMAL_GENDERS.ERKEK,
        birth_date: '2023-10-10',
        category: ANIMAL_CATEGORIES.BUZAGI,
        breed: ANIMAL_BREEDS.HOLSTEIN,
        anne_no: 'TR12345008',
        baba_no: 'TR12345009',
        name: 'Kara',
        
        // Durum Bilgileri
        status: ANIMAL_STATUSES.AKTIF,
        durum: ANIMAL_STATUSES.AKTIF,
        test_status: TEST_STATUSES.BEKLIYOR,
        test_result: null,
        test_group: 'GRUP-C',
        pregnancy_status: null,
        sale_status: SALE_STATUSES.BEKLIYOR,
        
        // Ölçüm ve Değerler
        weight: '120',
        
        // Finansal Bilgiler
        price: '5000',
        
        // Diğer Bilgiler
        purpose: PURPOSES.KESIM,
        notes: 'Buzağı',
        destination_company: null,
        tohumlama_tarihi: null
    }
];

// Açıklama sayfası verileri - Sütunlar gruplandırıldı ve örnekler eklendi
const instructionsData = [
    // Temel Kimlik Bilgileri
    { column: 'animal_id', description: 'Hayvan kimlik numarası (TR ile başlayan, zorunlu alan)', examples: 'TR12345678' },
    { column: 'tespit_no', description: 'Tespit numarası', examples: 'TSP12345' },
    { column: 'tag_number', description: 'Etiket numarası', examples: 'TAG12345' },
    
    // Hayvan Özellikleri
    { column: 'gender/cinsiyet', description: 'Cinsiyet (zorunlu alan)', examples: Object.values(ANIMAL_GENDERS).join(', ') },
    { column: 'birth_date', description: 'Doğum tarihi (YYYY-AA-GG formatında)', examples: '2022-05-15' },
    { column: 'category', description: 'Hayvan kategorisi (zorunlu alan)', examples: Object.values(ANIMAL_CATEGORIES).join(', ') },
    { column: 'breed', description: 'Hayvan ırkı', examples: Object.values(ANIMAL_BREEDS).join(', ') },
    { column: 'anne_no', description: 'Anne numarası (varsa)', examples: 'TR12345000' },
    { column: 'baba_no', description: 'Baba numarası (varsa)', examples: 'TR12345001' },
    { column: 'name', description: 'Hayvanın adı (varsa)', examples: 'Sarıkız, Benekli, Karabaş' },
    
    // Durum Bilgileri
    { column: 'status/durum', description: 'Hayvanın genel durumu', examples: Object.values(ANIMAL_STATUSES).join(', ') },
    { column: 'test_status', description: 'Test durumu', examples: Object.values(TEST_STATUSES).join(', ') },
    { column: 'test_result', description: 'Test sonucu (varsa)', examples: Object.values(TEST_RESULTS).join(', ') },
    { column: 'test_group', description: 'Test grubu (varsa)', examples: 'GRUP-A, GRUP-B, GRUP-C' },
    { column: 'pregnancy_status', description: 'Gebelik durumu', examples: Object.values(PREGNANCY_STATUSES).join(', ') },
    { column: 'sale_status', description: 'Satış durumu', examples: Object.values(SALE_STATUSES).join(', ') },
    
    // Ölçüm ve Değerler
    { column: 'weight', description: 'Ağırlık (kg)', examples: '120, 300, 450' },
    
    // Finansal Bilgiler
    { column: 'price', description: 'Fiyat (TL)', examples: '5000, 10000, 15000' },
    
    // Diğer Bilgiler
    { column: 'purpose', description: 'Hayvancılık amacı', examples: Object.values(PURPOSES).join(', ') },
    { column: 'notes', description: 'Notlar', examples: 'Sağlıklı inek, Gebe düve, Yeni doğmuş buzağı' },
    { column: 'destination_company', description: 'Hedef şirket/çiftlik (varsa)', examples: 'Çiftlik A, Mandıra B' },
    { column: 'tohumlama_tarihi', description: 'Tohumlama tarihi (YYYY-AA-GG formatında)', examples: '2022-03-15' }
];

// Ana fonksiyon
function createTemplate() {
    try {
        console.log('Toplu hayvan yükleme şablonu oluşturuluyor...');
        
        // Çalışma kitabı oluşturma
        const workbook = XLSX.utils.book_new();
        
        // Örnek veri sayfası
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Örnek Veriler');
        
        // Kullanım kılavuzu sayfası
        const instructionsWS = XLSX.utils.json_to_sheet(instructionsData);
        XLSX.utils.book_append_sheet(workbook, instructionsWS, 'Kullanım Kılavuzu');
        
        // Kategori listeleri sayfası
        const validValues = [
            { kategori: 'Kategoriler', degerler: Object.values(ANIMAL_CATEGORIES).join('\n') },
            { kategori: 'Cinsiyetler', degerler: Object.values(ANIMAL_GENDERS).join('\n') },
            { kategori: 'Durumlar', degerler: Object.values(ANIMAL_STATUSES).join('\n') },
            { kategori: 'Irklar', degerler: Object.values(ANIMAL_BREEDS).join('\n') },
            { kategori: 'Test Durumları', degerler: Object.values(TEST_STATUSES).join('\n') },
            { kategori: 'Test Sonuçları', degerler: Object.values(TEST_RESULTS).join('\n') },
            { kategori: 'Satış Durumları', degerler: Object.values(SALE_STATUSES).join('\n') },
            { kategori: 'Gebelik Durumları', degerler: Object.values(PREGNANCY_STATUSES).join('\n') },
            { kategori: 'Amaçlar', degerler: Object.values(PURPOSES).join('\n') }
        ];
        const validValuesWS = XLSX.utils.json_to_sheet(validValues);
        XLSX.utils.book_append_sheet(workbook, validValuesWS, 'Geçerli Değerler');
        
        // Şablon sayfası (boş veri girişi için)
        const templateData = [];
        // Başlık satırını al
        const headerRow = {};
        Object.keys(sampleData[0]).forEach(key => {
            headerRow[key] = key.toUpperCase();
        });
        templateData.push(headerRow);
        
        // Boş veri satırı ekle
        const emptyRow = {};
        Object.keys(sampleData[0]).forEach(key => {
            emptyRow[key] = '';
        });
        // 20 tane boş satır ekle
        for (let i = 0; i < 20; i++) {
            templateData.push({...emptyRow});
        }
        
        const templateWS = XLSX.utils.json_to_sheet(templateData);
        XLSX.utils.book_append_sheet(workbook, templateWS, 'Veri Girişi');
        
        // Dosya oluştur
        const outputDir = path.join(__dirname, '..', 'templates');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, 'hayvan_yukleme_sablonu.xlsx');
        XLSX.writeFile(workbook, outputPath);
        
        console.log(`Şablon başarıyla oluşturuldu: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Şablon oluşturulurken hata:', error);
        throw error;
    }
}

// Scripti doğrudan çalıştırıldığında
if (require.main === module) {
    createTemplate();
}

module.exports = { createTemplate }; 