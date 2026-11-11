#!/usr/bin/env bash
set -euo pipefail
sudo sed -i s,http://archive.ubuntu.com,https://archive.ubuntu.com,g /etc/apt/sources.list.d/ubuntu.sources
sudo sed -i s,http://security.ubuntu.com,https://security.ubuntu.com,g /etc/apt/sources.list.d/ubuntu.sources
sudo apt-get update -o APT::Update::Error-Mode=any
sudo apt-get install -y python3-venv libyaml-dev libreadline-dev zlib1g-dev libffi-dev openjdk-17-jdk-headless php-cli php-xml php-mbstring
mkdir -p /work/tools/bin
fetch_checked() {
  curl -fL --retry 3 --connect-timeout 20 "$1" -o "$3"
  printf '%s  %s\n' "$2" "$3" | sha256sum --check --status
}
fetch_checked https://github.com/oven-sh/bun/releases/download/bun-v1.4.2/bun-linux-x64.zip 36368faef7527875d5ffa52e53cd48021741f2a83eb6208a8dd64068d422a913 /work/tools/bun.zip
unzip -q -o /work/tools/bun.zip -d /work/tools
ln -sf /work/tools/bun-linux-x64/bun /work/tools/bin/bun
fetch_checked https://go.dev/dl/go1.25.5.linux-amd64.tar.gz 9e9b755d63b36acf30c12a9a3fc379243714c1c6d3dd72861da637f336ebb35b /work/tools/go.tgz
tar -xzf /work/tools/go.tgz -C /work/tools
fetch_checked https://services.gradle.org/distributions/gradle-9.2.0-bin.zip df67a32e86e3276d011735facb1535f64d0d88df84fa87521e90becc2d735444 /work/tools/gradle.zip
unzip -q -o /work/tools/gradle.zip -d /work/tools
fetch_checked https://github.com/astral-sh/python-build-standalone/releases/download/20261026/cpython-3.13.18%2B20261026-x86_64-unknown-linux-gnu-install_only.tar.gz 126343c54daff4068efc1ac269518d0cc202d57857794948103dd1454e8881be /work/tools/python.tgz
tar -xzf /work/tools/python.tgz -C /work/tools
fetch_checked https://github.com/ruby/ruby-builder/releases/download/ruby-4.0.6/ruby-4.0.6-ubuntu-24.04-x64.tar.gz a65a82adf40df54d9bfcab4c61055f01bccff14a52c5b7c0c2cfecc1e9895fae /work/tools/ruby.tgz
sudo mkdir -p /opt/hostedtoolcache/Ruby/4.0.6/x64
sudo tar -xzf /work/tools/ruby.tgz --strip-components=1 -C /opt/hostedtoolcache/Ruby/4.0.6/x64
cat > /work/env.sh <<'ENV'
export PATH="/work/tools/bin:/work/tools/go/bin:/work/tools/python/bin:/work/tools/gradle-9.2.0/bin:/opt/hostedtoolcache/Ruby/4.0.6/x64/bin:/home/runner/.cargo/bin:$PATH"
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export CANONICAL_SUITE_RUBY=/opt/hostedtoolcache/Ruby/4.0.6/x64/bin/ruby
export EXACT_FEEDBACK=0
export ASTRO_TELEMETRY_DISABLED=1
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
ENV
source /work/env.sh
rustup toolchain install 1.97.0 --profile minimal
ruby --version
bun --version
go version
python3 --version
gem install bundler -v 4.0.16 --no-document
printf 'Pinned cloud toolchains ready\n'
