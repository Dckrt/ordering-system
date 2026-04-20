// ============================================================
// backend/routes/otp.js
// OTP email verification — send and verify endpoints
// ============================================================

const express    = require('express');
const router     = express.Router();
const oracledb   = require('oracledb');
const nodemailer = require('nodemailer');
const { getConnection } = require('../db');

// ── Nodemailer transporter (Gmail SMTP) ──────────────────────
// Make sure GMAIL_USER and GMAIL_PASS are set in your .env
// GMAIL_PASS must be a Google App Password (not your real password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Helper: generate a random 6-digit OTP ───────────────────
function generateOTP() {
  // Math.random gives 0.000000 – 0.999999
  // Multiply by 900000 and add 100000 → always 6 digits (100000–999999)
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Helper: delete old unused OTPs for this email ───────────
// Keeps the table clean — we only need the latest OTP per email
async function deleteOldOTPs(conn, email) {
  await conn.execute(
    `DELETE FROM otp_tokens WHERE email = :email`,
    { email },
  );
}

// ============================================================
// POST /api/otp/send
// Body: { email }
// 1. Generate OTP
// 2. Save to Oracle with expiry
// 3. Send email via Gmail
// ============================================================
router.post('/send', async (req, res) => {
  const { email } = req.body;

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  const otp        = generateOTP();
  const expiryMins = parseInt(process.env.OTP_EXPIRES_MINUTES) || 5;

  let conn;
  try {
    conn = await getConnection();

    // ── Step 1: Delete any existing OTPs for this email ──
    await deleteOldOTPs(conn, email);

    // ── Step 2: Save new OTP to Oracle ──────────────────
    // expires_at = current time + X minutes
    await conn.execute(
      `INSERT INTO otp_tokens (email, otp_code, expires_at, used)
       VALUES (:email, :otp_code, SYSDATE + :mins/1440, 0)`,
      {
        email,
        otp_code: otp,
        mins: expiryMins,   // 1440 minutes in a day, so mins/1440 = fraction of day
      },
    );
    await conn.commit();

    // ── Step 3: Send OTP via Gmail ───────────────────────
    await transporter.sendMail({
      from: `"Batangas Premium Naga" <${process.env.GMAIL_USER}>`,
      to:   email,
      subject: '🔐 Your OTP Verification Code',
      // Plain text fallback
      text: `Your OTP is: ${otp}\n\nThis code expires in ${expiryMins} minutes.\nDo not share this with anyone.`,
      // HTML version (nicer looking)
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#dc2626,#f97316);padding:12px 20px;border-radius:10px;">
              <span style="color:white;font-size:18px;font-weight:bold;">Batangas Premium Naga</span>
            </div>
          </div>
          <h2 style="color:#111;margin-bottom:8px;text-align:center;">Email Verification</h2>
          <p style="color:#6b7280;text-align:center;margin-bottom:24px;">Use the code below to verify your email address.</p>
          <div style="background:#f9fafb;border:2px dashed #dc2626;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="font-size:13px;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em;">Your OTP Code</p>
            <p style="font-size:40px;font-weight:800;letter-spacing:12px;color:#dc2626;margin:0;">${otp}</p>
          </div>
          <p style="color:#6b7280;font-size:13px;text-align:center;">⏱️ This code expires in <strong>${expiryMins} minutes</strong>.</p>
          <p style="color:#6b7280;font-size:13px;text-align:center;">🔒 Do not share this code with anyone.</p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
          <p style="color:#d1d5db;font-size:11px;text-align:center;">Noona's Food Station · Naga City, Camarines Sur</p>
        </div>
      `,
    });

    console.log(`✅ OTP sent to ${email}: ${otp}`); // visible in server terminal for debugging

    res.json({
      success: true,
      message: `OTP sent to ${email}. It expires in ${expiryMins} minutes.`,
    });

  } catch (err) {
    console.error('❌ Send OTP error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error:   err.message, // remove this in production
    });
  } finally {
    if (conn) await conn.close();
  }
});


// ============================================================
// POST /api/otp/verify
// Body: { email, otp }
// 1. Find OTP in Oracle for this email
// 2. Check it is not expired
// 3. Check it is not already used
// 4. Mark as used
// 5. Return success or error
// ============================================================
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required.',
    });
  }

  if (otp.length !== 6 || isNaN(otp)) {
    return res.status(400).json({
      success: false,
      message: 'OTP must be a 6-digit number.',
    });
  }

  let conn;
  try {
    conn = await getConnection();

    // ── Find the latest OTP for this email ───────────────
    const result = await conn.execute(
      `SELECT id           AS "id",
              otp_code     AS "otp_code",
              expires_at   AS "expires_at",
              used         AS "used"
       FROM otp_tokens
       WHERE LOWER(email) = LOWER(:email)
       ORDER BY created_at DESC
       FETCH FIRST 1 ROWS ONLY`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    // ── No OTP found for this email ───────────────────────
    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'No OTP found for this email. Please request a new one.',
      });
    }

    const record = result.rows[0];

    // ── Already used ──────────────────────────────────────
    if (record.used === 1) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has already been used. Please request a new one.',
      });
    }

    // ── Expired ───────────────────────────────────────────
    // Oracle returns expires_at as a JS Date object
    const now = new Date();
    const exp = new Date(record.expires_at);
    if (now > exp) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // ── Wrong code ────────────────────────────────────────
    if (record.otp_code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please check your email and try again.',
      });
    }

    // ── SUCCESS — mark OTP as used ────────────────────────
    await conn.execute(
      `UPDATE otp_tokens SET used = 1 WHERE id = :id`,
      { id: record.id },
    );
    await conn.commit();

    res.json({
      success: true,
      message: 'Email verified successfully! ✅',
    });

  } catch (err) {
    console.error('❌ Verify OTP error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  } finally {
    if (conn) await conn.close();
  }
});


// ============================================================
// POST /api/otp/resend
// Same as /send — just a convenience alias
// Deletes old OTP and sends a fresh one
// ============================================================
router.post('/resend', async (req, res) => {
  // Delegate to /send handler by forwarding the request
  req.url = '/send';
  router.handle(req, res, () => {});
});


module.exports = router;