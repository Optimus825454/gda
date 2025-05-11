import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * CSS sınıflarını birleştirmek için yardımcı fonksiyon
 * Bu fonksiyon, clsx ve tailwind-merge kütüphanelerini kullanarak
 * CSS sınıflarını birleştirir ve çakışan sınıfları çözümler
 */
export function cn( ...inputs ) {
    return twMerge( clsx( inputs ) );
}