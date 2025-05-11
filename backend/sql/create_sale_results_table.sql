-- Create sale_results table
CREATE TABLE IF NOT EXISTS sale_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT,
    sale_price DECIMAL(10, 2),
    buyer VARCHAR(255),
    sale_type VARCHAR(50),
    sale_date DATE,
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES hayvanlar(id) ON DELETE SET NULL
);
