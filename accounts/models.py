from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User


class StudentProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    first_name = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    last_name = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    email = models.EmailField(
        blank=True,
        default=""
    )

    department = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    year = models.IntegerField(
        null=True,
        blank=True
    )

    profile_image = models.ImageField(
        upload_to="profile_images/",
        blank=True,
        null=True
    )

    def clean(self):
        if self.year is not None:
            current_year = timezone.now().year
            if self.year < 1900 or self.year > current_year + 10:
                raise ValidationError({"year": "Year must be between 1900 and 10 years in the future."})

    def __str__(self):
        return self.user.username


class Connection(models.Model):
    STATUS_PENDING = "pending"
    STATUS_CONNECTED = "connected"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONNECTED, "Connected"),
        (STATUS_REJECTED, "Rejected"),
    ]

    from_user = models.ForeignKey(
        User,
        related_name="connections_sent",
        on_delete=models.CASCADE,
    )
    to_user = models.ForeignKey(
        User,
        related_name="connections_received",
        on_delete=models.CASCADE,
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["from_user", "to_user"]]
        ordering = ["-created_at"]

    def clean(self):
        if self.from_user == self.to_user:
            raise ValidationError("Users cannot connect to themselves.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def other_user(self, user):
        return self.to_user if self.from_user == user else self.from_user

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"


class Message(models.Model):
    sender = models.ForeignKey(
        User,
        related_name="messages_sent",
        on_delete=models.CASCADE,
    )
    receiver = models.ForeignKey(
        User,
        related_name="messages_received",
        on_delete=models.CASCADE,
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message {self.id}: {self.sender.username} -> {self.receiver.username}"
