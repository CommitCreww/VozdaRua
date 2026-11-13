# syntax=docker/dockerfile:1.7
# Experimental only. This local base digest has unresolved security findings.
ARG BASE_IMAGE=voz-da-rua-p01-postgis:experiment-flat@sha256:b428b8d42cdc28321f0dce4a9fbccd4f306f8da07aa4e5dd26b188a1d47123f1
FROM ${BASE_IMAGE} AS builder
COPY libxml2-src.sources /etc/apt/sources.list.d/libxml2-src.sources
COPY libxml2-fix-CVE-2026-86140.patch /fix.patch
COPY build-libxml2.sh /build-libxml2.sh
RUN sh /build-libxml2.sh

FROM builder AS verified
RUN set -eu; cd /tmp/libxml2-*/builddir/main; \
    mkdir -p test result; \
    cp -a ../../test/. test/; cp -a ../../result/. result/; \
    test -f test/threads/abc.xml; \
    if ! make check > /out/upstream-tests.log 2>&1; then \
      tail -n 80 /out/upstream-tests.log; exit 1; \
    fi; tail -n 30 /out/upstream-tests.log

FROM scratch AS artifacts
COPY --from=verified /out/ /

FROM ${BASE_IMAGE} AS patched
RUN --mount=type=bind,from=verified,source=/out,target=/packages,readonly \
    dpkg -i /packages/libxml2_*_amd64.deb && \
    dpkg-query -W libxml2 postgresql-17 postgresql-17-postgis-3 && \
    test "$(dpkg-query -W -f='${Version}' postgresql-17-postgis-3)" = '3.6.4+dfsg-2.pgdg13+1'

FROM scratch AS runtime
COPY --from=patched / /
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/lib/postgresql/17/bin \
    GOSU_VERSION=1.19 LANG=en_US.utf8 PG_MAJOR=17 \
    PG_VERSION=17.12-1.pgdg13+1 PGDATA=/var/lib/postgresql/data
VOLUME /var/lib/postgresql/data
STOPSIGNAL SIGINT
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]
