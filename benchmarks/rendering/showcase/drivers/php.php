<?php
declare(strict_types=1);
$options = getopt('', ['input:', 'dump:', 'probe:', 'out:', 'iterations:', 'warmup:', 'dump-only']);
$input = $options['input'];
$fixture = json_decode(file_get_contents($input . '.json'), false, 512, JSON_THROW_ON_ERROR);
$records = $fixture->records;
$controls = $fixture->definition->controls;
$probe = '</span><img id="escaped-probe" src=x> & < > " \' ✓';
switch ($options['probe'] ?? 'baseline') {
case 'title': $records[0]->texts[$controls->titleIndex] = $probe; break;
case 'text': $field = $controls->text; $records[$field->record]->texts[$field->slot] = $probe; break;
case 'request': $records[0]->texts[$controls->requestIndex] = $probe; break;
case 'baseline': break;
default: throw new InvalidArgumentException('Unknown input probe');
}
for ($i = count($records) - 1; $i >= 0; --$i) {
    $records[$i]->groups = array_map(fn($group) => array_map(fn($child) => $records[$child], $group), $records[$i]->groups);
}
$data = $records[0];
$styles = $fixture->styles;
$request = $data->texts[$controls->requestIndex];
$render = static function () use ($input, $data, $styles, $request): string {
    ob_start();
    include $input;
    return ob_get_clean();
};
$html = $render();
if (isset($options['dump'])) file_put_contents($options['dump'], $html);
if (isset($options['out']) && !isset($options['dump-only'])) {
    $iterations = (int)($options['iterations'] ?? 100);
    $warmup = (int)($options['warmup'] ?? 10);
    if ($iterations < 1 || $warmup < 0) throw new InvalidArgumentException('Invalid sample counts');
    for ($i=0; $i<$warmup; ++$i) $html = $render();
    $samples = [];
    for ($i=0; $i<$iterations; ++$i) {
        $started = hrtime(true);
        $output = $render();
        $elapsed = (hrtime(true) - $started) / 1000;
        $html = $output;
        $samples[] = $elapsed;
    }
    file_put_contents($options['out'], json_encode(['framework_id'=>'php','allocation_policy'=>'native PHP template with opcache; fresh owned HTML string','iterations'=>$iterations,'warmup'=>$warmup,'output_bytes'=>strlen($html),'samples_us'=>$samples], JSON_THROW_ON_ERROR));
}

