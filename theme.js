import { createTheme } from '@mui/material/styles';

// Özelleştirilmiş tema
const theme = createTheme( {
    palette: {
        primary: {
            main: '#3f51b5', // Ana renk
            light: '#757de8',
            dark: '#002984',
            contrastText: '#fff',
        },
        secondary: {
            main: '#4caf50', // İkincil renk (yeşil)
            light: '#80e27e',
            dark: '#087f23',
            contrastText: '#fff',
        },
        error: {
            main: '#f44336', // Hata rengi
        },
        warning: {
            main: '#ff9800', // Uyarı rengi
        },
        info: {
            main: '#2196f3', // Bilgi rengi
        },
        success: {
            main: '#4caf50', // Başarı rengi
        },
        background: {
            default: '#f5f5f5', // Varsayılan arka plan rengi
            paper: '#ffffff', // Kağıt (kartlar vs) için arka plan rengi
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 14,
        h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
            marginBottom: '1rem',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 500,
            marginBottom: '0.8rem',
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
            marginBottom: '0.7rem',
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            marginBottom: '0.5rem',
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            marginBottom: '0.5rem',
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            marginBottom: '0.5rem',
        },
    },
    shape: {
        borderRadius: 8, // Köşe yuvarlaklığı
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // Buton metnini büyük harfe çevirme
                    borderRadius: 8,
                    padding: '8px 16px',
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#002984',
                    },
                },
                outlinedPrimary: {
                    borderWidth: 2,
                    '&:hover': {
                        borderWidth: 2,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 12,
                },
            },
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    padding: '16px 24px',
                },
                title: {
                    fontSize: '1.25rem',
                    fontWeight: 500,
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '24px',
                    '&:last-child': {
                        paddingBottom: '24px',
                    },
                },
            },
        },
    },
} );

export default theme;