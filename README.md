Ext.ux.Localizer
================

First include Ext.ux.Localizer.js

To localize a component just call Localizer.localize(component, locale):
Localizer.localize(component, "nl");

The class looks for localized strings in "locales" property and if is not loaded tries
to load it synchronously from ./app/locale/<code>.js. Then for each component in the container looks for localizable properties
and for each one looks for the equivalent translated value.

It allows language change after language change after language change etc.
An excellent fit with a cycle button where you can switch language.

This git repo includes a Sencha Architect file that demos the Localizer.

boxLabel
--------
For ExtJS < 4.2, if you want to localize boxLabels, you need to add setBoxLabel to be able to localize boxLabels at runtime (already rendered)

    Ext.override(Ext.form.field.Checkbox, {
        setBoxLabel: function(boxLabel){
            var me = this;
        
            me.boxLabel = boxLabel;
            if (me.rendered) {
                me.boxLabelEl.update(boxLabel);
            }
        }
    });
