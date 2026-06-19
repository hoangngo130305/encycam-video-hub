import os
import re
from django.conf import settings
from django.http import StreamingHttpResponse, HttpResponseNotFound


def serve_media_with_range(request, path):
    """Serve media files with HTTP Range support so videos can be seeked in the browser."""
    file_path = os.path.join(settings.MEDIA_ROOT, path)

    if not os.path.isfile(file_path):
        return HttpResponseNotFound()

    file_size = os.path.getsize(file_path)
    ext = os.path.splitext(file_path)[1].lower()
    content_type = 'video/mp4' if ext == '.mp4' else 'application/octet-stream'

    range_header = request.META.get('HTTP_RANGE', '').strip()
    if range_header:
        m = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if m:
            first = int(m.group(1))
            last = int(m.group(2)) if m.group(2) else file_size - 1
            last = min(last, file_size - 1)
            length = last - first + 1

            def _partial():
                with open(file_path, 'rb') as f:
                    f.seek(first)
                    remaining = length
                    while remaining > 0:
                        chunk = f.read(min(65536, remaining))
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk

            resp = StreamingHttpResponse(_partial(), status=206, content_type=content_type)
            resp['Content-Length'] = length
            resp['Content-Range'] = f'bytes {first}-{last}/{file_size}'
            resp['Accept-Ranges'] = 'bytes'
            return resp

    def _full():
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                yield chunk

    resp = StreamingHttpResponse(_full(), content_type=content_type)
    resp['Content-Length'] = file_size
    resp['Accept-Ranges'] = 'bytes'
    return resp
