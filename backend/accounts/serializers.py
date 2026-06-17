from rest_framework import serializers
from .models import User, ROLE_AVATAR_COLORS


class UserSerializer(serializers.ModelSerializer):
    """Full user representation — matches frontend User interface exactly."""

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'role',
            'initials', 'avatar_bg', 'avatar_color',
            'locked', 'created_at',
        ]
        read_only_fields = ['id', 'initials', 'avatar_bg', 'avatar_color', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Used by admin to create a new user account."""
    password = serializers.CharField(write_only=True, required=False, default='Encycam@2026')

    class Meta:
        model = User
        fields = ['name', 'email', 'role', 'password']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email đã tồn tại trong hệ thống.')
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password', 'Encycam@2026')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Used by admin to edit an existing user's name, email, or role."""

    class Meta:
        model = User
        fields = ['name', 'email', 'role']

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Email đã tồn tại trong hệ thống.')
        return value.lower()

    def update(self, instance, validated_data):
        new_role = validated_data.get('role', instance.role)
        instance.name = validated_data.get('name', instance.name)
        instance.email = validated_data.get('email', instance.email)

        # When role changes, regenerate initials + avatar colours
        if new_role != instance.role:
            instance.role = new_role
            bg, color = ROLE_AVATAR_COLORS.get(new_role, ('#dbeafe', '#1d4ed8'))
            instance.avatar_bg = bg
            instance.avatar_color = color
            # Regenerate initials
            words = instance.name.strip().split()
            instance.initials = ''.join(w[0] for w in words if w)[:2].upper()

        instance.save()
        return instance
