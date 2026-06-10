const express = require('express');
const multer = require('multer');
const { pool } = require('./database');
const { generateDraftLetter, extractNoticeDetails } = require('./aiService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/extract', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided.' });
    }
    const extractedData = await extractNoticeDetails(req.file.buffer, req.file.mimetype);
    res.json(extractedData);
  } catch (error) {
    console.error('Extraction Error:', error);
    res.status(500).json({ error: 'Failed to extract document details.' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { noticeType, issue, clientFacts, strategy, clientName, noticeRef, language = 'English' } = req.body;

    if (!noticeType || !issue || !clientFacts || !strategy || !clientName || !noticeRef) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Insert into notice_inputs
    const [inputResult] = await pool.query(
      `INSERT INTO notice_inputs (type, issue, client_facts, strategy, client_name, notice_ref, language) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [noticeType, issue, clientFacts, strategy, clientName, noticeRef, language]
    );
    const inputId = inputResult.insertId;

    // Call AI Service
    const aiResponse = await generateDraftLetter(noticeType, issue, clientFacts, strategy, clientName, noticeRef, language);

    // Save to generated_letters
    const [letterResult] = await pool.query(
      `INSERT INTO generated_letters (input_id, full_letter_text, prompt_version, response_time_ms) 
       VALUES (?, ?, ?, ?)`,
      [inputId, aiResponse.text, aiResponse.promptVersion, aiResponse.responseTimeMs]
    );

    res.json({
      id: letterResult.insertId, // return the letter ID as the main reference
      full_letter_text: aiResponse.text,
      prompt_version: aiResponse.promptVersion,
      response_time_ms: aiResponse.responseTimeMs
    });
  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate response letter.' });
  }
});

// Get History
router.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT gl.id, ni.type as notice_type, ni.issue, ni.client_name, ni.notice_ref, gl.timestamp, gl.full_letter_text 
      FROM generated_letters gl
      JOIN notice_inputs ni ON gl.input_id = ni.id
      ORDER BY gl.timestamp DESC
    `);

    // map to create a preview
    const history = rows.map(row => ({
      ...row,
      preview: row.full_letter_text.substring(0, 60) + '...'
    }));
    res.json(history);
  } catch (error) {
    console.error('History Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// Get specific generation by ID
router.get('/history/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT gl.*, ni.type as notice_type, ni.issue, ni.client_facts, ni.strategy, ni.client_name, ni.notice_ref 
      FROM generated_letters gl
      JOIN notice_inputs ni ON gl.input_id = ni.id
      WHERE gl.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const [feedback] = await pool.query('SELECT rating, thumbs_up_down FROM quality_ratings WHERE letter_id = ?', [req.params.id]);
    const generation = rows[0];
    generation.feedback = feedback.length > 0 ? feedback[0] : null;

    res.json(generation);
  } catch (error) {
    console.error('History ID Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch generation details.' });
  }
});

// Save Edit
router.post('/history/:id/edit', async (req, res) => {
  try {
    const { newText } = req.body;
    const letterId = req.params.id;

    if (!newText) return res.status(400).json({ error: 'newText is required.' });

    // Insert into draft_history
    await pool.query('INSERT INTO draft_history (letter_id, edited_text) VALUES (?, ?)', [letterId, newText]);

    // Update generated_letters
    await pool.query('UPDATE generated_letters SET full_letter_text = ? WHERE id = ?', [newText, letterId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Edit Error:', error);
    res.status(500).json({ error: 'Failed to save edit.' });
  }
});

// Submit Feedback
router.post('/feedback', async (req, res) => {
  try {
    const { generation_id, rating, thumbs_up_down } = req.body;

    // generation_id maps to letter_id in our new schema
    if (!generation_id || rating === undefined) {
      return res.status(400).json({ error: 'generation_id and rating are required.' });
    }

    await pool.query(
      'INSERT INTO quality_ratings (letter_id, rating, thumbs_up_down) VALUES (?, ?, ?)',
      [generation_id, rating, thumbs_up_down]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Feedback Submission Error:', error);
    res.status(500).json({ error: 'Failed to save feedback.' });
  }
});

// Admin Analytics
router.get('/admin/analytics', async (req, res) => {
  try {
    const [totalGens] = await pool.query('SELECT COUNT(*) as count FROM generated_letters');
    const [avgRating] = await pool.query('SELECT AVG(rating) as avg_rating FROM quality_ratings');

    const [topInputs] = await pool.query(`
      SELECT ni.type as notice_type, COUNT(*) as count 
      FROM notice_inputs ni
      JOIN generated_letters gl ON ni.id = gl.input_id
      GROUP BY ni.type 
      ORDER BY count DESC 
      LIMIT 5
    `);

    // Trend for last 30 days
    const [trend] = await pool.query(`
      SELECT DATE(gl.timestamp) as date, COUNT(DISTINCT gl.id) as generations, 
             AVG(qr.rating) as avg_rating
      FROM generated_letters gl
      LEFT JOIN quality_ratings qr ON gl.id = qr.letter_id
      WHERE gl.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(gl.timestamp)
      ORDER BY date ASC
    `);

    res.json({
      totalGenerations: totalGens[0].count,
      averageRating: avgRating[0].avg_rating ? parseFloat(avgRating[0].avg_rating).toFixed(2) : 0,
      topNoticeTypes: topInputs,
      trend: trend
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// Get Templates
router.get('/templates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM templates');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates.' });
  }
});

// Add Template
router.post('/templates', async (req, res) => {
  try {
    const { title, noticeType, issue, clientFacts, strategy } = req.body;
    if (!title || !noticeType || !issue || !clientFacts || !strategy) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const [result] = await pool.query(
      'INSERT INTO templates (title, notice_type, issue, client_facts, response_strategy) VALUES (?, ?, ?, ?, ?)',
      [title, noticeType, issue, clientFacts, strategy]
    );
    res.json({ id: result.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add template.' });
  }
});

// Delete Template
router.delete('/templates/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template.' });
  }
});

module.exports = router;
