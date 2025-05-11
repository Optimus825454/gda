import React from 'react';
import Card from '../ui/Card';

const CardExample = () => {
    // Örnek kart verileri
    const cards = [
        {
            title: 'Temel Kart',
            description: 'Bu bir temel kart örneğidir. Başlık, açıklama ve buton içerir.',
            imageUrl: 'https://picsum.photos/400/200',
            buttonText: 'Detaylar'
        },
        {
            title: 'Özel Stilli Kart',
            description: 'Bu kartta özel stiller kullanılmıştır.',
            imageUrl: 'https://picsum.photos/400/201',
            buttonText: 'İncele',
            className: 'max-w-sm',
            titleClassName: 'text-2xl text-blue-600 dark:text-blue-400',
            buttonClassName: 'bg-green-600 hover:bg-green-700'
        },
        {
            title: 'İçerik Kartı',
            description: 'Bu kart özel içerik kullanımını gösterir.',
            imageUrl: 'https://picsum.photos/400/202',
            children: (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
                    <h3 className="font-semibold mb-2">Özel İçerik Alanı</h3>
                    <p>Buraya istediğiniz özel içeriği ekleyebilirsiniz.</p>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-6">Kart Örnekleri</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        {...card}
                        onButtonClick={() => console.log(`Kart ${index + 1} tıklandı`)}
                    />
                ))}
            </div>

            {/* Özel Kullanım Örnekleri */}
            <h2 className="text-xl font-bold mt-8 mb-4">Özel Kullanım Örnekleri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sadece Başlık ve Açıklama */}
                <Card
                    title="Sadece Metin"
                    description="Bu kartta sadece başlık ve açıklama bulunuyor."
                />

                {/* Özel İçerik */}
                <Card>
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-2xl text-white">🚀</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Tamamen Özel</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                İstediğiniz gibi özelleştirebilirsiniz
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CardExample; 