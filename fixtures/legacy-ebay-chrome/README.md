# Retained eBay chrome fixture

This synthetic page was removed from upstream Proa before PR #83. To keep the existing benchmark cell reproducible, this directory retains `proa_showcase/src/ebay/srp_chrome.rs` and its two static assets from Proa revision `7ffb8a19ecfa601fb496d825e0677dce29ea3af4` (Apache-2.0).

The document, dataset-derived chrome and markup remain unchanged. The module imports the current public listing types, retains the original private integer helpers, and uses the new UTF-8 string-write API. The Criterion, linked showcase and output-buffer fixtures share this source. The real captured eBay chrome continues to come from the new locked upstream dependency.
