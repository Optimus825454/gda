const express = require( 'express' );
const router = express.Router();
const financeController = require( '../controllers/FinanceController' );
const auth = require( '../middleware/auth' );
const { checkPermission } = require( '../middleware/permissions' );

// Genel finans işlemleri route'ları
router.post( '/transactions',
    auth,
    checkPermission( 'finance:create' ),
    financeController.createTransaction.bind( financeController )
);

router.get( '/transactions',
    auth,
    checkPermission( 'finance:read' ),
    financeController.getTransactions.bind( financeController )
);

router.get( '/transactions/:id',
    auth,
    checkPermission( 'finance:read' ),
    financeController.getTransactionById.bind( financeController )
);

router.put( '/transactions/:id',
    auth,
    checkPermission( 'finance:update' ),
    financeController.updateTransaction.bind( financeController )
);

// Fatura işlemleri route'ları
router.post( '/invoices',
    auth,
    checkPermission( 'invoice:create' ),
    financeController.createInvoice.bind( financeController )
);

router.get( '/invoices',
    auth,
    checkPermission( 'invoice:read' ),
    financeController.getInvoices.bind( financeController )
);

// Ödeme işlemleri route'ları
router.post( '/payments',
    auth,
    checkPermission( 'payment:create' ),
    financeController.createPayment.bind( financeController )
);

router.get( '/payments',
    auth,
    checkPermission( 'payment:read' ),
    financeController.getPayments.bind( financeController )
);

// DIMES entegrasyonu route'ları
router.post( '/dimes/sync',
    auth,
    checkPermission( 'dimes:sync' ),
    financeController.syncWithDimes.bind( financeController )
);

router.get( '/dimes/status',
    auth,
    checkPermission( 'dimes:read' ),
    financeController.getDimesStatus.bind( financeController )
);

// Raporlama route'ları
router.get( '/reports/summary',
    auth,
    checkPermission( 'finance:reports' ),
    financeController.getFinancialSummary.bind( financeController )
);

router.get( '/reports/cash-flow',
    auth,
    checkPermission( 'finance:reports' ),
    financeController.getCashFlow.bind( financeController )
);

module.exports = router;