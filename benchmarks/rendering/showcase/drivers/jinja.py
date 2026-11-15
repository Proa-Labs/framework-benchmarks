"""Native Jinja admission entry. Template compilation and data hydration are untimed."""
import argparse
import json
import time
from pathlib import Path
from jinja2 import Environment, BaseLoader

parser = argparse.ArgumentParser()
parser.add_argument('--input', type=Path, required=True)
parser.add_argument('--dump', type=Path)
parser.add_argument('--out', type=Path)
parser.add_argument('--iterations', type=int, default=100)
parser.add_argument('--warmup', type=int, default=10)
parser.add_argument('--dump-only', action='store_true')
parser.add_argument('--probe', choices=['baseline', 'title', 'text', 'request'], default='baseline')
args = parser.parse_args()
fixture = json.loads(args.input.with_suffix(args.input.suffix + '.json').read_text())
records = fixture['records']
controls = fixture['definition']['controls']
probe = '</span><img id="escaped-probe" src=x> & < > " \' ✓'
if args.probe == 'title':
    records[0]['texts'][controls['titleIndex']] = probe
elif args.probe == 'text':
    field = controls['text']
    records[field['record']]['texts'][field['slot']] = probe
elif args.probe == 'request':
    records[0]['texts'][controls['requestIndex']] = probe
for record in reversed(records):
    record['groups'] = [[records[i] for i in group] for group in record['groups']]
data = records[0]
env = Environment(loader=BaseLoader(), autoescape=True, keep_trailing_newline=True)
template = env.from_string(args.input.read_text())
def render():
    return template.render(data=data, styles=fixture['styles'], request=data['texts'][controls['requestIndex']])
html = render()
if args.dump:
    args.dump.write_text(html)
if args.out and not args.dump_only:
    assert args.iterations > 0 and args.warmup >= 0
    for _ in range(args.warmup):
        html = render()
    samples = []
    for _ in range(args.iterations):
        started = time.perf_counter_ns()
        output = render()
        elapsed = (time.perf_counter_ns() - started) / 1000
        html = output  # Release the prior string only after timing stops.
        samples.append(elapsed)
    args.out.write_text(json.dumps({'framework_id':'jinja2','allocation_policy':'compiled native Jinja2 template; fresh owned HTML string','iterations':args.iterations,'warmup':args.warmup,'output_bytes':len(html.encode()),'samples_us':samples}))

