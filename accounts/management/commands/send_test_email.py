from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Send a test email to verify email configuration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            type=str,
            help='Recipient email address (required)',
            required=True
        )

    def handle(self, *args, **options):
        recipient = options['to']

        self.stdout.write(f'Sending test email to: {recipient}')
        self.stdout.write(f'Email backend: {settings.EMAIL_BACKEND}')
        self.stdout.write(f'Email host: {settings.EMAIL_HOST}')
        self.stdout.write(f'Email port: {settings.EMAIL_PORT}')
        self.stdout.write(f'Email use TLS: {settings.EMAIL_USE_TLS}')
        self.stdout.write(f'From email: {settings.DEFAULT_FROM_EMAIL}')

        subject = 'Campus Hub - Test Email'
        message = (
            'This is a test email from Campus Hub.\n\n'
            'If you received this email, your email configuration is working correctly.\n\n'
            'You can safely delete this message.'
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [recipient]

        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS('Email sent successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to send email: {e}'))
