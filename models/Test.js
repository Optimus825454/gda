const pool = require('../config/database');

class Test {
  static async findAll(options = {}) {
    try {
      let query = `
        SELECT t.*, h.kupeno as earring_number 
        FROM tests t 
        LEFT JOIN hayvanlar h ON t.animal_id = h.id
        ORDER BY t.created_at DESC
      `;
      
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByPk(id) {
    try {
      const [rows] = await pool.query(
        'SELECT t.*, h.kupeno as earring_number FROM tests t LEFT JOIN hayvanlar h ON t.animal_id = h.id WHERE t.id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async create(data) {
    try {
      const { animal_id, detection_number, result, notes } = data;
      const [result1] = await pool.query(
        'INSERT INTO tests (animal_id, detection_number, result, notes, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [animal_id, detection_number, result, notes]
      );
      return this.findByPk(result1.insertId);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const { result, notes } = data;
      await pool.query(
        'UPDATE tests SET result = ?, notes = ?, updated_at = NOW() WHERE id = ?',
        [result, notes, id]
      );
      return this.findByPk(id);
    } catch (error) {
      throw error;
    }
  }

  static async destroy(id) {
    try {
      await pool.query('DELETE FROM tests WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Test; 