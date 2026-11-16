fn main() {
    let manifest = std::path::PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap());
    let root = manifest.join("../..");
    let bun = std::env::var_os("BUN_BINARY")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| root.join("node_modules/.bin/bun"));
    let out = std::env::var_os("OUT_DIR").unwrap();
    let status = std::process::Command::new(bun)
        .arg(manifest.join("showcase/generate-rust.mjs"))
        .arg("--out")
        .arg(out)
        .status()
        .expect("Install the pinned Bun workspace before building native fixtures");
    assert!(status.success(), "Native showcase generation failed");
    for path in [
        "showcase/fixtures",
        "showcase/generate-rust.mjs",
        "showcase/generate-views.mjs",
        "showcase/emit-template.mjs",
        "showcase/fixture.mjs",
        "showcase/prepare.mjs",
        "showcase/style.mjs",
    ] {
        println!("cargo:rerun-if-changed={path}");
    }
    println!("cargo:rerun-if-env-changed=BUN_BINARY");
    println!("cargo:rerun-if-changed=build.rs");
    for (source, target) in [
        ("PROFILE", "PROA_BENCH_PROFILE"),
        ("OPT_LEVEL", "PROA_BENCH_OPT_LEVEL"),
    ] {
        println!(
            "cargo:rustc-env={target}={}",
            std::env::var(source).unwrap()
        );
    }
}
