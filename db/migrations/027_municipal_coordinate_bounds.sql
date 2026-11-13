-- P11: topology and SRID alone do not validate the geographic coordinate range.
-- Reject incompatible versions; never clamp, normalize or repair existing geometry.
ALTER TABLE areas_municipais ADD CONSTRAINT ck_area_geographic_bounds CHECK (
    ST_XMin(Box3D(geometria)) >= -180 AND ST_XMax(Box3D(geometria)) <= 180
    AND ST_YMin(Box3D(geometria)) >= -90 AND ST_YMax(Box3D(geometria)) <= 90
);
