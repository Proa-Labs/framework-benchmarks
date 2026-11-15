# frozen_string_literal: true
# Native ActionView entry, using the same locked Rails installation as the core suite.
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../../external/rails/Gemfile', __dir__)
require 'bundler/setup'
require 'action_view'
require 'rails'
require 'json'
require 'optparse'
options = {probe: 'baseline'}
OptionParser.new do |p|
  p.on('--input PATH') { |v| options[:input] = File.expand_path(v) }
  p.on('--dump PATH') { |v| options[:dump] = v }
  p.on('--out PATH') { |v| options[:out] = v }
  p.on('--iterations N', Integer) { |v| options[:iterations] = v }
  p.on('--warmup N', Integer) { |v| options[:warmup] = v }
  p.on('--dump-only') { options[:dump_only] = true }
  p.on('--probe NAME') { |v| options[:probe] = v }
end.parse!
fixture = JSON.parse(File.read(options.fetch(:input) + '.json'))
records, controls = fixture.fetch('records'), fixture.fetch('definition').fetch('controls')
probe = %q{</span><img id="escaped-probe" src=x> & < > " ' ✓}
case options[:probe]
when 'title' then records[0]['texts'][controls['titleIndex']] = probe
when 'text'
  field = controls.fetch('text')
  records[field['record']]['texts'][field['slot']] = probe
when 'request' then records[0]['texts'][controls['requestIndex']] = probe
when 'baseline'
else abort 'Unknown input probe'
end
node = Struct.new(:texts, :groups, :variants)
pool = Array.new(records.length)
(records.length - 1).downto(0) do |i|
  r = records[i]
  pool[i] = node.new(r.fetch('texts'), r.fetch('groups').map { |g| g.map { |index| pool.fetch(index) } }, r.fetch('variants'))
end
view_class = ActionView::Base.with_empty_template_cache
view_class.class_eval { attr_reader :data, :styles, :request }
lookup = ActionView::LookupContext.new([])
assigns = {data: pool[0], styles: fixture.fetch('styles').map(&:html_safe), request: pool[0].texts[controls['requestIndex']]}
# Only immutable CSS authored in the pinned source is marked trusted; dynamic
# record strings are escaped by ActionView / ERB::Util.html_escape.
template = ActionView::Template.new(File.read(options[:input]), 'showcase', ActionView::Template.handler_for_extension(:erb), locals: [])
render = -> { template.render(view_class.new(lookup, assigns, nil), {}) }
html = render.call # Lazy template compilation completes before measurement.
File.write(options[:dump], html) if options[:dump]
if options[:out] && !options[:dump_only]
  iterations, warmup = options.fetch(:iterations, 100), options.fetch(:warmup, 10)
  raise 'Invalid sample counts' unless iterations.positive? && warmup >= 0
  warmup.times { html = render.call }
  samples = Array.new(iterations) do
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC, :nanosecond)
    output = render.call
    elapsed = (Process.clock_gettime(Process::CLOCK_MONOTONIC, :nanosecond) - started) / 1000.0
    html = output
    elapsed
  end
  File.write(options[:out], JSON.generate(framework_id: 'rails', allocation_policy: 'compiled native ActionView template and fresh view; fresh owned HTML string', iterations: iterations, warmup: warmup, output_bytes: html.bytesize, samples_us: samples))
end

