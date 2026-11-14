fn main() {
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
