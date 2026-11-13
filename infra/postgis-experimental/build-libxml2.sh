#!/bin/sh
set -eu
export DEBIAN_FRONTEND=noninteractive
source_version='2.12.7+dfsg+really2.9.14-2.1+deb13u3'
printf '%s  %s\n' '6f3e6bd911a1b0d58ebad1ff752e2302f9e8b92ec32c7461774aa998c1a2b3c0' /fix.patch | sha256sum -c -
mkdir -p /out
apt-get update
apt-cache policy libxml2 > /out/apt-policy.txt
apt-get install -y --no-install-recommends patch dpkg-dev
apt-get build-dep -y libxml2
cd /tmp
apt-get source "libxml2=$source_version"
cd libxml2-*
patch --fuzz=0 -p1 < /fix.patch
cp valid.c /out/valid-patched.c
cp debian/changelog /tmp/changelog.previous
{
    printf 'libxml2 (%s+vozrua1) trixie; urgency=medium\n\n' "$source_version"
    printf '  * Backport upstream d1686f91dbda141a752200419d35639fd6b38340 (CVE-2026-86140).\n\n'
    printf ' -- Voz da Rua Build <build@example.invalid>  Thu, 12 Nov 2026 12:00:00 +0000\n\n'
    cat /tmp/changelog.previous
} > debian/changelog
# Keep upstream/debian tests enabled. Failure blocks the package build.
unset DEB_BUILD_OPTIONS DEB_BUILD_PROFILES
if ! dpkg-buildpackage -b -us -uc -j2 > /out/build.log 2>&1; then
    tail -n 80 /out/build.log
    exit 1
fi
cp ../*.deb ../*.dsc ../*.buildinfo ../*.changes /out/
cd /out
sha256sum ./*.deb ./*.dsc ./valid-patched.c > SHA256SUMS
tail -n 30 build.log
