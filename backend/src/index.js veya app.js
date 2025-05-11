const express = require( 'express' );
const saleRoutes = require( './routes/saleRoutes' ); // Rota dosyasını import edin

const app = express();

// Middleware
app.use( express.json() );

// Rotayı belirli bir yol altında kullanın
app.use( '/api/sales', saleRoutes );

// Server başlatma
const PORT = process.env.PORT || 5000;
app.listen( PORT, () => {
    console.log( `Server is running on port ${PORT}` );
} );