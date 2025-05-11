import React from 'react';
import { Paper } from '@mui/material';

const Card = ({ 
    title, 
    description, 
    imageUrl, 
    buttonText, 
    onButtonClick,
    className = '',
    imageClassName = '',
    titleClassName = '',
    descriptionClassName = '',
    buttonClassName = '',
    children 
}) => {
    return (
        <div className={`bg-slate-800 rounded-lg shadow-md border border-slate-700 ${className}`}>
            {imageUrl && (
                <img 
                    className={`w-full h-48 object-cover ${imageClassName}`} 
                    src={imageUrl} 
                    alt={title || 'Card image'} 
                />
            )}
            <div className="p-6">
                {title && (
                    <h2 className={`text-xl font-bold text-slate-100 mb-2 ${titleClassName}`}>
                        {title}
                    </h2>
                )}
                {description && (
                    <p className={`text-slate-300 mb-4 ${descriptionClassName}`}>
                        {description}
                    </p>
                )}
                {children}
                {buttonText && (
                    <button 
                        onClick={onButtonClick}
                        className={`mt-4 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md ${buttonClassName}`}
                    >
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
};

const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={`flex flex-col space-y-1.5 p-6 border-b border-slate-700 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
});
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={`p-6 text-slate-300 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
});
CardContent.displayName = 'CardContent';

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <h3
            ref={ref}
            className={`text-xl font-semibold leading-none tracking-tight text-slate-100 mb-2 ${className}`}
            {...props}
        >
            {children}
        </h3>
    );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <p
            ref={ref}
            className={`text-sm text-slate-400 ${className}`}
            {...props}
        >
            {children}
        </p>
    );
});
CardDescription.displayName = 'CardDescription';

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
    <div 
        ref={ref} 
        className={`flex items-center justify-between p-6 pt-0 border-t border-slate-700 mt-4 ${className}`} 
        {...props} 
    >
        {children}
    </div>
));
CardFooter.displayName = 'CardFooter';

// Market Info için özel bileşen
const MarketInfoRow = React.forwardRef(({ label, value, className, ...props }, ref) => {
    return (
        <div 
            ref={ref}
            className={`flex justify-between items-center py-2 ${className}`} 
            {...props}
        >
            <span className="text-gray-400">{label}</span>
            <span className="text-white font-medium">{value}</span>
        </div>
    );
});
MarketInfoRow.displayName = 'MarketInfoRow';

// Order Entry için özel bileşen
const OrderEntryField = React.forwardRef(({ label, children, className, ...props }, ref) => {
    return (
        <div 
            ref={ref}
            className={`flex flex-col space-y-2 ${className}`} 
            {...props}
        >
            <label className="text-gray-400">{label}</label>
            {children}
        </div>
    );
});
OrderEntryField.displayName = 'OrderEntryField';

export { 
    CardHeader, 
    CardFooter, 
    CardTitle, 
    CardContent, 
    CardDescription,
    MarketInfoRow,
    OrderEntryField 
}; 

export default Card; 