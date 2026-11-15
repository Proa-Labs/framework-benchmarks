"""Check that a paired experiment changed only the pinned Proa revision."""
import json
import hashlib
import pathlib
import re
import sys
import tarfile

for pair in json.load(sys.stdin):
    def files(path, expected):
        with tarfile.open(path) as archive:
            result, digest = {}, hashlib.sha256()
            for member in archive:
                name=member.name
                assert member.isfile() and re.fullmatch(r'[a-zA-Z0-9_./+()[\]-]+',name)
                assert not name.startswith('/') and '..' not in pathlib.PurePosixPath(name).parts
                assert name not in result
                body=archive.extractfile(member).read()
                result[name]=body
                digest.update((pair['prefix']+name+'\0').encode())
                digest.update(body);digest.update(b'\0')
            assert digest.hexdigest()==expected, 'Captured source fingerprint differs'
            return result
    before, after = files(pair['before'],pair['beforeExpected']), files(pair['after'],pair['afterExpected'])
    assert before.keys() == after.keys(), 'Measured source files changed between revisions'
    changed = []
    for name in before:
        if before[name] == after[name]:
            continue
        assert name in ('Cargo.lock', 'framework-ssr/adapters/proa/Cargo.lock', 'benchmarks/framework-ssr/adapters/proa/Cargo.lock'), name
        assert before[name].replace(pair['beforeRevision'].encode(), pair['afterRevision'].encode()) == after[name], name
        changed.append(name)
    assert 'Cargo.lock' in changed, 'Proa dependency was not updated'
