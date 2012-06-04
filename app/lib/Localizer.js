Ext.define("LS.lib.Localizer", {
	/***** WORK IN PROGRESS *****/

	singleton : true,
	
	currLocale : "es",
	
	/**
	 * @private (Ext.util.HashMap) locales
	 */
	 
	/**
	 * @private (Object) localizableProps
	 * Localizable properties for each xtype.
	 */
	localizableProps : {
		// Ext.button
		button : ["text", "tooltip"],
		// Ext.form.field
		checkboxfield : ["fieldLabel", "boxLabel"],
		field : ["fieldLabel"],
		filefield : ["fieldLabel", "buttonText"],
		radiofield : ["fieldLabel", "boxLabel"],
		// Ext.form
		checkboxgroup : ["fieldLabel"],
		fieldcontainer : ["fieldLabel"],
		fieldset : ["title"],
		label : ["text"],
		// Ext.grid
		gridcolumn : ["text"],
		panel : ["title"],
	},
	
	/**
	 * @private (Object) excludeTypes
	 * XTypes to be excluded by localize() method.
	 * If whole xtype must be exclude, assign a boolean value of "false".
	 * If some itemId must be excluded, assign an array of itemId names.
	 */
	excludeTypes : {
		paggingtoolbar : {
			itemIds : ["first", "prev", "inputItem", "afterTextItem", "next", "last", "refresh", "displayItem"]
		}
	},
	
	/**
	 * Returns the xtypes if comp as array.
	 * @param (AbstractComponent) comp
	 * @return (String []) xtypes of the component
	 */
	getXTypes : function(comp) {
		if (!comp) {
			return [];
		}
		try {
			return comp.getXTypes().split("/").reverse();
		} catch(e) {
			return [];
		}
	},
	
	/**
	 * @param (String[]) xtypes
	 * @return (Boolean) 
	 */
	isExcludeByXType: function(xtypes) {
		var me = this, exclude = false;
		Ext.each(xtypes, function(xtype) {
			var e = me.excludeTypes [xtype];
			if (Ext.isBoolean(e) && e === true) {
				exclude = true;
				return false;
			}
		});
		return exclude;
	},
	
	/**
	 * @param (Container) ownertCt
	 */
	getItemIdsToExclude: function(ownerCt) {
		if (!ownerCt) {
			return [];
		}
		var me = this, 
			xtypes = me.getXTypes(ownerCt),
			itemIds = [];
		Ext.each(xtypes, function(xtype) {
			var e = me.excludeTypes [xtype];
			if (Ext.isArray(e)) {
				itemIds = e;
				return false;
			}
		});
		return itemIds;
	},
	
	getLocalizableProps : function(xtypes) {
		var me = this,
			localizableProps;
		Ext.each(xtypes, function(xtype) {
			localizableProps = me.localizableProps [xtype];
			if (localizableProps) {
				return false;
			}
		});
		return localizableProps;
	},
	
	/**
	 * @private
	 */
	localize2 : function(comp, localizeChildren, localeStrings) {
		var me = this, xtypes = me.getXTypes(comp);
		// Do we have to exclude by xtype?
		if (me.isExcludeByXType(xtypes)) {
			return;
		}
		// If comp has an itemId, do we have to exclude by itemId?
		if (comp.itemId) {
			var itemsToExclude = me.getItemIdsToExclude(comp.ownerCt);
			if (Ext.Array.contains(itemsToExclude, comp.itemId)) {
				return;
			}
		}
		// Do we have to localizeChildren?
		if (localizeChildren) {
			if (comp.items) {
				comp.items.each(function(c) {
					me.localize2(c, localizeChildren, localeStrings);
				});
			}
			if (comp.dockedItems) {
				Ext.each(comp.dockedItems.items, function(c) {
					me.localize2(c, localizeChildren, localeStrings);
				});
			}		
		}
		// This component haves localizable propesties?
		var localizableProps = me.getLocalizableProps(xtypes);
		if (!localizableProps) {
			return;
		}
		// Lets localize this component
        Ext.each(localizableProps, function(localizableProp) {
            var capitalized = Ext.String.capitalize(localizableProp),
				value = comp [localizableProp];
            if (!value) {
                var getFunc = comp ["get" + capitalized];
                if (getFunc) {
                    value = getFunc.call(comp);
                }
            }
            if (!value) {
                return;
            }
			var replace = localeStrings.get(value);
			if (!replace) {
				return;
			}
            var setFunc = comp ["set" + capitalized];
            if (!setFunc) {
				comp [localizableProp] = replace;
			} else {
				setFunc.call(comp, replace);
			}
		});
	},

	localize : function(comp, locale, localizeChildren) {
		// Do we recevived an instance?
		if (!comp) {
			return;
		}
		var me = this;
		if (!locale) {
			locale = me.currLocale;
		}
		if (!locale) {
			return;
		}
		if (!Ext.isDefined(localizeChildren)) {
			localizeChildren = true;
		}
		// Do we have locale strings for received locale?
		var localeStrings = me.getLocaleStrings(locale);
		if (!localeStrings) {
			return;
		}
		me.localize2(comp, localizeChildren, localeStrings);
	},

	/**
	 * @private
	 */
	loadLocaleStrings: function(locale) {
		var me = this, localeStrings;
		Ext.Ajax.request({
			url : "./app/locale/" + locale + ".json",
			async : false,
			success : function(response) {
				var entries = Ext.decode(response.responseText);
				localeStrings = new Ext.util.HashMap();
				Ext.each(entries, function(entry) {
					localeStrings.add(entry.key, entry.value);
				});
				me.locales.add(locale, localeStrings);
			},
			failure : function() {
				me.locales.add(locale, false);
				localeStrings = false;
			}
		});
		return localeStrings;
	},
	
	/**
	 * @private
	 */
	getLocaleStrings: function(locale) {
		var me = this, localeStrings;
		if (!me.locales) {
			me.locales = new Ext.util.HashMap();
			localeStrings = me.loadLocaleStrings(locale);
		} else {
			localeStrings = me.locales.get(locale);
		}
		if (Ext.isBoolean(localeStrings) && !localeStrings) {
			// If locale key contains "false" we
			// tried to load the locale file before 
			// but failed.
			return;
		}
		return localeStrings;
	},
	
	getLocalizedString: function(key, locale) {
		if (!key) {
			return;
		}
		var me = this;
		if (!locale) {
			locale = me.currLocale;
		}
		if (!locale) {
			return key;
		}
		var localeStrings = me.getLocaleStrings(locale);
		if (!localeStrings) {
			return key;
		}
		var localized = localeStrings.get(key);
		if (!localized) {
			return key;
		}
		return localized;
	},
});

Localizer = LS.lib.Localizer;
_ = function(key, locale) {
	return Localizer.getLocalizedString(key, locale);
}