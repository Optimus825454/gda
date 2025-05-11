const mongoose = require( 'mongoose' );

const paymentSchema = new mongoose.Schema( {
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'TRY'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    relatedInvoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    payer: {
        name: {
            type: String,
            required: true
        },
        taxNumber: String,
        bank: String,
        accountNumber: String,
        iban: String
    },
    payee: {
        name: {
            type: String,
            required: true
        },
        taxNumber: String,
        bank: String,
        accountNumber: String,
        iban: String
    },
    bankDetails: {
        transactionId: String,
        bankName: String,
        branch: String,
        accountType: String,
        referenceNumber: String,
        description: String
    },
    checkDetails: {
        checkNumber: String,
        bankName: String,
        branchCode: String,
        dueDate: Date
    },
    dimesIntegration: {
        integrationId: String,
        status: String,
        lastSync: Date,
        reconciliationStatus: {
            type: String,
            enum: ['PENDING', 'MATCHED', 'UNMATCHED'],
            default: 'PENDING'
        },
        errors: [{
            code: String,
            message: String,
            timestamp: Date
        }]
    },
    metadata: {
        type: Map,
        of: String
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        uploadDate: Date
    }],
    notes: String
}, {
    timestamps: true
} );

// Endeksler
paymentSchema.index( { paymentId: 1 } );
paymentSchema.index( { date: -1 } );
paymentSchema.index( { status: 1 } );
paymentSchema.index( { 'dimesIntegration.reconciliationStatus': 1 } );

// Virtual getter for formatted amount
paymentSchema.virtual( 'formattedAmount' ).get( function () {
    return `${this.amount.toLocaleString( 'tr-TR' )} ${this.currency}`;
} );

// Pre-save middleware for validation
paymentSchema.pre( 'save', function ( next ) {
    // IBAN formatı doğrulama
    if ( this.payer.iban ) {
        const ibanRegex = /^TR[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{2}$/;
        if ( !ibanRegex.test( this.payer.iban ) ) {
            next( new Error( 'Geçersiz IBAN formatı' ) );
        }
    }

    // Çek ödemesi için çek numarası kontrolü
    if ( this.type === 'CHECK' && !this.checkDetails.checkNumber ) {
        next( new Error( 'Çek ödemeleri için çek numarası zorunludur' ) );
    }

    next();
} );

const Payment = mongoose.model( 'Payment', paymentSchema );

module.exports = Payment;