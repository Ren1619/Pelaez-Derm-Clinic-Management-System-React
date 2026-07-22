<?php

namespace App\Mail;

use Illuminate\Http\Client\Factory as HttpFactory;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\Message;
use Symfony\Component\Mime\MessageConverter;
use Symfony\Component\Mime\Part\DataPart;

/**
 * Send Laravel email messages through Brevo's transactional email API.
 */
class BrevoTransport extends AbstractTransport
{
    /**
     * Create a Brevo mail transport.
     */
    public function __construct(
        private readonly HttpFactory $http,
        private readonly string $apiKey,
        private readonly string $apiUrl,
        private readonly string $senderEmail,
        private readonly string $senderName,
        private readonly int $timeout = 10,
        private readonly int $connectTimeout = 3,
    ) {
        parent::__construct();
    }

    /**
     * Send one email through Brevo.
     */
    protected function doSend(SentMessage $message): void
    {
        $originalMessage = $message->getOriginalMessage();

        if (! $originalMessage instanceof Message) {
            throw new TransportException('Brevo can only send MIME email messages.');
        }

        $email = MessageConverter::toEmail($originalMessage);

        // Laravel's HTTP client keeps normal TLS certificate verification enabled.
        $this->http
            ->acceptJson()
            ->withHeader('api-key', $this->apiKey)
            ->timeout($this->timeout)
            ->connectTimeout($this->connectTimeout)
            ->post($this->emailEndpoint(), $this->payload($email))
            ->throw();
    }

    /**
     * Get the transport name shown by Symfony Mailer.
     */
    public function __toString(): string
    {
        return 'brevo';
    }

    /**
     * Convert a Symfony email into Brevo's request format.
     *
     * @return array<string, mixed>
     */
    private function payload(Email $email): array
    {
        $payload = [
            // Always use the sender that Brevo has verified, regardless of message defaults.
            'sender' => array_filter([
                'email' => $this->senderEmail,
                'name' => $this->senderName,
            ]),
            'to' => $this->addresses($email->getTo()),
            'subject' => $email->getSubject() ?? '',
        ];

        if ($html = $this->body($email->getHtmlBody())) {
            $payload['htmlContent'] = $html;
        }

        if ($text = $this->body($email->getTextBody())) {
            $payload['textContent'] = $text;
        }

        if ($cc = $this->addresses($email->getCc())) {
            $payload['cc'] = $cc;
        }

        if ($bcc = $this->addresses($email->getBcc())) {
            $payload['bcc'] = $bcc;
        }

        if ($replyTo = $email->getReplyTo()[0] ?? null) {
            $payload['replyTo'] = $this->address($replyTo);
        }

        if ($attachments = $this->attachments($email->getAttachments())) {
            $payload['attachment'] = $attachments;
        }

        return $payload;
    }

    /**
     * Build the transactional email endpoint from configuration.
     */
    private function emailEndpoint(): string
    {
        return rtrim($this->apiUrl, '/').'/smtp/email';
    }

    /**
     * Convert email addresses into Brevo recipient objects.
     *
     * @param  Address[]  $addresses
     * @return array<int, array<string, string>>
     */
    private function addresses(array $addresses): array
    {
        return array_map($this->address(...), $addresses);
    }

    /**
     * Convert one email address into Brevo's format.
     *
     * @return array<string, string>
     */
    private function address(Address $address): array
    {
        return array_filter([
            'email' => $address->getAddress(),
            'name' => $address->getName(),
        ]);
    }

    /**
     * Read a string or stream email body safely.
     *
     * @param  resource|string|null  $body
     */
    private function body(mixed $body): ?string
    {
        if (is_resource($body)) {
            $body = stream_get_contents($body);
        }

        return is_string($body) && $body !== '' ? $body : null;
    }

    /**
     * Convert attachments into Brevo's base64 format.
     *
     * @param  DataPart[]  $attachments
     * @return array<int, array{name: string, content: string}>
     */
    private function attachments(array $attachments): array
    {
        return array_map(
            fn (DataPart $attachment): array => [
                'name' => $attachment->getFilename() ?? 'attachment',
                'content' => base64_encode($attachment->getBody()),
            ],
            $attachments,
        );
    }
}
