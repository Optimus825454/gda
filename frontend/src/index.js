import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import ReactGA from 'react-ga4';
import axios from 'axios';

// Axios interceptor ile her isteğe otomatik Authorization header ekle
axios.interceptors.request.use( ( config ) => {
    // Supabase oturumunu localStorage'dan al
    let token = null;
    try {
        const sessionStr = localStorage.getItem( 'supabase.auth.token' );
        if ( sessionStr ) {
            const sessionObj = JSON.parse( sessionStr );
            token = sessionObj?.currentSession?.access_token || sessionObj?.access_token;
        }
    } catch ( e ) {
        // ignore
    }
    if ( token ) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
} );

Sentry.init( {
    dsn: process.env.REACT_APP_SENTRY_DSN || '',
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
} );

if ( process.env.REACT_APP_GA_MEASUREMENT_ID ) {
    ReactGA.initialize( process.env.REACT_APP_GA_MEASUREMENT_ID );
    ReactGA.send( { hitType: 'pageview', page: window.location.pathname + window.location.search } );
}

const container = document.getElementById( 'root' );
const root = ReactDOM.createRoot( container );

root.render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);