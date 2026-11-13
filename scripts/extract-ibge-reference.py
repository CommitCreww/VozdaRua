"""D-GEO-01 offline reference only. Python stdlib; no GIS package or geometry repair.
Pinned IBGE 2025 ZIP, one selected Polygon record / one ring. Other layouts fail closed.
"""
import hashlib, json, math, pathlib, struct, sys, zipfile, io

ZIP_SHA = '3ea8041f69e10e68045ff1275616f01673d94019d8105a00212354b80a067c3c'
PRJ_SHA = 'b7fe68a2eb827ea974a1a995a73676e095a366b383a10a66c7498300d1c58153'

def extract(original):
    if hashlib.sha256(original).hexdigest() != ZIP_SHA:
        raise ValueError('IBGE original integrity mismatch')
    with zipfile.ZipFile(io.BytesIO(original)) as archive:
        if archive.testzip() is not None:
            raise ValueError('IBGE CRC mismatch')
        base = 'SP_Municipios_2025'
        prj = archive.read(base + '.prj')
        if hashlib.sha256(prj).hexdigest() != PRJ_SHA or archive.read(base + '.cpg').strip() != b'UTF-8':
            raise ValueError('IBGE CRS/encoding mismatch')
        # PRJ is geographic GCS_SIRGAS_2000 / GRS_1980, degrees, Greenwich: EPSG 4674.
        dbf, shx, shp = (archive.read(base + suffix) for suffix in ['.dbf', '.shx', '.shp'])
    count, header, length = struct.unpack_from('<IHH', dbf, 4)
    if header + count * length > len(dbf) or dbf[header - 1] != 13:
        raise ValueError('Invalid DBF bounds')
    fields, offset = [], 1
    for pos in range(32, header - 1, 32):
        field = dbf[pos:pos + 32]
        fields.append((field[:11].split(b'\0')[0].decode('ascii'), offset, field[16]))
        offset += field[16]
    if offset != length:
        raise ValueError('Invalid DBF record layout')
    selected = []
    for index in range(count):
        record = dbf[header + index * length:header + (index + 1) * length]
        if record[:1] != b' ':
            continue
        values = {name: record[start:start+size].decode('utf8').strip() for name, start, size in fields}
        if values.get('CD_MUN') == '3550308':
            if values.get('NM_MUN') != 'São Paulo' or values.get('SIGLA_UF') != 'SP':
                raise ValueError('Municipality identity mismatch')
            selected.append((index, values))
    if len(selected) != 1:
        raise ValueError('Municipality not unique')
    index, properties = selected[0]
    for binary in [shx, shp]:
        if struct.unpack_from('>i', binary)[0] != 9994 or struct.unpack_from('>i', binary, 24)[0]*2 != len(binary):
            raise ValueError('Invalid shape header')
    start, words = struct.unpack_from('>II', shx, 100 + index*8)
    body = shp[start*2+8:start*2+8+words*2]
    if struct.unpack_from('<i', body)[0] != 5:
        raise ValueError('Only Polygon supported')
    parts, points = struct.unpack_from('<ii', body, 36)
    if parts != 1 or points < 4 or struct.unpack_from('<i', body, 44)[0] != 0 or len(body) != 48 + points*16:
        raise ValueError('Only single-ring reference supported; no inferred repair')
    coordinates = [list(struct.unpack_from('<dd', body, 48+i*16)) for i in range(points)]
    if coordinates[0] != coordinates[-1] or any(not math.isfinite(x) or not -180 <= x <= 180 or not math.isfinite(y) or not -90 <= y <= 90 for x,y in coordinates):
        raise ValueError('Invalid ring')
    geometry = {'type': 'Polygon', 'coordinates': [coordinates]}
    return geometry, properties, index

def main():
    source, destination = map(pathlib.Path, sys.argv[1:3])
    geometry, properties, index = extract(source.read_bytes())
    encoded = json.dumps(geometry, ensure_ascii=False, separators=(',', ':')).encode('utf8')
    manifest = {'source': 'IBGE Malha Municipal 2025', 'sourceSrid': 4674, 'originalSha256': ZIP_SHA,
                'prjSha256': PRJ_SHA, 'geometrySha256': hashlib.sha256(encoded).hexdigest(), 'recordIndex': index,
                'properties': properties, 'points': len(geometry['coordinates'][0]), 'role': 'independent-reference-only'}
    for target, content in [(destination, encoded), (destination.with_suffix('.manifest.json'), json.dumps(manifest, ensure_ascii=False, indent=2).encode('utf8'))]:
        if target.exists():
            if target.read_bytes() != content:
                raise ValueError('Existing extraction differs; no overwrite')
        else:
            with target.open('xb') as output:
                output.write(content)
    print(json.dumps(manifest, ensure_ascii=True))

if __name__ == '__main__':
    main()
