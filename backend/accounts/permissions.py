from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    message = 'Chỉ Admin mới có quyền thực hiện thao tác này.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.has_role('admin'))


class IsBtv(BasePermission):
    message = 'Chỉ BTV mới có quyền thực hiện thao tác này.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.has_role('btv'))


class IsReviewer(BasePermission):
    message = 'Chỉ Reviewer mới có quyền thực hiện thao tác này.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.has_role('reviewer'))


class IsFinal(BasePermission):
    message = 'Chỉ Duyệt cuối mới có quyền thực hiện thao tác này.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.has_role('final'))


class IsReviewerOrFinal(BasePermission):
    message = 'Chỉ Reviewer hoặc Duyệt cuối mới có quyền thực hiện thao tác này.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.has_role('reviewer', 'final'))
