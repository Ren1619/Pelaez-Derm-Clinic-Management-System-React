<?php

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

test('the configured Brevo transport sends a correctly formatted API request', function () {
    config()->set('services.brevo', [
        'key' => 'test-api-key',
        'api_url' => 'https://brevo.example.test/v3/',
        'sender_email' => 'verified-sender@example.com',
        'sender_name' => 'Pelaez Clinic',
        'timeout' => 5,
        'connect_timeout' => 2,
    ]);

    Http::fake([
        'brevo.example.test/*' => Http::response(['messageId' => 'test-message-id'], 201),
    ]);

    $email = (new Email)
        ->from(new Address('unverified-message-default@example.com', 'Wrong Sender'))
        ->to(new Address('patient@example.com', 'Patient Name'))
        ->replyTo('support@example.com')
        ->subject('Reset your password')
        ->text('Use the secure reset link.')
        ->html('<p>Use the secure reset link.</p>')
        ->attach('test file', 'instructions.txt');

    Mail::mailer('brevo')->getSymfonyTransport()->send($email);

    Http::assertSent(function (Request $request): bool {
        return $request->url() === 'https://brevo.example.test/v3/smtp/email'
            && $request->hasHeader('api-key', 'test-api-key')
            && $request['sender'] === [
                'email' => 'verified-sender@example.com',
                'name' => 'Pelaez Clinic',
            ]
            && $request['to'] === [[
                'email' => 'patient@example.com',
                'name' => 'Patient Name',
            ]]
            && $request['subject'] === 'Reset your password'
            && $request['htmlContent'] === '<p>Use the secure reset link.</p>'
            && $request['textContent'] === 'Use the secure reset link.'
            && $request['replyTo'] === ['email' => 'support@example.com']
            && $request['attachment'] === [[
                'name' => 'instructions.txt',
                'content' => base64_encode('test file'),
            ]];
    });

    Http::assertSentCount(1);
});

test('the Brevo transport rejects a missing API key before sending', function () {
    config()->set('services.brevo.key', null);
    config()->set('services.brevo.sender_email', 'verified-sender@example.com');
    Http::fake();

    expect(fn () => Mail::mailer('brevo'))
        ->toThrow(InvalidArgumentException::class, 'BREVO_API_KEY');

    Http::assertNothingSent();
});

test('the Brevo transport rejects a missing verified sender before sending', function () {
    config()->set('services.brevo.key', 'test-api-key');
    config()->set('services.brevo.sender_email', null);
    Http::fake();

    expect(fn () => Mail::mailer('brevo'))
        ->toThrow(InvalidArgumentException::class, 'BREVO_SENDER_EMAIL');

    Http::assertNothingSent();
});
