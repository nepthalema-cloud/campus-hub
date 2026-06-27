from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.core.exceptions import ValidationError
from .models import Connection, Message, StudentProfile

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="A user with that username already exists.",
            )
        ]
    )

    class Meta:
        model = User

        fields = [
            "username",
            "password"
        ]

        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }

    def create(self, validated_data):

        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"]
        )

        return user
    
 


class StudentProfileSerializer(
    serializers.ModelSerializer
):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    connection_status = serializers.SerializerMethodField()
    connection_direction = serializers.SerializerMethodField()

    class Meta:

        model = StudentProfile

        fields = [

            "id",

            "user_id",

            "username",

            "first_name",

            "last_name",

            "email",

            "department",

            "year",

            "profile_image",

            "connection_status",

            "connection_direction",

        ]

    def get_connection_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        current_user = request.user
        if current_user == obj.user:
            return None

        status = "connect"
        outgoing = Connection.objects.filter(
            from_user=current_user,
            to_user=obj.user,
        ).first()

        if outgoing:
            if outgoing.status == Connection.STATUS_PENDING:
                status = "pending_sent"
            elif outgoing.status == Connection.STATUS_CONNECTED:
                status = "connected"
            elif outgoing.status == Connection.STATUS_REJECTED:
                status = "declined_sent"
            else:
                status = "connect"
        else:
            incoming = Connection.objects.filter(
                from_user=obj.user,
                to_user=current_user,
            ).first()

            if incoming:
                if incoming.status == Connection.STATUS_PENDING:
                    status = "pending_received"
                elif incoming.status == Connection.STATUS_CONNECTED:
                    status = "connected"
                elif incoming.status == Connection.STATUS_REJECTED:
                    status = "declined_received"
                else:
                    status = "connect"

        return status

    def get_connection_direction(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        current_user = request.user
        if current_user == obj.user:
            return None

        outgoing = Connection.objects.filter(
            from_user=current_user,
            to_user=obj.user,
        ).first()

        if outgoing:
            return "outgoing"

        incoming = Connection.objects.filter(
            from_user=obj.user,
            to_user=current_user,
        ).first()

        if incoming:
            return "incoming"

        return None

    def validate_profile_image(self, value):
        if not value:
            return value
        
        # Check file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise ValidationError("Profile image cannot be larger than 5MB.")
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
        if value.content_type not in allowed_types:
            raise ValidationError("Profile image must be a valid image file (JPEG, PNG, GIF, or WebP).")
        
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        return StudentProfile.objects.create(user=user, **validated_data)


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_first_name = serializers.SerializerMethodField()
    sender_last_name = serializers.SerializerMethodField()
    sender_profile_image = serializers.SerializerMethodField()
    receiver_id = serializers.IntegerField(source="receiver.id", read_only=True)
    receiver_username = serializers.CharField(source="receiver.username", read_only=True)
    receiver_first_name = serializers.SerializerMethodField()
    receiver_last_name = serializers.SerializerMethodField()
    receiver_profile_image = serializers.SerializerMethodField()
    is_edited = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender_id",
            "sender_username",
            "sender_first_name",
            "sender_last_name",
            "sender_profile_image",
            "receiver_id",
            "receiver_username",
            "receiver_first_name",
            "receiver_last_name",
            "receiver_profile_image",
            "content",
            "created_at",
            "edited_at",
            "is_edited",
            "is_read",
        ]

    def get_is_edited(self, obj):
        return bool(obj.edited_at)

    def get_sender_first_name(self, obj):
        profile = StudentProfile.objects.filter(user=obj.sender).first()
        return profile.first_name if profile else ""

    def get_sender_last_name(self, obj):
        profile = StudentProfile.objects.filter(user=obj.sender).first()
        return profile.last_name if profile else ""

    def get_sender_profile_image(self, obj):
        profile = StudentProfile.objects.filter(user=obj.sender).first()
        return profile.profile_image.url if profile and profile.profile_image else None

    def get_receiver_first_name(self, obj):
        profile = StudentProfile.objects.filter(user=obj.receiver).first()
        return profile.first_name if profile else ""

    def get_receiver_last_name(self, obj):
        profile = StudentProfile.objects.filter(user=obj.receiver).first()
        return profile.last_name if profile else ""

    def get_receiver_profile_image(self, obj):
        profile = StudentProfile.objects.filter(user=obj.receiver).first()
        return profile.profile_image.url if profile and profile.profile_image else None

