# Migration to add naviera fields to Ticket model for revalidation operations

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0003_populate_naviera_data'),
        ('operaciones', '0005_make_ticket_concepto_optional'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='naviera',
            field=models.ForeignKey(
                blank=True,
                help_text='Naviera para operaciones de revalidación',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tickets',
                to='catalogos.naviera',
                verbose_name='Naviera'
            ),
        ),
        migrations.AddField(
            model_name='ticket',
            name='naviera_cuenta',
            field=models.ForeignKey(
                blank=True,
                help_text='Cuenta bancaria de la naviera para este concepto',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tickets',
                to='catalogos.navieracuenta',
                verbose_name='Cuenta de naviera'
            ),
        ),
    ]
