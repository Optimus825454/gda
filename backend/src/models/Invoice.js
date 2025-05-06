const mongoose = require( 'mongoose' );

const invoiceSchema = new mongoose.Schema( {
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['SALES', 'PURCHASE']
    },
    date: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    supplier: {
        name: {
            type: String,
            required: true
        },
        taxNumber: String,
        address: String,
        phone: String,
        email: String
    },
    items: [{
        description: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        taxRate: {
            type: Number,
            required: true,
            default: 18
        },
        total: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'TRY'
    },
    status: {
        type: String,
        enum: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'],
        default: 'DRAFT'
    },
    paymentTerms: String,
    notes: String,
    attachments: [{
        fileName: String,
        fileUrl: String,
        uploadDate: Date
    }],
    dimesIntegration: {
        integrationId: String,
        status: String,
        lastSync: Date,
        errors: [{
            code: String,
            message: String,
            timestamp: Date
        }]
    }
}, {
    timestamps: true
} );

// Endeksler
invoiceSchema.index( { invoiceNumber: 1 } );
invoiceSchema.index( { 'supplier.name': 1 } );
invoiceSchema.index( { date: -1 } );
invoiceSchema.index( { status: 1 } );

// Toplam tutarları hesaplama
invoiceSchema.pre( 'save', function ( next ) {
    let subtotal = 0;
    let taxAmount = 0;

    this.items.forEach( item => {
        subtotal += item.quantity * item.unitPrice;
        taxAmount += ( item.quantity * item.unitPrice * item.taxRate ) / 100;
    } );

    this.subtotal = subtotal;
    this.taxAmount = taxAmount;
    this.total = subtotal + taxAmount;

    next();
} );

const Invoice = mongoose.model( 'Invoice', invoiceSchema );

module.exports = Invoice;