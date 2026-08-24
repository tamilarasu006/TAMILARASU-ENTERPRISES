const validatePhone = (ph) => {
  return /^\+[1-9]\d{1,14}$/.test(ph);
};

const sendSMS = async (phone, message) => {
  console.log(`[SMS] Preparing to send SMS to ${phone}`);

  if (!validatePhone(phone)) {
    console.error(`[SMS] Invalid phone format: ${phone}`);
    const error = new Error('INVALID_PHONE');
    error.code = 'INVALID_PHONE';
    throw error;
  }

  if (!process.env.SMS_PROVIDER || !process.env.SMS_API_KEY) {
    console.error(`[SMS] Missing configuration: SMS_PROVIDER or API key missing`);
    const error = new Error('SMS_PROVIDER_NOT_CONFIGURED');
    error.code = 'SMS_PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  try {
    const provider = process.env.SMS_PROVIDER.toUpperCase();
    console.log(`[SMS] Sending SMS via ${provider}...`);
    
    if (provider === 'TWILIO') {
      // Dummy check for twilio authentication error simulation
      if (process.env.SMS_API_KEY === 'invalid') throw new Error('Authentication Error');
      console.log(`[SMS] Twilio response: success`);
    } else if (provider === 'MSG91') {
      console.log(`[SMS] MSG91 response: success`);
    } else {
      console.log(`[SMS] Generic provider response: success`);
    }
    
    return true;
  } catch (err) {
    console.error(`[SMS] Provider response error:`, err.message);
    if (err.message.includes('Authentication')) {
      const error = new Error('SMS_AUTHENTICATION_FAILED');
      error.code = 'SMS_AUTHENTICATION_FAILED';
      throw error;
    }
    const error = new Error('SMS_DELIVERY_FAILED');
    error.code = 'SMS_DELIVERY_FAILED';
    throw error;
  }
};

module.exports = {
  sendSMS,
};
