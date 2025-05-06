const mongoose = require( 'mongoose' );

const financeSchema = new mongoose.Schema( {
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['INCOME', 'EXPENSE', 'TRANSFER']
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'TRY'
    },
    category: {
        type: String,
        required: true
    },
    description: String,
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    relatedDocuments: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'documentType'
    }],
    documentType: {
        type: String,
        required: function () {
            return this.relatedDocuments.length > 0;
        },
        enum: ['Invoice', 'Payment']
    },
    dimesReference: {
        integrationId: String,
        status: String,
        lastSync: Date
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
} );

// Endeksler
financeSchema.index( { transactionId: 1 } );
financeSchema.index( { type: 1, date: -1 } );
financeSchema.index( { status: 1 } );

// Virtual alanlar
financeSchema.virtual( 'formattedAmount' ).get( function () {
    return `${this.amount.toLocaleString( 'tr-TR' )} ${this.currency}`;
} );

const Finance = mongoose.model( 'Finance', financeSchema );

module.exports = Finance;