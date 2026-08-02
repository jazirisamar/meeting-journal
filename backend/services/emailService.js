const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendMeetingInvitation = async (meeting) => {
  const participantEmails = meeting.participants
    .map(p => p.email)
    .filter(email => email);

  if (participantEmails.length === 0) return;

  const participantsList = meeting.participants
    .map(p => `<li style="padding: 4px 0; color: #333;">${p.name}</li>`)
    .join('');

  const mailOptions = {
    from: `"Meeting Journal" <${process.env.EMAIL_USER}>`,
    to: participantEmails.join(','),
    subject: `Invitation : ${meeting.title}`,
    html: `
    <!DOCTYPE html>
    <html lang="fr">
    <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4a90d9, #3a72b3); padding: 32px 40px;">
                  <p style="margin:0; color: rgba(255,255,255,0.85); font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Meeting Journal</p>
                  <h1 style="margin: 8px 0 0; color: #ffffff; font-size: 24px; font-weight: 600;">Vous êtes invité(e) à une réunion</h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 32px 40px;">

                  <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px;">${meeting.title}</h2>

                  ${meeting.description ? `
                  <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">${meeting.description}</p>
                  ` : ''}

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    ${meeting.category ? `
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span style="display:inline-block; background:#eef4fc; color:#3a72b3; font-size:12px; font-weight:600; padding: 4px 10px; border-radius: 20px;">${meeting.category}</span>
                      </td>
                    </tr>
                    ` : ''}
                  </table>

                  <div style="background:#f8f9fb; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
                    <p style="margin:0 0 10px; color:#888; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Participants</p>
                    <ul style="margin:0; padding-left: 18px; font-size: 14px;">
                      ${participantsList}
                    </ul>
                  </div>

                  <div style="border-left: 3px solid #4a90d9; background:#f0f6fc; padding: 14px 18px; border-radius: 4px;">
                    <p style="margin:0; color:#3a5f7d; font-size: 14px; line-height: 1.5;">
                      🎥 Cette réunion sera enregistrée. Vous recevrez un lien vers l'enregistrement et les notes une fois disponibles.
                    </p>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background:#f8f9fb; border-top: 1px solid #eee;">
                  <p style="margin:0; color:#999; font-size:12px; text-align:center;">
                    Envoyé automatiquement par Meeting Journal
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  };

  await transporter.sendMail(mailOptions);
};