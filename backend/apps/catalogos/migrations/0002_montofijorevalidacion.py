# Generated migration for MontoFijoRevalidacion model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MontoFijoRevalidacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('concepto_nombre', models.CharField(help_text='Nombre exacto del concepto (ej: GARANTÍA, CAMBIO A.A)', max_length=100, verbose_name='Nombre del concepto')),
                ('monto', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='Monto fijo')),
                ('moneda', models.CharField(choices=[('MXN', 'Pesos'), ('USD', 'Dólares')], default='USD', max_length=3, verbose_name='Moneda')),
                ('activo', models.BooleanField(default=True, verbose_name='Activo')),
                ('naviera', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='montos_fijos', to='catalogos.naviera', verbose_name='Naviera')),
            ],
            options={
                'verbose_name': 'Monto fijo de revalidación',
                'verbose_name_plural': 'Montos fijos de revalidación',
                'db_table': 'cat_montos_fijos_revalidacion',
                'ordering': ['naviera', 'concepto_nombre'],
                'unique_together': {('naviera', 'concepto_nombre')},
            },
        ),
    ]
