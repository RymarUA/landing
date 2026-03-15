// Test Resend API
const { Resend } = require('resend');

const resend = new Resend('re_B6MJddoT_H3gHsyJAhUXSPogNtmvBYeUd');

async function testEmail() {
  try {
    console.log('Testing Resend API...');
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'kateandrosov@gmail.com',
      subject: 'Test OTP Code',
      html: '<h1>Test OTP</h1><p>Your code is: 123456</p>',
    });

    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();
