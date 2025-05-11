-- blood_samples tablosunu oluştur
CREATE TABLE IF NOT EXISTS `blood_samples` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `animal_id` INT NOT NULL,
    `tag_number` VARCHAR(50) NOT NULL,
    `sample_date` DATE NOT NULL,
    `status` ENUM('SONUÇ BEKLENİYOR', 'SONUÇLANDI') DEFAULT 'SONUÇ BEKLENİYOR',
    `result` ENUM('POZİTİF', 'NEGATİF') NULL,
    `detection_tag` VARCHAR(50) NOT NULL,
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`animal_id`) REFERENCES `hayvanlar`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- İndeksler
CREATE INDEX `idx_animal_id` ON `blood_samples`(`animal_id`);
CREATE INDEX `idx_tag_number` ON `blood_samples`(`tag_number`);
CREATE INDEX `idx_detection_tag` ON `blood_samples`(`detection_tag`);
CREATE INDEX `idx_status` ON `blood_samples`(`status`);
CREATE INDEX `idx_result` ON `blood_samples`(`result`);
CREATE INDEX `idx_sample_date` ON `blood_samples`(`sample_date`); 