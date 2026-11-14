"""Extract only regular benchmark artifacts; never follow archive links."""
import pathlib
import sys
import tarfile

prefixes = ('benchmarks/rendering/results/', 'benchmarks/framework-ssr/results/', 'benchmarks/http/results/',
            'benchmarks/streaming/results/', 'benchmarks/cold-start/results/')
reports = {f'{suite}/README.md' for suite in
           ('benchmarks/rendering', 'benchmarks/framework-ssr', 'benchmarks/http', 'benchmarks/streaming', 'benchmarks/cold-start')}
reports |= {'docs/reports/scoreboard.md', 'docs/reports/engineering.md'}
with tarfile.open(sys.argv[1]) as archive:
    members = archive.getmembers()
    seen = set()
    for member in members:
        path = pathlib.PurePosixPath(member.name)
        if (not member.isfile() or path.is_absolute() or '..' in path.parts
                or member.name in seen
                or not (member.name.startswith(prefixes) or member.name in reports)):
            raise ValueError(f'Unsafe benchmark artifact: {member.name}')
        seen.add(member.name)
    archive.extractall(sys.argv[2], members=members, filter='data')
