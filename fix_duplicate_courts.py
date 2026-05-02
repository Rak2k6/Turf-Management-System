import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'turf_backend.settings')
django.setup()

from collections import defaultdict
from bookings.models import Court

seen = defaultdict(list)
for c in Court.objects.all().order_by('id'):
    seen[(c.tenant_id, c.name)].append(c)

for (tid, name), courts in seen.items():
    if len(courts) > 1:
        for i, court in enumerate(courts[1:], 2):
            new_name = f'{name} ({court.sport_type.capitalize()}) {i}'
            print(f'Renaming court id={court.id} from "{name}" to "{new_name}"')
            court.name = new_name
            court.save()

print('Done - duplicate court names resolved.')
