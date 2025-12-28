from django.core.management.base import BaseCommand
from apps.usuarios.models import Usuario
from apps.catalogos.models import Empresa, Concepto, Proveedor, Naviera, Puerto, Terminal


class Command(BaseCommand):
    help = 'Crea datos iniciales basados en los ejemplos reales del cliente'

    def handle(self, *args, **options):
        self.stdout.write('Creando datos iniciales...\n')
        
        # =====================
        # PUERTOS (crear primero para asignar a usuarios)
        # =====================
        puertos_data = [
            {'nombre': 'MANZANILLO', 'codigo': 'MZO'},
            {'nombre': 'LAZARO CARDENAS', 'codigo': 'LZC'},
            {'nombre': 'VERACRUZ', 'codigo': 'VER'},
            {'nombre': 'ALTAMIRA', 'codigo': 'ATM'},
        ]

        puertos_creados = {}
        for data in puertos_data:
            puerto, created = Puerto.objects.get_or_create(
                nombre=data['nombre'],
                defaults={'codigo': data['codigo']}
            )
            puertos_creados[data['codigo']] = puerto
            if created:
                self.stdout.write(f'  ✓ Puerto creado: {data["nombre"]}')

        # =====================
        # USUARIOS DE PRUEBA
        # Roles válidos: admin, revalidaciones, logistica, pagos, clasificacion
        # =====================
        usuarios_data = [
            # Admin (sin puerto - ve todo)
            {'email': 'admin@aduanasoft.com', 'nombre': 'Administrador', 'rol': 'admin', 'password': 'admin123', 'puerto': None},

            # Revalidaciones (trabaja con navieras, usa BL)
            {'email': 'joan@aduanasoft.com', 'nombre': 'JOAN', 'rol': 'revalidaciones', 'password': 'ops123', 'puerto': 'MZO'},
            {'email': 'marisol@aduanasoft.com', 'nombre': 'MARISOL', 'rol': 'revalidaciones', 'password': 'ops123', 'puerto': 'LZC'},

            # Logística (trabaja con terminales, usa # contenedor)
            {'email': 'vanessa@aduanasoft.com', 'nombre': 'VANESSA', 'rol': 'logistica', 'password': 'ops123', 'puerto': 'MZO'},
            {'email': 'mareyci@aduanasoft.com', 'nombre': 'MAREYCI', 'rol': 'logistica', 'password': 'ops123', 'puerto': 'LZC'},

            # Pagos (sin puerto - ve todo)
            {'email': 'pagos@aduanasoft.com', 'nombre': 'Tesorería', 'rol': 'pagos', 'password': 'pagos123', 'puerto': None},

            # Clasificación (da de alta contenedores)
            {'email': 'clasif@aduanasoft.com', 'nombre': 'CLASIFICACION', 'rol': 'clasificacion', 'password': 'clasif123', 'puerto': 'MZO'},
        ]

        for data in usuarios_data:
            puerto = puertos_creados.get(data.get('puerto')) if data.get('puerto') else None
            user, created = Usuario.objects.get_or_create(
                email=data['email'],
                defaults={
                    'nombre': data['nombre'],
                    'rol': data['rol'],
                    'puerto_asignado': puerto,
                    'is_staff': data['rol'] == 'admin',
                    'is_superuser': data['rol'] == 'admin',
                }
            )
            if created:
                user.set_password(data['password'])
                user.save()
                puerto_info = f" (Puerto: {data['puerto']})" if data['puerto'] else " (Global)"
                self.stdout.write(f'  ✓ Usuario creado: {data["email"]} [{data["rol"]}]{puerto_info}')
            else:
                self.stdout.write(f'  - Usuario ya existe: {data["email"]}')
        
        # =====================
        # EMPRESAS (del Excel)
        # =====================
        empresas = ['B&MM', 'MICRA', 'HARUT']
        for nombre in empresas:
            obj, created = Empresa.objects.get_or_create(nombre=nombre)
            if created:
                self.stdout.write(f'  ✓ Empresa creada: {nombre}')
        
        # =====================
        # CONCEPTOS (del Excel)
        # =====================
        conceptos = [
            'PAMA', 'ALMACENAJES', 'UVA', 'FLETE', 'CIERRE DE CUENTA',
            'HONORARIOS AA', 'ANTICIPO', 'IMPUESTOS', 'NO PREVIO',
            'MANIOBRA DE DESCARGA', 'HONORARIOS COMER', 'LIBERACION DE ABANDONO',
            'DEMORAS', 'GASTOS PORTUARIOS', 'COSTOS OPERATIVOS', 'APOYO', 'TRANSPORTE'
        ]
        for nombre in conceptos:
            obj, created = Concepto.objects.get_or_create(nombre=nombre)
            if created:
                self.stdout.write(f'  ✓ Concepto creado: {nombre}')
        
        # =====================
        # PROVEEDORES (del Excel)
        # =====================
        proveedores_data = [
            {
                'nombre': 'CAREVO LOGISTICA',
                'banco': 'BANBAJIO',
                'cuenta': '4390 4317 0201',
                'clabe': '0300 9590 0040 086774'
            },
            {
                'nombre': 'RR UNIDAD DE VERIFICACION',
                'banco': 'BBVA',
                'cuenta': '011066094 9',
                'clabe': '12180001106609400'
            },
            {
                'nombre': 'NOFIMEX UNIDAD VERIFICADORA',
                'banco': 'BANAMEX',
                'cuenta': '6822208',
                'clabe': '2180052368222080'
            },
            {
                'nombre': 'GLOBAL TRADE SOLUTIONS',
                'banco': 'BANORTE',
                'cuenta': '268350741',
                'clabe': '72180002683507392'
            },
            {
                'nombre': 'GTS CORPORATIVO ADUANERO SC',
                'banco': 'BBVA',
                'cuenta': '199724249',
                'clabe': '12180001997242400'
            },
            {
                'nombre': 'TRALICOM LOGISTICS',
                'banco': 'BBVA',
                'cuenta': '11311510 0',
                'clabe': '0120 9500 1131 151008'
            },
            {
                'nombre': 'ROOF SERVICIOS ADMINISTRATIVOS S A DE C V',
                'banco': 'BANORTE',
                'cuenta': '1283169112',
                'clabe': '072 180 01283169112 6'
            },
            {
                'nombre': 'FERROCARRIL Y TERMINAL DEL VALLE DE MÉXICO',
                'banco': 'BBVA',
                'cuenta': '010191712 9',
                'clabe': '0121 8000 1019 171293'
            },
            {
                'nombre': 'ASESORES EN COMERCIO INTERNACIONAL DIRO SA DE CV',
                'banco': 'BBVA',
                'cuenta': '0121 946285',
                'clabe': '0121 8000 1219 4628 54'
            },
            {
                'nombre': 'JIV PIECE MARKETER SA DE CV',
                'banco': 'BANORTE',
                'cuenta': '1317682767',
                'clabe': '72580013176827600'
            },
        ]
        
        for data in proveedores_data:
            obj, created = Proveedor.objects.get_or_create(
                nombre=data['nombre'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  ✓ Proveedor creado: {data["nombre"][:30]}...')
        
        # =====================
        # NAVIERAS (de la imagen de cotización)
        # =====================
        navieras = [
            ('MAERSK', 'MAEU'),
            ('HAPAG-LLOYD', 'HLCU'),
            ('COSCO SHIPPING', 'COSU'),
            ('MSC', 'MSCU'),
            ('ONE', 'ONEY'),
            ('EVERGREEN', 'EGLV'),
            ('CMA CGM', 'CMDU'),
        ]
        for nombre, codigo in navieras:
            obj, created = Naviera.objects.get_or_create(
                nombre=nombre,
                defaults={'codigo': codigo}
            )
            if created:
                self.stdout.write(f'  ✓ Naviera creada: {nombre}')
        
        # =====================
        # TERMINALES
        # =====================
        # Terminales de Manzanillo
        manzanillo = Puerto.objects.get(nombre='MANZANILLO')
        terminales_mzo = ['SSA MEXICO', 'CONTECON', 'TIMSA', 'OCUPA']
        for nombre in terminales_mzo:
            obj, created = Terminal.objects.get_or_create(
                nombre=nombre,
                defaults={'puerto': manzanillo}
            )
            if created:
                self.stdout.write(f'  ✓ Terminal creada: {nombre}')
        
        self.stdout.write(self.style.SUCCESS('\n¡Datos iniciales creados exitosamente!'))
        self.stdout.write('\nUsuarios de prueba:')
        self.stdout.write('  Admin:           admin@aduanasoft.com / admin123  (Global)')
        self.stdout.write('  Revalidaciones:  joan@aduanasoft.com / ops123     (MZO)')
        self.stdout.write('  Revalidaciones:  marisol@aduanasoft.com / ops123  (LZC)')
        self.stdout.write('  Logística:       vanessa@aduanasoft.com / ops123  (MZO)')
        self.stdout.write('  Logística:       mareyci@aduanasoft.com / ops123  (LZC)')
        self.stdout.write('  Pagos:           pagos@aduanasoft.com / pagos123  (Global)')
        self.stdout.write('  Clasificación:   clasif@aduanasoft.com / clasif123 (MZO)')
