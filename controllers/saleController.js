const SaleResult = require( '../models/SaleResult' );
const Animal = require( '../models/Animal' );
const { supabaseAdmin: supabase } = require( '../config/supabase' );

class SaleController {
    /**
     * Tüm satışları listele
     */
    static async listSales( req, res ) {
        try {
            const { animalId, status, type } = req.query;
            let sales;

            if ( animalId ) {
                sales = await SaleResult.findByAnimalId( animalId );
            } else if ( status ) {
                sales = await SaleResult.findByStatus( status );
            } else {
                sales = await SaleResult.findAll();
            }

            // Satış türüne göre filtrele
            if ( type ) {
                sales = sales.filter( sale => sale.saleType === type );
            }

            res.json( {
                success: true,
                data: sales
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Bekleyen satışları listele
     */
    static async listPendingSales( req, res ) {
        try {
            const sales = await SaleResult.findPendingSales();
            res.json( {
                success: true,
                data: sales
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Yeni satış kaydı oluştur
     */
    static async createSale( req, res ) {
        try {
            const saleData = req.body;
            const sale = new SaleResult( saleData );
            const savedSale = await sale.save();

            res.json( {
                success: true,
                data: savedSale,
                message: 'Satış kaydı başarıyla oluşturuldu'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Toplu satış kaydı oluştur
     */
    static async bulkCreateSales( req, res ) {
        try {
            const sales = req.body;
            const results = await SaleResult.bulkCreate( sales );

            res.json( {
                success: true,
                data: results,
                message: 'Satış kayıtları işlendi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Satış istatistiklerini getir
     */
    static async getSaleStatistics( req, res ) {
        try {
            console.log( "[DEBUG] getSaleStatistics called" );

            // Backend debug için detaylı hata yakalama
            try {
                const stats = await SaleResult.getSaleStatistics();
                console.log( "[DEBUG] getSaleStatistics success:", stats );

                // Frontend'in beklediği formatı gönder
                res.json( {
                    success: true,
                    data: stats
                } );
            } catch ( innerError ) {
                console.error( "[DEBUG] getSaleStatistics innerError:", innerError );
                throw innerError;
            }
        } catch ( error ) {
            console.error( "[DEBUG] getSaleStatistics outerError:", error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Satış durumunu güncelle
     */
    static async updateSaleStatus( req, res ) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const sale = await SaleResult.findById( id );
            sale.status = status;
            const updatedSale = await sale.save();

            res.json( {
                success: true,
                data: updatedSale,
                message: 'Satış durumu güncellendi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Satış detaylarını güncelle
     */
    static async updateSaleDetails( req, res ) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const sale = await SaleResult.findById( id );
            Object.assign( sale, updates );
            const updatedSale = await sale.save();

            res.json( {
                success: true,
                data: updatedSale,
                message: 'Satış detayları güncellendi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * ID'ye göre satış detayını getir
     */
    static async getSaleById( req, res ) {
        try {
            const { id } = req.params;
            const sale = await SaleResult.findById( id );

            if ( !sale ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: 'Satış kaydı bulunamadı'
                } );
            }

            res.json( {
                success: true,
                data: sale
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Satışı güncelle
     */
    static async updateSale( req, res ) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const sale = await SaleResult.findById( id );
            if ( !sale ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: 'Güncellenecek satış kaydı bulunamadı'
                } );
            }

            Object.assign( sale, updates );
            const updatedSale = await sale.save();

            res.json( {
                success: true,
                data: updatedSale,
                message: 'Satış kaydı güncellendi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Satışı sil
     */
    static async deleteSale( req, res ) {
        try {
            const { id } = req.params;
            const deleteResult = await SaleResult.deleteById( id );

            if ( !deleteResult ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: 'Silinecek satış kaydı bulunamadı'
                } );
            }

            res.json( {
                success: true,
                message: 'Satış kaydı silindi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Onay bekleyen satışları listele
     */
    static async listAwaitingApproval(req, res) {
        try {
            const sales = await SaleResult.findByStatus(SaleResult.SALE_STATUSES.BEKLEMEDE);
            
            // Hayvanların detaylarını da ekle
            const salesWithAnimalDetails = [];
            for (const sale of sales) {
                const animal = await Animal.findById(sale.animalId);
                salesWithAnimalDetails.push({
                    ...sale,
                    animal: animal || { animal_id: sale.animalId, not_found: true }
                });
            }
            
            res.json({
                success: true,
                data: salesWithAnimalDetails
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Satış onaylama işlemi
     */
    static async approveSale(req, res) {
        try {
            const { id } = req.params;
            const { approvedBy, approvalNotes, invoiceNumber } = req.body;
            
            const sale = await SaleResult.findById(id);
            if (!sale) {
                return res.status(404).json({
                    success: false,
                    error: 'Onaylanacak satış kaydı bulunamadı'
                });
            }
            
            // Satışı onayla ve fatura bilgilerini ekle
            sale.status = SaleResult.SALE_STATUSES.TAMAMLANDI;
            sale.approvedBy = approvedBy;
            sale.approvalDate = new Date().toISOString();
            sale.approvalNotes = approvalNotes;
            sale.invoiceNumber = invoiceNumber;
            
            const updatedSale = await sale.save();
            
            res.json({
                success: true,
                data: updatedSale,
                message: 'Satış onaylandı'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Satış iptal etme işlemi
     */
    static async cancelSale(req, res) {
        try {
            const { id } = req.params;
            const { cancellationReason } = req.body;
            
            const sale = await SaleResult.findById(id);
            if (!sale) {
                return res.status(404).json({
                    success: false,
                    error: 'İptal edilecek satış kaydı bulunamadı'
                });
            }
            
            // Satışı iptal et
            sale.status = SaleResult.SALE_STATUSES.IPTAL;
            sale.cancellationReason = cancellationReason;
            sale.cancellationDate = new Date().toISOString();
            
            const updatedSale = await sale.save();
            
            res.json({
                success: true,
                data: updatedSale,
                message: 'Satış iptal edildi'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Satış faturalarını listele
     */
    static async listInvoices(req, res) {
        try {
            const { startDate, endDate, companyName } = req.query;
            
            // Tamamlanmış satışları getir
            let query = supabase
                .from('sale_results')
                .select('*')
                .eq('status', SaleResult.SALE_STATUSES.TAMAMLANDI);
            
            // Filtreleri uygula
            if (startDate) {
                query = query.gte('sale_date', startDate);
            }
            
            if (endDate) {
                query = query.lte('sale_date', endDate);
            }
            
            if (companyName) {
                query = query.ilike('company_name', `%${companyName}%`);
            }
            
            // Azalan tarih sıralaması
            query = query.order('sale_date', { ascending: false });
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            const invoices = data.map(SaleResult.fromDatabase);
            
            res.json({
                success: true,
                data: invoices
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Detaylı satış raporları getir
     */
    static async getDetailedSaleReports(req, res) {
        try {
            const { period, saleType } = req.query;
            
            // Dönem hesapla
            let startDate = new Date();
            const endDate = new Date();
            
            if (period === 'month') {
                startDate.setMonth(startDate.getMonth() - 1);
            } else if (period === 'quarter') {
                startDate.setMonth(startDate.getMonth() - 3);
            } else if (period === 'year') {
                startDate.setFullYear(startDate.getFullYear() - 1);
            } else if (period === 'custom') {
                if (req.query.startDate) {
                    startDate = new Date(req.query.startDate);
                }
                if (req.query.endDate) {
                    endDate = new Date(req.query.endDate);
                }
            }
            
            // ISO string formatına dönüştür
            const startDateStr = startDate.toISOString();
            const endDateStr = endDate.toISOString();
            
            // Sorguyu oluştur
            let query = supabase
                .from('sale_results')
                .select('*')
                .eq('status', SaleResult.SALE_STATUSES.TAMAMLANDI)
                .gte('sale_date', startDateStr)
                .lte('sale_date', endDateStr);
            
            // Satış türüne göre filtrele
            if (saleType) {
                query = query.eq('sale_type', saleType);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Özet rapor hesapla
            const salesData = data.map(SaleResult.fromDatabase);
            const summary = {
                totalSales: salesData.length,
                totalRevenue: salesData.reduce((sum, sale) => sum + (sale.salePrice || 0), 0),
                avgPrice: salesData.length ? salesData.reduce((sum, sale) => sum + (sale.salePrice || 0), 0) / salesData.length : 0,
                byType: {
                    DAMIZLIK: {
                        count: salesData.filter(s => s.saleType === SaleResult.SALE_TYPES.DAMIZLIK).length,
                        revenue: salesData.filter(s => s.saleType === SaleResult.SALE_TYPES.DAMIZLIK)
                            .reduce((sum, sale) => sum + (sale.salePrice || 0), 0)
                    },
                    KESIM: {
                        count: salesData.filter(s => s.saleType === SaleResult.SALE_TYPES.KESIM).length,
                        revenue: salesData.filter(s => s.saleType === SaleResult.SALE_TYPES.KESIM)
                            .reduce((sum, sale) => sum + (sale.salePrice || 0), 0)
                    }
                },
                byCompany: {}
            };
            
            // Şirket bazında satışları hesapla
            salesData.forEach(sale => {
                if (sale.companyName) {
                    if (!summary.byCompany[sale.companyName]) {
                        summary.byCompany[sale.companyName] = {
                            count: 0,
                            revenue: 0
                        };
                    }
                    summary.byCompany[sale.companyName].count++;
                    summary.byCompany[sale.companyName].revenue += (sale.salePrice || 0);
                }
            });
            
            res.json({
                success: true,
                data: {
                    summary,
                    sales: salesData
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Fatura detayını getir
     */
    static async getInvoiceDetail(req, res) {
        try {
            const { id } = req.params;
            
            const sale = await SaleResult.findById(id);
            if (!sale) {
                return res.status(404).json({
                    success: false,
                    error: 'Fatura kaydı bulunamadı'
                });
            }
            
            // Hayvanın detaylarını al
            const animal = await Animal.findById(sale.animalId);
            
            res.json({
                success: true,
                data: {
                    invoice: sale,
                    animal: animal || { animal_id: sale.animalId, not_found: true }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = SaleController;