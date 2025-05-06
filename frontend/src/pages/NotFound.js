import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
    return (
        <Container component="main" maxWidth="sm">
            <Paper
                elevation={3}
                sx={{
                    py: 6,
                    px: 4,
                    mt: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <Typography variant="h1" component="h1" gutterBottom>
                    404
                </Typography>

                <Typography variant="h5" gutterBottom>
                    Sayfa Bulunamadı
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                    Aradığınız sayfa bulunamadı veya kaldırılmış olabilir.
                    Lütfen URL'i kontrol edin veya ana sayfaya dönün.
                </Typography>

                <Box>
                    <Button
                        variant="contained"
                        startIcon={<HomeIcon />}
                        component={Link}
                        to="/"
                    >
                        Ana Sayfaya Dön
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default NotFound;