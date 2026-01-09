# Data migration: Populate NavieraCuenta and MontoFijoRevalidacion
# Based on CSV files provided by client

from django.db import migrations
from decimal import Decimal


def populate_naviera_data(apps, schema_editor):
    """
    Populate navieras, cuentas bancarias y montos fijos basado en los CSVs del cliente.
    """
    Naviera = apps.get_model('catalogos', 'Naviera')
    NavieraCuenta = apps.get_model('catalogos', 'NavieraCuenta')
    MontoFijoRevalidacion = apps.get_model('catalogos', 'MontoFijoRevalidacion')

    # ==================== NAVIERAS ====================
    navieras_data = [
        {'nombre': 'MAERSK', 'codigo': 'MAERSK'},
        {'nombre': 'EVERGREEN', 'codigo': 'EGLV'},
        {'nombre': 'COSCO', 'codigo': 'COSCO'},
        {'nombre': 'CMA CGM', 'codigo': 'CMACGM'},
        {'nombre': 'ONE', 'codigo': 'ONE'},
    ]

    navieras = {}
    for nav_data in navieras_data:
        naviera, created = Naviera.objects.get_or_create(
            nombre=nav_data['nombre'],
            defaults={'codigo': nav_data['codigo'], 'activo': True}
        )
        navieras[nav_data['nombre']] = naviera

    # ==================== CUENTAS BANCARIAS ====================
    cuentas_data = [
        # MAERSK - Una cuenta para todo (Garantía, Limpieza, Demoras)
        {
            'naviera': 'MAERSK',
            'tipo_concepto': 'DEMORAS, GARANTÍA, LIMPIEZA',
            'beneficiario': 'MAERSK (GARANTIA, LIMPIEZA, DEMORAS)',
            'banco': 'BANCO DE AMERICA',
            'cuenta': '',
            'clabe': '106180000152520595',
            'aba_swift': '',
            'moneda': 'USD',
        },

        # EVERGREEN - Una cuenta para Revalidación y Demoras
        {
            'naviera': 'EVERGREEN',
            'tipo_concepto': 'CAMBIO A.A, DEMORAS, REVALIDACIÓN',
            'beneficiario': 'EVERGREEN (Revalidación / Demoras)',
            'banco': 'SANTANDER',
            'cuenta': '825 0087 7732',
            'clabe': '0141 8082 5008 777329',
            'aba_swift': '',
            'moneda': 'USD',
        },

        # COSCO - Tres cuentas diferentes por tipo de concepto
        {
            'naviera': 'COSCO',
            'tipo_concepto': 'DEMORAS, REV TARDÍA, T3 ALMACENAJE, CAMBIO A.A, RETRANSMISIÓN',
            'beneficiario': 'COSCO (DEMORAS / REV. TARDIA/ T3 / RETRA)',
            'banco': 'BANCO CITI MEXICO',
            'cuenta': '5638509',
            'clabe': '124180002356385095',
            'aba_swift': 'CITIMXMMXXX',
            'moneda': 'USD',
        },
        {
            'naviera': 'COSCO',
            'tipo_concepto': 'CARGOS LOCALES, LIMPIEZA',
            'beneficiario': 'COSCO (Limpieza / Revalidación)',
            'banco': 'JP MORGAN CHASE BANK SA',
            'cuenta': '8 8028 5643',
            'clabe': '',
            'aba_swift': 'CHASUS33 / 021000021',
            'moneda': 'USD',
        },
        {
            'naviera': 'COSCO',
            'tipo_concepto': 'GARANTÍA',
            'beneficiario': 'COSCO (Garantía USD)',
            'banco': 'BANCO CITI MEXICO',
            'cuenta': '5638525',
            'clabe': '124180002356385257',
            'aba_swift': 'CITIMXMMXXX',
            'moneda': 'USD',
        },

        # CMA CGM - Una cuenta
        {
            'naviera': 'CMA CGM',
            'tipo_concepto': 'DEMORAS, CARGOS LOCALES',
            'beneficiario': 'CMACGM MEXICO (Cargos Locales)',
            'banco': 'BNP PARIBAS NEW YORK BRANCH',
            'cuenta': '0020 0624 9410 0148',
            'clabe': '',
            'aba_swift': 'BNPAUS3N / 0260 0768 9',
            'moneda': 'USD',
        },

        # ONE - Dos cuentas (Pagos locales y Garantías)
        {
            'naviera': 'ONE',
            'tipo_concepto': 'DEMORAS',
            'beneficiario': '(ONE PAGOS LOCALES) OCEAN NETWORK EXPRESS PTE. LTD.',
            'banco': 'HSBC BANK USA, N.A.',
            'cuenta': '021001088',
            'clabe': '000274704',
            'aba_swift': 'MRMDUS33',
            'moneda': 'USD',
        },
        {
            'naviera': 'ONE',
            'tipo_concepto': 'GARANTÍA',
            'beneficiario': 'ONE OCEAN (GARANTIAS)',
            'banco': 'HSBC',
            'cuenta': '7003755584',
            'clabe': '021180070037555842',
            'aba_swift': 'BIMEMXMM',
            'moneda': 'USD',
        },
    ]

    for cuenta_data in cuentas_data:
        naviera = navieras.get(cuenta_data['naviera'])
        if naviera:
            NavieraCuenta.objects.get_or_create(
                naviera=naviera,
                tipo_concepto=cuenta_data['tipo_concepto'],
                moneda=cuenta_data['moneda'],
                defaults={
                    'beneficiario': cuenta_data['beneficiario'],
                    'banco': cuenta_data['banco'],
                    'cuenta': cuenta_data['cuenta'],
                    'clabe': cuenta_data['clabe'],
                    'aba_swift': cuenta_data['aba_swift'],
                    'activo': True,
                }
            )

    # ==================== MONTOS FIJOS ====================
    montos_fijos_data = [
        # MAERSK
        {'naviera': 'MAERSK', 'concepto_nombre': 'GARANTÍA', 'monto': Decimal('1000.00'), 'moneda': 'USD'},

        # EVERGREEN
        {'naviera': 'EVERGREEN', 'concepto_nombre': 'CAMBIO A.A', 'monto': Decimal('82.00'), 'moneda': 'USD'},

        # COSCO
        {'naviera': 'COSCO', 'concepto_nombre': 'GARANTÍA', 'monto': Decimal('1000.00'), 'moneda': 'USD'},
        {'naviera': 'COSCO', 'concepto_nombre': 'CAMBIO A.A', 'monto': Decimal('46.00'), 'moneda': 'USD'},
        {'naviera': 'COSCO', 'concepto_nombre': 'REV TARDÍA', 'monto': Decimal('96.28'), 'moneda': 'USD'},
        {'naviera': 'COSCO', 'concepto_nombre': 'CARGOS LOCALES', 'monto': Decimal('62.00'), 'moneda': 'USD'},

        # CMA CGM
        {'naviera': 'CMA CGM', 'concepto_nombre': 'GARANTÍA', 'monto': Decimal('1000.00'), 'moneda': 'USD'},

        # ONE
        {'naviera': 'ONE', 'concepto_nombre': 'GARANTÍA', 'monto': Decimal('1000.00'), 'moneda': 'USD'},
    ]

    for monto_data in montos_fijos_data:
        naviera = navieras.get(monto_data['naviera'])
        if naviera:
            MontoFijoRevalidacion.objects.get_or_create(
                naviera=naviera,
                concepto_nombre=monto_data['concepto_nombre'],
                defaults={
                    'monto': monto_data['monto'],
                    'moneda': monto_data['moneda'],
                    'activo': True,
                }
            )


def reverse_naviera_data(apps, schema_editor):
    """Reverse the data migration"""
    NavieraCuenta = apps.get_model('catalogos', 'NavieraCuenta')
    MontoFijoRevalidacion = apps.get_model('catalogos', 'MontoFijoRevalidacion')

    # Delete all records created by this migration
    MontoFijoRevalidacion.objects.all().delete()
    NavieraCuenta.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0002_montofijorevalidacion'),
    ]

    operations = [
        migrations.RunPython(populate_naviera_data, reverse_naviera_data),
    ]
