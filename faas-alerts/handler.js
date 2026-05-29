const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.processAlert = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { userEmail, asset, price, threshold, type } = body;

    // Validate inputs
    if (!userEmail || !asset || !price || !threshold || !type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    const msg = {
      to: userEmail,
      from: process.env.SENDER_EMAIL, // Must be a verified sender in SendGrid
      subject: `Market Alert: ${asset} Price Alert`,
      text: `The price of ${asset} is currently ${price}, which is ${type} your threshold of ${threshold}.`,
      html: `<strong>The price of ${asset} is currently ${price}, which is ${type} your threshold of ${threshold}.</strong>`,
    };

    // Send email via SendGrid SaaS
    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Alert sent successfully',
      }),
    };
  } catch (error) {
    console.error('Error sending alert:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to send alert',
        error: error.message,
      }),
    };
  }
};
