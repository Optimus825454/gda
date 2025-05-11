/**
 * importService.js - Excel/CSV veri ithalatı için servis
 */

import axiosInstance from './axiosConfig';

/**
 * Hayvanları Excel veya CSV dosyasından içe aktarır
 * @param {File} file - Yüklenecek Excel/CSV dosyası
 * @returns {Promise} - İşlem sonucu
 */
export const importAnimalsFromFile = async ( file ) => {
    try {
        // FormData nesnesi oluştur
        const formData = new FormData();
        formData.append( 'file', file );

        // API isteği gönder
        const response = await axiosInstance.post( '/import/animals/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } );

        return response.data;
    } catch ( error ) {
        console.error( 'Dosya yükleme hatası:', error );
        throw error;
    }
};

/**
 * Test sonuçlarını toplu olarak günceller
 * @param {Array} testResults - Test sonuç verileri
 * @returns {Promise} - İşlem sonucu
 */
export const bulkUpdateTestResults = async ( testResults ) => {
    try {
        const response = await axiosInstance.post( '/import/tests/bulk', testResults );
        return response.data;
    } catch ( error ) {
        console.error( 'Toplu test güncelleme hatası:', error );
        throw error;
    }
};

/**
 * Belirtilen tipteki içe aktarma şablonunu indirir
 * @param {string} templateType - Şablon tipi (animals, tests)
 * @returns {Promise} - İşlem sonucu
 */
export const downloadImportTemplate = async ( templateType ) => {
    try {
        const response = await axiosInstance.get( `/import/templates/${templateType}`, {
            responseType: 'blob',
        } );

        // Blob'dan dosya oluştur ve indir
        const url = window.URL.createObjectURL( new Blob( [response.data] ) );
        const link = document.createElement( 'a' );
        link.href = url;
        link.setAttribute( 'download', `${templateType}_template.xlsx` );
        document.body.appendChild( link );
        link.click();
        link.remove();

        return { success: true };
    } catch ( error ) {
        console.error( 'Şablon indirme hatası:', error );
        throw error;
    }
};

const importService = {
    importAnimalsFromFile,
    bulkUpdateTestResults,
    downloadImportTemplate,
};

export default importService;