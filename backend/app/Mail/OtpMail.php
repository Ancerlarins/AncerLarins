<?php

namespace App\Mail;

use App\Enums\OtpPurpose;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public OtpPurpose $purpose,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->purpose) {
            OtpPurpose::Registration => 'Verify your AncerLarins account',
            OtpPurpose::Login => 'Your AncerLarins login code',
            OtpPurpose::PasswordReset => 'Reset your AncerLarins password',
            OtpPurpose::PhoneChange => 'Confirm your phone number change',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.otp');
    }
}
