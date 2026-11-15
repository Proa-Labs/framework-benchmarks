// Native html/template admission. Parse, typed CSS preparation and input
// hydration occur once, before any rendering measurement.
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"html/template"
	"os"
	"runtime"
	"strconv"
	"time"
)

type Raw struct {
	Texts    []string
	Groups   [][]int
	Variants []int
}
type Data struct {
	Texts    []any
	Groups   [][]*Data
	Variants []int
}
type Controls struct {
	TitleIndex, RequestIndex int
	Text                     struct{ Record, Slot int }
}
type Fixture struct {
	Definition struct{ Controls Controls }
	Records    []Raw
	Styles     []string
	Types      []map[string]string
}

func main() {
	input := flag.String("input", "", "native generated template")
	dump := flag.String("dump", "", "output HTML")
	out := flag.String("out", "", "raw sample output")
	iterations := flag.Int("iterations", 100, "sample count")
	warmup := flag.Int("warmup", 10, "warmup count")
	dumpOnly := flag.Bool("dump-only", false, "only admit output")
	probe := flag.String("probe", "baseline", "changed input admission")
	flag.Parse()
	encoded, err := os.ReadFile(*input + ".json")
	check(err)
	var fixture Fixture
	check(json.Unmarshal(encoded, &fixture))
	controls := fixture.Definition.Controls
	changed := "</span><img id=\"escaped-probe\" src=x> & < > \" ' ✓"
	switch *probe {
	case "title":
		fixture.Records[0].Texts[controls.TitleIndex] = changed
	case "text":
		fixture.Records[controls.Text.Record].Texts[controls.Text.Slot] = changed
	case "request":
		fixture.Records[0].Texts[controls.RequestIndex] = changed
	case "baseline":
	default:
		panic("Unknown input probe")
	}
	pool := make([]*Data, len(fixture.Records))
	for i := len(pool) - 1; i >= 0; i-- {
		raw := fixture.Records[i]
		data := &Data{Texts: make([]any, len(raw.Texts)), Groups: make([][]*Data, len(raw.Groups)), Variants: raw.Variants}
		for slot, text := range raw.Texts {
			data.Texts[slot] = text
		}
		// html/template requires its CSS type for complete declarations; generic
		// strings are rejected in this context. Only the pinned fixture's authored
		// CSS slots receive this type. Request and text probes remain ordinary data.
		for key, kind := range fixture.Types[i] {
			slot, err := strconv.Atoi(key)
			check(err)
			if kind == "css" {
				data.Texts[slot] = template.CSS(raw.Texts[slot])
			}
		}
		for group, ids := range raw.Groups {
			for _, id := range ids {
				data.Groups[group] = append(data.Groups[group], pool[id])
			}
		}
		pool[i] = data
	}
	styles := make([]template.HTML, len(fixture.Styles))
	for i, css := range fixture.Styles {
		styles[i] = template.HTML(css)
	}
	source, err := os.ReadFile(*input)
	check(err)
	compiled, err := template.New("showcase").Parse(string(source))
	check(err)
	args := struct {
		Data    *Data
		Request any
		Styles  []template.HTML
	}{pool[0], pool[0].Texts[controls.RequestIndex], styles}
	render := func() *bytes.Buffer { var output bytes.Buffer; check(compiled.Execute(&output, args)); return &output }
	previous := render()
	if *dump != "" {
		check(os.WriteFile(*dump, previous.Bytes(), 0644))
	}
	if *out != "" && !*dumpOnly {
		if *iterations < 1 || *warmup < 0 {
			panic("Invalid sample counts")
		}
		for i := 0; i < *warmup; i++ {
			previous = render()
			runtime.KeepAlive(previous)
		}
		samples := make([]float64, *iterations)
		for i := range samples {
			started := time.Now()
			output := render()
			elapsed := float64(time.Since(started).Nanoseconds()) / 1000
			previous = output
			runtime.KeepAlive(output)
			samples[i] = elapsed
		}
		encoded, err := json.Marshal(map[string]any{"framework_id": "go-html-template", "allocation_policy": "compiled native html/template; fresh owned bytes.Buffer", "iterations": *iterations, "warmup": *warmup, "output_bytes": previous.Len(), "samples_us": samples})
		check(err)
		check(os.WriteFile(*out, encoded, 0644))
	}
}
func check(err error) {
	if err != nil {
		panic(err)
	}
}
