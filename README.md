Ext.ux.Localizer
================

The concept is simple: to localize a component you just call Localizer.localize(component, locale).

The class looks for localized strings in "locales" property and if is not loaded tries
to load it synchronously from ./app/locale/<code>.js.

Then for each component in the container looks for localizable properties
and for each one looks for the equivalent translated value.

