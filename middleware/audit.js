/**
 * audit.js - Kullanıcı işlemlerini loglama middleware'i
 */
const AuditService = require('../services/AuditService');

const auditMiddleware = (entity) => {
    return async (req, res, next) => {
        // Orijinal response.json ve response.send metodlarını sakla
        const originalJson = res.json;
        const originalSend = res.send;

        // Response metodlarını override et
        res.json = function(data) {
            // İşlem tipini belirle
            let action;
            switch (req.method) {
                case 'POST':
                    action = AuditService.ACTIONS.CREATE;
                    break;
                case 'PUT':
                case 'PATCH':
                    action = AuditService.ACTIONS.UPDATE;
                    break;
                case 'DELETE':
                    action = AuditService.ACTIONS.DELETE;
                    break;
                default:
                    action = AuditService.ACTIONS.READ;
            }

            // Log kaydı oluştur
            try {
                if (req.user) { // Eğer kullanıcı oturum açmışsa
                    AuditService.logAction({
                        userId: req.user.id,
                        action,
                        entity,
                        entityId: req.params.id, // URL'den ID parametresini al
                        details: {
                            method: req.method,
                            path: req.path,
                            query: req.query,
                            body: req.body, // İstek gövdesi
                            status: res.statusCode, // Yanıt durum kodu
                            response: data // Yanıt verisi
                        }
                    }, req);
                }
            } catch (error) {
                console.error('Audit log middleware hatası:', error);
            }

            // Orijinal json metodunu çağır
            return originalJson.call(this, data);
        };

        // Send metodunu da benzer şekilde override et
        res.send = function(data) {
            return originalSend.call(this, data);
        };

        next();
    };
};

module.exports = auditMiddleware;