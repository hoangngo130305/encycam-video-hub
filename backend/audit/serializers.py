from rest_framework import serializers
from .models import AuditEntry
from accounts.serializers import UserSerializer


class AuditEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AuditEntry
        fields = ['id', 'timestamp', 'user', 'action', 'resource_type', 'resource_id', 'details']
