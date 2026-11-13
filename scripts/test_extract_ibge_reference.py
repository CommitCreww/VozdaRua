import importlib.util, pathlib, unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('ibge_reference', ROOT/'scripts/extract-ibge-reference.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ReferenceExtraction(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = (ROOT/'.local/geo-dgeo01/SP_Municipios_2025.original.zip').read_bytes()

    def test_selects_unique_municipality_and_preserves_single_ring(self):
        geometry, properties, index = module.extract(self.original)
        self.assertEqual((properties['CD_MUN'], properties['NM_MUN'], properties['SIGLA_UF'], index), ('3550308','São Paulo','SP',59))
        self.assertEqual(geometry['type'],'Polygon')
        self.assertEqual(len(geometry['coordinates'][0]),21308)
        self.assertEqual(geometry['coordinates'][0][0],geometry['coordinates'][0][-1])

    def test_rejects_changed_original_before_parsing(self):
        with self.assertRaisesRegex(ValueError,'integrity mismatch'):
            module.extract(self.original[:-1])

    def test_rejects_crs_change_without_inference(self):
        with patch.object(module,'PRJ_SHA','0'*64):
            with self.assertRaisesRegex(ValueError,'CRS/encoding mismatch'):
                module.extract(self.original)

    def test_repeated_extraction_is_identical(self):
        self.assertEqual(module.extract(self.original),module.extract(self.original))

if __name__ == '__main__':
    unittest.main()
