from django.contrib.auth import (authenticate,login,logout,update_session_auth_hash)
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.db import IntegrityError
from django.db.models import Count, Q
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.mail import send_mail
import os
import secrets
import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .serializers import (RegisterSerializer, StudentProfileSerializer, MessageSerializer, ForgotPasswordSerializer, ResetPasswordSerializer)

from .models import Connection, Message, StudentProfile, PasswordResetToken

logger = logging.getLogger(__name__)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def test_api(request):

    return Response({
        "message": "Backend is working"
    })


@csrf_exempt
@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def register(request):
    serializer = RegisterSerializer(
        data=request.data
    )

    if serializer.is_valid():
        user = serializer.save()
        print("Created:", user.username)
        print("User count:", User.objects.count())
        return Response(
            {"message": "User created"},
            status=201,
        )

    return Response(
        serializer.errors,
        status=400,
    )


@csrf_exempt
@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    print("Attempting login:", username)
    print("Users:", list(User.objects.values_list("username", flat=True)))

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user:
        login(request, user)

        return Response({
            "message": "Logged in"
        })

    return Response(
        {
            "message": "Invalid credentials"
        },
        status=401
    )
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):

    if request.user.is_authenticated:
        profile = StudentProfile.objects.filter(user=request.user).first()
        profile_image = profile.profile_image.url if profile and profile.profile_image else None

        # Diagnostic information
        diagnostic = {}
        if profile and profile.profile_image:
            diagnostic = {
                "profile_image_name": profile.profile_image.name,
                "profile_image_url": profile.profile_image.url,
                "storage_class": type(profile.profile_image.storage).__name__,
            }

        return Response({
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "first_name": profile.first_name if profile else "",
                "last_name": profile.last_name if profile else "",
                "profile_image": profile_image,
            },
            "diagnostic": diagnostic
        })

    return Response(
        {
            "message": "Unauthorized"
        },
        status=401
    )
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    logout(request)

    return Response({
        "message": "Logged out"
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user

    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")
    confirm_password = request.data.get("confirm_password")

    if not current_password or not new_password or not confirm_password:
        return Response({"message": "All password fields are required."}, status=400)

    if not user.check_password(current_password):
        return Response({"message": "Current password is incorrect."}, status=400)

    if new_password != confirm_password:
        return Response({"message": "New passwords do not match."}, status=400)

    try:
        validate_password(new_password, user=user)
    except ValidationError as e:
        return Response({"message": str(e)}, status=400)

    user.set_password(new_password)
    user.save()

    update_session_auth_hash(request, user)

    return Response({"message": "Password changed successfully."})

@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):

    if not request.user.is_authenticated:

        return Response(
            {
                "message":
                "Unauthorized"
            },
            status=401
        )

    try:

        profile = StudentProfile.objects.get(
            user=request.user
        )

        serializer = StudentProfileSerializer(
            profile
        )

        return Response(
            serializer.data
        )

    except StudentProfile.DoesNotExist:

        return Response(
            {
                "message":
                "Profile not found"
            },
            status=404
        )
class StudentDirectoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_directory(request):
    search = request.GET.get("search")
    department = request.GET.get("department")
    year = request.GET.get("year")

    profiles = StudentProfile.objects.exclude(user=request.user).order_by("first_name", "last_name")

    if search:
        profiles = profiles.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(user__username__icontains=search)
        )

    if department:
        profiles = profiles.filter(department__icontains=department)

    if year:
        try:
            profiles = profiles.filter(year=int(year))
        except ValueError:
            pass

    paginator = StudentDirectoryPagination()
    page = paginator.paginate_queryset(profiles, request)
    serializer = StudentProfileSerializer(page, many=True, context={"request": request})

    return paginator.get_paginated_response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_connection_request(request, id):
    if request.user.id == id:
        return Response({"error": "Cannot connect to yourself"}, status=400)

    try:
        target_user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({"error": "Target user does not exist."}, status=404)

    existing_request = Connection.objects.filter(
        from_user=request.user,
        to_user=target_user,
    ).first()

    if existing_request:
        return Response({"error": "Connection already exists"}, status=400)

    reverse_request = Connection.objects.filter(
        from_user=target_user,
        to_user=request.user,
    ).first()

    if reverse_request:
        if reverse_request.status == Connection.STATUS_PENDING:
            return Response(
                {"error": "This student has already sent you a connection request."},
                status=400,
            )
        if reverse_request.status == Connection.STATUS_CONNECTED:
            return Response({"error": "You are already connected."}, status=400)

    try:
        connection = Connection.objects.create(
            from_user=request.user,
            to_user=target_user,
            status=Connection.STATUS_PENDING,
        )
    except IntegrityError:
        return Response({"error": "Connection already exists"}, status=400)

    return Response({"message": "Connection request sent."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_connection(request, id):
    try:
        connection = Connection.objects.get(pk=id, to_user=request.user)
    except Connection.DoesNotExist:
        return Response({"message": "Connection request not found."}, status=404)

    if connection.status != Connection.STATUS_PENDING:
        return Response({"message": "Connection request is not pending."}, status=400)

    connection.status = Connection.STATUS_CONNECTED
    connection.save()
    return Response({"message": "Connection request accepted."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_connection(request, id):
    try:
        connection = Connection.objects.get(pk=id, to_user=request.user)
    except Connection.DoesNotExist:
        return Response({"message": "Connection request not found."}, status=404)

    if connection.status != Connection.STATUS_PENDING:
        return Response({"message": "Connection request is not pending."}, status=400)

    connection.status = Connection.STATUS_REJECTED
    connection.save()
    return Response({"message": "Connection request rejected."})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_connection(request, id):
    try:
        connection = Connection.objects.get(pk=id)
    except Connection.DoesNotExist:
        try:
            target_profile = StudentProfile.objects.get(pk=id)
        except StudentProfile.DoesNotExist:
            return Response({"message": "Connection or profile not found."}, status=404)

        connection = Connection.objects.filter(
            from_user=request.user,
            to_user=target_profile.user,
            status=Connection.STATUS_PENDING,
        ).first()
        if not connection:
            return Response({"message": "Connection not found."}, status=404)

    # Authorization: only sender can cancel pending requests, either party can remove connected connections
    if connection.status == Connection.STATUS_PENDING:
        # Only the sender (from_user) can cancel pending requests
        if request.user.id != connection.from_user.id:
            return Response({"message": "You are not authorized to cancel this request."}, status=403)
    else:
        # Either party can remove established connections
        if request.user.id not in [connection.from_user.id, connection.to_user.id]:
            return Response({"message": "You are not authorized to remove this connection."}, status=403)

    connection.delete()
    return Response({"message": "Connection removed."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def connection_status_lists(request):
    incoming = Connection.objects.filter(to_user=request.user, status=Connection.STATUS_PENDING)
    sent = Connection.objects.filter(from_user=request.user, status=Connection.STATUS_PENDING)
    connected = Connection.objects.filter(
        (Q(from_user=request.user) | Q(to_user=request.user)),
        status=Connection.STATUS_CONNECTED,
    )

    def connection_payload(connection):
        other_user = connection.other_user(request.user)
        profile = StudentProfile.objects.filter(user=other_user).first()
        unread_count = Message.objects.filter(
            sender=other_user,
            receiver=request.user,
            is_read=False
        ).count()
        return {
            "id": connection.id,
            "from_user": connection.from_user.id,
            "to_user": connection.to_user.id,
            "status": connection.status,
            "other_user_id": other_user.id,
            "other_username": other_user.username,
            "first_name": profile.first_name if profile else "",
            "last_name": profile.last_name if profile else "",
            "department": profile.department if profile else "",
            "year": profile.year if profile else None,
            "profile_image": profile.profile_image.url if profile and profile.profile_image else None,
            "unread_count": unread_count,
        }

    return Response({
        "incoming_requests": [connection_payload(c) for c in incoming],
        "sent_requests": [connection_payload(c) for c in sent],
        "connections": [connection_payload(c) for c in connected],
    })


def _has_connected_connection(user1, user2):
    return Connection.objects.filter(
        (
            Q(from_user=user1) & Q(to_user=user2)
        ) | (
            Q(from_user=user2) & Q(to_user=user1)
        ),
        status=Connection.STATUS_CONNECTED,
    ).exists()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def message_conversation(request, user_id):
    if request.user.id == user_id:
        return Response({"error": "You can only message connected users"}, status=400)

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Target user does not exist."}, status=404)

    # Support incremental sync with 'after' parameter
    after_id = request.GET.get("after")

    # Always return existing messages, regardless of connection status
    messages = Message.objects.filter(
        (Q(sender=request.user) & Q(receiver=target_user)) |
        (Q(sender=target_user) & Q(receiver=request.user))
    ).order_by("created_at")

    if after_id:
        try:
            after_id = int(after_id)
            messages = messages.filter(id__gt=after_id)
        except ValueError:
            pass

    Message.objects.filter(
        sender=target_user,
        receiver=request.user,
        is_read=False,
    ).update(is_read=True)

    serializer = MessageSerializer(messages, many=True)

    # Check if connection is still active for sending messages
    has_connection = _has_connected_connection(request.user, target_user)

    return Response({
        "messages": serializer.data,
        "has_connection": has_connection
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, user_id):
    if request.user.id == user_id:
        return Response({"error": "You can only message connected users"}, status=400)

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Target user does not exist."}, status=404)

    has_connection = _has_connected_connection(request.user, target_user)
    if not has_connection:
        return Response({"error": "You can only message connected users"}, status=403)

    content = (request.data.get("content") or "").strip()
    if not content:
        return Response({"error": "Message content cannot be empty."}, status=400)

    message = Message.objects.create(
        sender=request.user,
        receiver=target_user,
        content=content,
    )
    serializer = MessageSerializer(message)
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    try:
        message = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response({"error": "Message not found."}, status=404)

    if message.sender != request.user:
        return Response({"error": "Not allowed"}, status=403)

    message.delete()
    return Response({"success": True})


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def edit_message(request, message_id):
    try:
        message = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response({"error": "Message not found."}, status=404)

    if message.sender != request.user:
        return Response({"error": "Not allowed"}, status=403)

    content = (request.data.get("content") or "").strip()
    if not content:
        return Response({"error": "Message content cannot be empty."}, status=400)

    message.content = content
    message.edited_at = timezone.now()
    message.save()

    serializer = MessageSerializer(message)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_message_counts(request):
    unread_counts = Message.objects.filter(
        receiver=request.user,
        is_read=False,
    ).values(
        "sender_id",
        "sender__username",
    ).annotate(unread_count=Count("id"))

    total_unread = sum(item["unread_count"] for item in unread_counts)
    return Response({
        "total_unread": total_unread,
        "by_sender": [
            {
                "sender_id": item["sender_id"],
                "sender_username": item["sender__username"],
                "unread_count": item["unread_count"],
            }
            for item in unread_counts
        ],
    })


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def create_profile(request):

    if not request.user.is_authenticated:

        return Response(
            {
                "message":
                "Unauthorized"
            },
            status=401
        )

    serializer = StudentProfileSerializer(
        data=request.data,
        context={"request": request}
    )

    if serializer.is_valid():

        serializer.save()

        return Response(
            {
                "message":
                "Profile created"
            }
        )

    return Response(
        serializer.errors,
        status=400
    )


@api_view(["GET"])
def csrf_token(request):
    token = get_token(request)
    return Response({"csrfToken": token})


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def update_profile(request):

    if not request.user.is_authenticated:

        return Response(
            {
                "message":
                "Unauthorized"
            },
            status=401
        )

    try:

        profile = StudentProfile.objects.get(
            user=request.user
        )

    except StudentProfile.DoesNotExist:

        return Response(
            {
                "message":
                "Profile not found"
            },
            status=404
        )

    serializer = StudentProfileSerializer(
        profile,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():

        serializer.save()

        return Response(
            serializer.data
        )

    return Response(
        serializer.errors,
        status=400
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):

    user = request.user
    user_pk = user.pk

    logout(request)

    user.delete()

    return Response({
        "message": "Account deleted successfully"
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def debug_storage(request):

    return Response({
        "DEBUG": settings.DEBUG,
        "env_DEBUG": os.environ.get("DEBUG"),
        "STORAGES": settings.STORAGES,
        "DEFAULT_FILE_STORAGE": getattr(settings, "DEFAULT_FILE_STORAGE", None),
        "default_storage_class": type(default_storage).__name__,
        "profile_image_storage_class": type(StudentProfile._meta.get_field("profile_image").storage).__name__
    })


@csrf_exempt
@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    email = serializer.save()
    profile = StudentProfile.objects.filter(email__iexact=email).first()

    if profile:
        user = profile.user

        # Invalidate existing unused tokens for this user
        PasswordResetToken.objects.filter(
            user=user,
            used=False
        ).update(used=True)

        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRE_HOURS', 1))

        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

        # Send password reset email
        subject = "Campus Hub Password Reset"
        message = (
            f"Hello {user.username},\n\n"
            f"You requested a password reset for your Campus Hub account.\n\n"
            f"Your password reset token is: {token}\n\n"
            f"This token will expire in {getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRE_HOURS', 1)} hour(s).\n\n"
            f"If you did not request this password reset, please ignore this email.\n\n"
            f"Campus Hub"
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]

        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            # Continue with generic response to maintain security

    return Response({
        "message": "If an account with this email exists, you will receive a password reset link."
    })


@csrf_exempt
@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    serializer.save()

    return Response({
        "message": "Password reset successfully."
    })