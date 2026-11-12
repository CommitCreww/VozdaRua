# P01 candidate: keep the approved Mailpit version, without Alpine/musl at runtime.
FROM axllent/mailpit@sha256:aef2aacc11f075ec0fb6874275ee4a421e688e11a96ebb296134d1735c7761ce AS upstream

FROM scratch
COPY --from=upstream /mailpit /mailpit
COPY --from=upstream /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=upstream /usr/share/zoneinfo /usr/share/zoneinfo
USER 1000:1000
EXPOSE 1025 8025
ENTRYPOINT ["/mailpit"]
