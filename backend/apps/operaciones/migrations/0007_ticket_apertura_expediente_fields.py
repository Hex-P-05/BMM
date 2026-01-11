# Migration to add apertura de expediente fields to Ticket model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0003_populate_naviera_data'),
        ('operaciones', '0006_ticket_naviera_fields'),
    ]

    operations = [
        # Agregar campo agente_aduanal
        migrations.AddField(
            model_name='ticket',
            name='agente_aduanal',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tickets',
                to='catalogos.agenteaduanal',
                verbose_name='Agente aduanal'
            ),
        ),
        # Agregar campo sensibilidad_contenido
        migrations.AddField(
            model_name='ticket',
            name='sensibilidad_contenido',
            field=models.CharField(
                choices=[
                    ('rojo', 'Contenido sensible'),
                    ('amarillo', 'Contenido tolerable'),
                    ('verde', 'Contenido común')
                ],
                default='verde',
                help_text='Rojo=Sensible, Amarillo=Tolerable, Verde=Común',
                max_length=10,
                verbose_name='Sensibilidad del contenido'
            ),
        ),
        # Agregar campo pedimento_prefijo
        migrations.AddField(
            model_name='ticket',
            name='pedimento_prefijo',
            field=models.CharField(
                blank=True,
                help_text='Primeros 4 caracteres del pedimento',
                max_length=4,
                verbose_name='Pedimento prefijo'
            ),
        ),
        # Agregar campo pedimento_consecutivo
        migrations.AddField(
            model_name='ticket',
            name='pedimento_consecutivo',
            field=models.CharField(
                blank=True,
                help_text='Últimos 7 caracteres del pedimento',
                max_length=7,
                verbose_name='Pedimento consecutivo'
            ),
        ),
    ]
