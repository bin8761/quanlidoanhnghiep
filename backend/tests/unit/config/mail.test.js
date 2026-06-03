describe('config/mail', () => {
  function loadMailConfig() {
    jest.resetModules();

    const sendMail = jest.fn();
    const createTransport = jest.fn(() => ({
      sendMail,
    }));

    jest.doMock('nodemailer', () => ({
      createTransport,
    }));

    return {
      mailConfig: require('../../../src/config/mail'),
      createTransport,
      sendMail,
    };
  }

  test('creates Gmail SMTP transport from env-backed config', () => {
    const { createTransport } = loadMailConfig();

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: expect.any(String),
        port: expect.any(Number),
        secure: expect.any(Boolean),
        auth: expect.objectContaining({
          user: expect.any(String),
          pass: expect.any(String),
        }),
      }),
    );
  });

  test('sendForgotPasswordOtpEmail sends composed OTP mail payload', async () => {
    const { mailConfig, sendMail } = loadMailConfig();

    await mailConfig.sendForgotPasswordOtp({
      toEmail: 'user@example.com',
      otp: '123456',
      expiresInSeconds: 60,
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.any(String),
        text: expect.stringContaining('123456'),
      }),
    );
  });
});
