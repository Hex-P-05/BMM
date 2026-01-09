# Migration to add comprobante_pago field to Ticket model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operaciones', '0006_ticket_naviera_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='comprobante_pago',
            field=models.FileField(
                blank=True,
                help_text='Archivo PDF o imagen del comprobante de pago',
                null=True,
                upload_to='comprobantes/tickets/%Y/%m/',
                verbose_name='Comprobante de pago'
            ),
        ),
    ]
