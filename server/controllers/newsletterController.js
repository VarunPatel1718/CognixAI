import sql from '../configs/db.js';

const createNewsletterTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Newsletter table ready');
  } catch (error) {
    console.error('❌ Failed to create newsletter table:', error);
  }
};

createNewsletterTable();

const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Save to database
    await sql`
      INSERT INTO newsletter_subscribers (email, subscribed_at)
      VALUES (${email}, NOW())
      ON CONFLICT (email) DO NOTHING
    `;

    res.json({ 
      success: true, 
      message: 'Successfully subscribed!' 
    });

  } catch (error) {
    console.error('Newsletter Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Something went wrong. Please try again.' 
    });
  }
};

export { subscribeNewsletter };
